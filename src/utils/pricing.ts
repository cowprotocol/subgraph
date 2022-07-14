/* eslint-disable prefer-const */
import { ONE_BD, ZERO_BD, ZERO_BI } from './constants'
import { Bundle, UniswapPool, UniswapToken } from './../../generated/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import { exponentToBigDecimal, safeDiv } from '../utils/index'

const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const USDC_WETH_03_POOL = '0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8'

// token where amounts should contribute to tracked volume and liquidity
// usually tokens that many tokens are paired with s
// next list and functions were taken from here: 
// https://github.com/Uniswap/v3-subgraph/blob/bf03f940f17c3d32ee58bd37386f26713cff21e2/src/utils/pricing.ts#L12
export let ALLOWED_TOKENS: string[] = [
  WETH_ADDRESS, // WETH
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x0000000000085d4780b73119b644ae5ecd22b376', // TUSD
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', // WBTC
  '0x5d3a536e4d6dbd6114cc1ead35777bab948e3643', // cDAI
  '0x39aa39c021dfbae8fac545936693ac917d5e7563', // cUSDC
  '0x86fadb80d8d2cff3c3680819e4da99c10232ba0f', // EBASE
  '0x57ab1ec28d129707052df4df418d58a2d46d5f51', // sUSD
  '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2', // MKR
  '0xc00e94cb662c3520282e6f5717214004a7f26888', // COMP
  '0x514910771af9ca656af840dff83e8264ecf986ca', // LINK
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f', // SNX
  '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e', // YFI
  '0x111111111117dc0aa78b770fa6a738034120c302', // 1INCH
  '0xdf5e0e81dff6faf3a7e52ba697820c5e32d806a8', // yCurv
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca', // FEI
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0', // MATIC
  '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' // AAVE
]

let STABLE_COINS: string[] = [
  '0x6b175474e89094c44da98b954eedeac495271d0f',
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  '0xdac17f958d2ee523a2206206994597c13d831ec7',
  '0x0000000000085d4780b73119b644ae5ecd22b376',
  '0x956f47f50a910163d8bf957cf5846d573e7f87ca',
  '0x4dd28568d05f09b02220b09c2cb307bfd837cb95'
]


// this is expressed in eth, but it seems to be for considering
// pools of $100K or more .-
let MINIMUM_ETH_LOCKED = BigDecimal.fromString('52')

let twoBI = BigInt.fromI32(2)
let Q192 = twoBI.pow(192)
export function sqrtPriceX96ToTokenPrices(sqrtPriceX96: BigInt, token0: UniswapToken, token1: UniswapToken): BigDecimal[] {
  let num = sqrtPriceX96.times(sqrtPriceX96).toBigDecimal()
  let denom = BigDecimal.fromString(Q192.toString())
  let price1 = safeDiv(safeDiv(num, denom)
    .times(exponentToBigDecimal(BigInt.fromI32(token0.decimals))), exponentToBigDecimal(BigInt.fromI32(token1.decimals)))
  let price0 = safeDiv(BigDecimal.fromString('1'), price1)

  return [price0, price1]
}

export function getEthPriceInUSD(): BigDecimal {
  let usdcPool = UniswapPool.load(USDC_WETH_03_POOL) // dai is token0
  if (usdcPool !== null) {
    return usdcPool.token0Price
  } else {
    return ZERO_BD
  }
}

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: UniswapToken): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }
  let whiteList = token.allowedPools
  // for now just take USD from pool with greatest TVL
  // need to update this to actually detect best rate based on liquidity distribution
  let largestLiquidityETH = ZERO_BD
  let priceSoFar = ZERO_BD
  let bundle = Bundle.load('1')

  // hardcoded fix for incorrect rates
  // if allowed includes token - get the safe price
  if (STABLE_COINS.includes(token.id) && bundle) {
    priceSoFar = safeDiv(ONE_BD, bundle.ethPriceUSD)
  } else {
    for (let i = 0; i < whiteList.length; ++i) {
      let poolAddress = whiteList[i]
      let pool = UniswapPool.load(poolAddress)

      let poolLiquidity = pool ? pool.liquidity : null

      if (poolLiquidity && poolLiquidity.gt(ZERO_BI)) {
        if (pool && pool.token0 == token.id) {
          // allowed token is token1
          let token1 = UniswapToken.load(pool.token1)
          // get the derived ETH in pool
          let token1PriceEth = (token1 && token1.priceEth) ? token1.priceEth as BigDecimal : ONE_BD
          let ethLocked = pool.totalValueLockedToken1.times(token1PriceEth)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
            largestLiquidityETH = ethLocked
            // token1 per our token * Eth per token1
            priceSoFar = pool.token1Price.times(token1PriceEth)
          }
        }
        if (pool && pool.token1 == token.id) {
          let token0 = UniswapToken.load(pool.token0)
          // get the derived ETH in pool
          let token0PriceEth = (token0 && token0.priceEth) ? token0.priceEth as BigDecimal : ONE_BD
          let ethLocked = pool.totalValueLockedToken0.times(token0PriceEth)
          if (ethLocked.gt(largestLiquidityETH) && ethLocked.gt(MINIMUM_ETH_LOCKED)) {
            largestLiquidityETH = ethLocked
            // token0 per our token * ETH per token0
            priceSoFar = pool.token0Price.times(token0PriceEth)
          }
        }
      }
    }
  }
  return priceSoFar // nothing was found return 0
}
