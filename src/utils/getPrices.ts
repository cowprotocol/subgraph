import {
    Address,
    BigDecimal,
    BigInt,
    dataSource
} from "@graphprotocol/graph-ts"
import { UniswapV2Pair } from '../../generated/GPV2Settlement/UniswapV2Pair'
import { UniswapV2Factory } from '../../generated/GPV2Settlement/UniswapV2Factory'
import {
    ONE_BD,
    ZERO_ADDRESS,
    ZERO_BI,
    UNISWAP_FACTORY,
    STABLECOIN_ADDRESS_GC,
    WETH_ADDRESS_GC,
    EMPTY_RESERVES_RESULT,
    MINUS_ONE_BD
} from "./constants"
import { tokens } from "../modules"

function getPair(token0: Address, token1: Address): Address {
    let factory = UniswapV2Factory.bind(UNISWAP_FACTORY)
    let factoryPairTry = factory.try_getPair(token0, token1)
    return factoryPairTry.reverted ? ZERO_ADDRESS as Address : factoryPairTry.value
}

function valueWithTokenDecimals(val: BigInt, token: Address): BigDecimal {
    let val_bd = val.toBigDecimal()
    let tokenDecimals = tokens.getTokenDecimals(token) as u8
    let pow = BigInt.fromI32(10).pow(tokenDecimals).toBigDecimal()
    return val_bd.div(pow)
}

function calculatePrice(token0: Address, token1: Address, pairToken: Address, reserves0: BigInt, reserves1: BigInt): BigDecimal {
    let reserves0WithDecimals = valueWithTokenDecimals(reserves0, token0)
    let reserves1WithDecimals = valueWithTokenDecimals(reserves1, token1)
    return token0 == pairToken
        ? reserves1WithDecimals.div(reserves0WithDecimals)
        : reserves0WithDecimals.div(reserves1WithDecimals)
}

function getUniswapPricesForPair(token0: Address, token1: Address, isEthPriceCalculation: bool): BigDecimal {
    let pair = UniswapV2Pair.bind(getPair(token0, token1))
    let reservesTry = pair.try_getReserves()
    let reserves = reservesTry.reverted ? EMPTY_RESERVES_RESULT : reservesTry.value
    let pairToken0Try = pair.try_token0()
    let pairToken0 = pairToken0Try.reverted ? ZERO_ADDRESS as Address : pairToken0Try.value
    let pairToken1Try = pair.try_token1()
    let pairToken1 = pairToken1Try.reverted ? ZERO_ADDRESS as Address : pairToken1Try.value

    if (reserves.value0 == ZERO_BI ||
        reserves.value1 == ZERO_BI ||
        pairToken0 == ZERO_ADDRESS ||
        pairToken1 == ZERO_ADDRESS) {
        return MINUS_ONE_BD
    }

    // this call inverts prices depending on token1 is weth or not (find a better way)
    if (isEthPriceCalculation) {
        return calculatePrice(pairToken1, pairToken0, token0, reserves.value1, reserves.value0)
    }
    return calculatePrice(pairToken0, pairToken1, token0, reserves.value0, reserves.value1)
}

export function getPrices(token: Address): Map<string, BigDecimal> {
    let stablecoin = STABLECOIN_ADDRESS_GC
    let weth = WETH_ADDRESS_GC
    let prices = new Map<string, BigDecimal>()

    // logic if token is stablecoin
    if (token.toHex() == stablecoin.toHex()) {
        // price in dolars will be one
        prices.set("usd", ONE_BD)
        // get eth price to calculate it's price in eth
        let priceWethEth = getPrices(weth).get("eth")
        // if eth price can't be fetched it stores minus one in the prop
        if (priceWethEth == MINUS_ONE_BD) {
            prices.set("eth", MINUS_ONE_BD)
        } else {
            // if eth price it stores the division
            prices.set("eth", ONE_BD.div(priceWethEth))
        }
        // returns prices containing both eth and usd
        return prices
    }

    // logic if token is eth
    if (token == weth) {
        // saves eth price in usd
        prices.set("usd", getUniswapPricesForPair(token, stablecoin, false))
        // saves one in eth
        prices.set("eth", ONE_BD)
        // returns prices containing both eth and usd
        return prices
    }

    // logic for the tokens that are not eth or stablecoin
    // gets the price for the token in eth
    let priceEth = getUniswapPricesForPair(token, weth, true)
    prices.set("eth", priceEth)
    // get eth price
    let priceWethUsd = getPrices(weth).get("usd")
    // if eth price can't be calculated it'll be minus one
    if (priceWethUsd == MINUS_ONE_BD) {
        prices.set("usd", MINUS_ONE_BD)
    } else {
        // if can fetch eth price calculate the token price based on that data
        prices.set("usd", priceEth.times(getPrices(weth).get("usd")))
    }
    // returns prices containing both eth and usd
    return prices
}