/* eslint-disable prefer-const */
import { Bundle, UniswapPool, UniswapToken } from '../../generated/schema'
import { BigDecimal, BigInt } from '@graphprotocol/graph-ts'
import {
  Burn as BurnEvent,
  Initialize,
  Mint as MintEvent,
  Swap as SwapEvent
} from '../../generated/templates/Pool/Pool'
import { convertTokenToDecimal } from '../utils'
import { ZERO_BD } from '../utils/constants'
import { findEthPerToken, getEthPriceInUSD, sqrtPriceX96ToTokenPrices } from '../utils/pricing'

export function handleInitialize(event: Initialize): void {
  let pool = UniswapPool.load(event.address.toHexString())
  if (pool) {
    pool.tick = BigInt.fromI32(event.params.tick)
  }

  let token0Id = pool ? pool.token0 : null
  let token1Id = pool ? pool.token1 : null

  let token0 = token0Id ? UniswapToken.load(token0Id) : null
  let token1 = token1Id ? UniswapToken.load(token1Id) : null

  // update ETH price now that prices could have changed
  let bundle = Bundle.load('1')
  if (bundle) {
    bundle.ethPriceUSD = getEthPriceInUSD()
   // update token prices
    if (token0) {
      token0.priceEth = findEthPerToken(token0 as UniswapToken)
      let token0PriceEth = token0.priceEth
      token0.priceUsd = token0PriceEth ? token0PriceEth.times(bundle.ethPriceUSD) : null
      token0.save()
    }
    if (token1) {
      token1.priceEth = findEthPerToken(token1 as UniswapToken)
      let token1PriceEth = token1.priceEth
      token1.priceUsd = token1PriceEth ? token1PriceEth.times(bundle.ethPriceUSD) : null
      token1.save()
    } bundle.save()
  }
  
}

export function handleMint(event: MintEvent): void {
  let poolAddress = event.address.toHexString()
  let pool = UniswapPool.load(poolAddress)

  let token0Id = pool ? pool.token0 : null
  let token1Id = pool ? pool.token1 : null

  let token0 = token0Id ? UniswapToken.load(token0Id) : null
  let token1 = token1Id ? UniswapToken.load(token1Id) : null

  let token0Decimals = token0 ? token0.decimals : 0
  let token1Decimals = token1 ? token1.decimals : 0

  let amount0 = token0Decimals ? convertTokenToDecimal(event.params.amount0, BigInt.fromI32(token0Decimals)) : null
  let amount1 = token1Decimals ? convertTokenToDecimal(event.params.amount1, BigInt.fromI32(token1Decimals)) : null

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on mint if the new position includes the current tick.
  if (
    pool &&
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.plus(event.params.amount)
  }

  if (pool && amount0) {
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
  }
  if (pool && amount1) {
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
  }

  // TODO: Update Tick's volume, fees, and liquidity provider count. Computing these on the tick
  // level requires reimplementing some of the swapping code from v3-core.

  if (token0) {
    token0.save()
  }
  if (token1) {
    token1.save()
  }
  if (pool) {
    pool.save()
  }

}

export function handleBurn(event: BurnEvent): void {
  let poolAddress = event.address.toHexString()
  let pool = UniswapPool.load(poolAddress)

  let token0Id = pool ? pool.token0 : null
  let token1Id = pool ? pool.token1 : null

  let token0 = token0Id ? UniswapToken.load(token0Id) : null
  let token1 = token1Id ? UniswapToken.load(token1Id) : null

  let token0Decimals = token0 ? token0.decimals : 0
  let token1Decimals = token1 ? token1.decimals : 0

  let amount0 = token0Decimals ? convertTokenToDecimal(event.params.amount0, BigInt.fromI32(token0Decimals)) : null
  let amount1 = token1Decimals ? convertTokenToDecimal(event.params.amount1, BigInt.fromI32(token1Decimals)) : null

  // Pools liquidity tracks the currently active liquidity given pools current tick.
  // We only want to update it on burn if the position being burnt includes the current tick.
  if (
    pool &&
    pool.tick !== null &&
    BigInt.fromI32(event.params.tickLower).le(pool.tick as BigInt) &&
    BigInt.fromI32(event.params.tickUpper).gt(pool.tick as BigInt)
  ) {
    pool.liquidity = pool.liquidity.minus(event.params.amount)
  }

  if (pool && amount0) {
    pool.totalValueLockedToken0 = pool.totalValueLockedToken0.minus(amount0)
  }
  if (pool && amount1) {
    pool.totalValueLockedToken1 = pool.totalValueLockedToken1.minus(amount1)
  }

  // TODO: Update Tick's volume, fees, and liquidity provider count. Computing these on the tick
  // level requires reimplementing some of the swapping code from v3-core.

  if (token0) {
    token0.save()
  }
  if (token1) {
    token1.save()
  }
  if (pool) {
    pool.save()
  }
}

export function handleSwap(event: SwapEvent): void {
  let bundle = Bundle.load('1')
  let pool = UniswapPool.load(event.address.toHexString())

  // hot fix for bad pricing
  if (pool && pool.id == '0x9663f2ca0454accad3e094448ea6f77443880454') {
    return
  }

  let token0Id = pool ? pool.token0 : null
  let token1Id = pool ? pool.token1 : null

  let token0 = token0Id ? UniswapToken.load(token0Id) : null
  let token1 = token1Id ? UniswapToken.load(token1Id) : null

  // amounts - 0/1 are token deltas: can be positive or negative
  let token0Decimals = token0 ? token0.decimals : 0
  let token1Decimals = token1 ? token1.decimals : 0

  let amount0 = token0Decimals ? convertTokenToDecimal(event.params.amount0, BigInt.fromI32(token0Decimals)) : null
  let amount1 = token1Decimals ? convertTokenToDecimal(event.params.amount1, BigInt.fromI32(token1Decimals)) : null

  // need absolute amounts for volume
  let amount0Abs = amount0
  if (amount0 && amount0.lt(ZERO_BD)) {
    amount0Abs = amount0.times(BigDecimal.fromString('-1'))
  }
  let amount1Abs = amount1
  if (amount1 && amount1.lt(ZERO_BD)) {
    amount1Abs = amount1.times(BigDecimal.fromString('-1'))
  }

  // Update the pool with the new active liquidity, price, and tick.
  if (pool) {
    pool.liquidity = event.params.liquidity
    pool.tick = BigInt.fromI32(event.params.tick as i32)
    if (amount0){
      pool.totalValueLockedToken0 = pool.totalValueLockedToken0.plus(amount0)
    }
    if (amount1){
      pool.totalValueLockedToken1 = pool.totalValueLockedToken1.plus(amount1)
    }
    // updated pool ratess
    let prices = sqrtPriceX96ToTokenPrices(event.params.sqrtPriceX96, token0 as UniswapToken, token1 as UniswapToken)
    pool.token0Price = prices[0]
    pool.token1Price = prices[1]
    pool.save()
  }


  // update USD pricing
  if (bundle) {
    bundle.ethPriceUSD = getEthPriceInUSD()
    bundle.save()
    if (token0) {
      token0.priceEth = findEthPerToken(token0 as UniswapToken)
      let token0PriceEth = token0.priceEth
      token0.priceUsd = token0PriceEth ? token0PriceEth.times(bundle.ethPriceUSD) : null
      token0.save()
    }
    if (token1) {
      token1.priceEth = findEthPerToken(token1 as UniswapToken)
      let token1PriceEth = token1.priceEth
      token1.priceUsd = token1PriceEth ? token1PriceEth.times(bundle.ethPriceUSD) : null
      token1.save()
    }
  }
}
