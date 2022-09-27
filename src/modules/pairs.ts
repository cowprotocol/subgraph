import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { PairDaily, PairHourly, Pair } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

export namespace pairs {

  export class TokenProps {
    token: string
    volume: BigDecimal
    price: BigDecimal | null
    relativePrice: BigDecimal
    constructor(
      _token: string,
      _volume: BigDecimal,
      _price: BigDecimal | null,
      _relativePrice: BigDecimal
    ) {
      this.token = _token
      this.volume = _volume
      this.price = _price
      this.relativePrice = _relativePrice
    }
  }

  export function createOrUpdatePair(timestamp: i32, buyTokenId: string, sellTokenId: string, 
    sellAmountEth: BigDecimal | null, sellAmountUsd: BigDecimal | null, buyTokenPriceUsd: BigDecimal | null, sellTokenPriceUsd: BigDecimal | null,
    buyAmountDecimals: BigDecimal, sellAmountDecimals: BigDecimal): void {
    let canonicalMarket = getCanonicalMarket(buyTokenId, sellTokenId, buyTokenPriceUsd, sellTokenPriceUsd, buyAmountDecimals, sellAmountDecimals)

    let token0Props = canonicalMarket.get("token0")
    let token0 = token0Props.token
    let volumeToken0 = token0Props.volume
    let priceToken0 = token0Props.price
    let token0RelativePrice = token0Props.relativePrice

    let token1Props = canonicalMarket.get("token1")
    let token1 = token1Props.token
    let volumeToken1 = token1Props.volume
    let priceToken1 = token1Props.price
    let token1RelativePrice = token1Props.relativePrice

    let pairTotal = getOrCreatePair(token0, token1)
    let pairDailyTotal = getOrCreatePairDaily(token0, token1, timestamp)
    let pairHourlyTotal = getOrCreatePairHourly(token0, token1, timestamp)

    totalsUpdate(timestamp, pairTotal, pairDailyTotal, pairHourlyTotal,
      volumeToken0, volumeToken1, priceToken0, priceToken1,
      token0RelativePrice, token1RelativePrice,
      sellAmountEth, sellAmountUsd)
  }

  function getCanonicalMarket(buyTokenId: string, sellTokenId: string, 
    buyTokenPriceUsd: BigDecimal | null, sellTokenPriceUsd: BigDecimal | null,
    buyAmountDecimals: BigDecimal, sellAmountDecimals: BigDecimal): Map<string, TokenProps> {
    let buyTokenAddress = Address.fromString(buyTokenId)
    let sellTokenAddress = Address.fromString(sellTokenId)
    let buyTokenNumber = BigInt.fromUnsignedBytes(buyTokenAddress)
    let sellTokenNumber = BigInt.fromUnsignedBytes(sellTokenAddress)
    let value = new Map<string, TokenProps>()

    let buyTokenExpressedOnSellToken = ZERO_BD
    let sellTokenExpressedOnBuyToken = ZERO_BD

    // to prevent div 0 exception
    if (sellAmountDecimals.notEqual(ZERO_BD)) {
      buyTokenExpressedOnSellToken = buyAmountDecimals.div(sellAmountDecimals)
    }
    if (buyAmountDecimals.notEqual(ZERO_BD)) {
      sellTokenExpressedOnBuyToken = sellAmountDecimals.div(buyAmountDecimals)
    }

    let buyTokenProps = new TokenProps(buyTokenId, buyAmountDecimals, buyTokenPriceUsd, buyTokenExpressedOnSellToken)
    let sellTokenProps = new TokenProps(sellTokenId, sellAmountDecimals, sellTokenPriceUsd, sellTokenExpressedOnBuyToken)

    if (buyTokenNumber.lt(sellTokenNumber)) {
      value.set("token0", buyTokenProps)
      value.set("token1", sellTokenProps)
    } else {
      value.set("token0", sellTokenProps)
      value.set("token1", buyTokenProps)
    }

    return value
  }

  function totalsUpdate(timestamp: i32, pair: Pair, pairDaily: PairDaily, pairHourly: PairHourly, volumeToken0: BigDecimal, volumeToken1: BigDecimal,
    priceToken0: BigDecimal | null, priceToken1: BigDecimal | null, token0RelativePrice: BigDecimal, token1RelativePrice: BigDecimal,
    sellAmountEth: BigDecimal | null, sellAmountUsd: BigDecimal | null): void {

    let prevPairTotalVolume0 = pair.volumeToken0
    let prevPairTotalVolume1 = pair.volumeToken1
    let prevPairTotalEth = pair.volumeTradedEth
    let prevPairTotalUsd = pair.volumeTradedUsd

    let prevPairDailyVolume0 = pairDaily.volumeToken0
    let prevPairDailyVolume1 = pairDaily.volumeToken1
    let prevPairDailyEth = pairDaily.volumeTradedEth
    let prevPairDailyUsd = pairDaily.volumeTradedUsd

    let prevPairHourlyVolume0 = pairHourly.volumeToken0
    let prevPairHourlyVolume1 = pairHourly.volumeToken1
    let prevPairHourlyEth = pairHourly.volumeTradedEth
    let prevPairHourlyUsd = pairHourly.volumeTradedUsd


    // Updates volumes for a pair 
    pair.volumeToken0 = prevPairTotalVolume0.plus(volumeToken0)
    pair.volumeToken1 = prevPairTotalVolume1.plus(volumeToken1)
    if (prevPairTotalEth !== null && sellAmountEth) {
        pair.volumeTradedEth = prevPairTotalEth.plus(sellAmountEth)
    }
    if (prevPairTotalUsd !== null && sellAmountUsd) {
      pair.volumeTradedUsd = prevPairTotalUsd.plus(sellAmountUsd)
    }
    pair.token0Usd = priceToken0
    pair.token1Usd = priceToken1
    pair.token0PriceInToken1 = token0RelativePrice
    pair.token1PriceInToken0 = token1RelativePrice
    pair.lastTradeTimestamp = timestamp
    pair.save()

    // update volumes for a pair daily totals
    pairDaily.volumeToken0 = prevPairDailyVolume0.plus(volumeToken0)
    pairDaily.volumeToken1 = prevPairDailyVolume1.plus(volumeToken1)
    pairDaily.volumeTradedEth = sellAmountEth && prevPairDailyEth ? prevPairDailyEth.plus(sellAmountEth) : prevPairDailyEth
    pairDaily.volumeTradedUsd = sellAmountUsd && prevPairDailyUsd ? prevPairDailyUsd.plus(sellAmountUsd) : prevPairDailyUsd
    pairDaily.token0Usd = priceToken0
    pairDaily.token1Usd = priceToken1
    pairDaily.token0PriceInToken1 = token0RelativePrice
    pairDaily.token1PriceInToken0 = token1RelativePrice
    pairDaily.save()

    // update volumes for a pair hourly totals
    pairHourly.volumeToken0 = prevPairHourlyVolume0.plus(volumeToken0)
    pairHourly.volumeToken1 = prevPairHourlyVolume1.plus(volumeToken1)
    pairHourly.volumeTradedEth = sellAmountEth && prevPairHourlyEth ? prevPairHourlyEth.plus(sellAmountEth) : prevPairHourlyEth
    pairHourly.volumeTradedUsd = sellAmountUsd && prevPairHourlyUsd ? prevPairHourlyUsd.plus(sellAmountUsd) : prevPairHourlyUsd
    pairHourly.token0Usd = priceToken0
    pairHourly.token1Usd = priceToken1
    pairHourly.token0PriceInToken1 = token0RelativePrice
    pairHourly.token1PriceInToken0 = token1RelativePrice
    pairHourly.save()
  }


  function getOrCreatePair(token0: string, token1: string): Pair {
    let id = token0 + "-" + token1
    let pairTotal = Pair.load(id)

    if (!pairTotal) {
      pairTotal = new Pair(id)
      pairTotal.token0 = token0
      pairTotal.token1 = token1
      pairTotal.volumeToken0 = ZERO_BD
      pairTotal.volumeToken1 = ZERO_BD
      pairTotal.volumeTradedEth = ZERO_BD
      pairTotal.volumeTradedUsd = ZERO_BD
    }

    return pairTotal as Pair
  }

  function getOrCreatePairDaily(token0: string, token1: string, timestamp: i32): PairDaily {
    let dailyTimestamp = getDayTotalTimestamp(timestamp)
    let id = token0 + "-" + token1 + "-" + dailyTimestamp.toString()
    let pairDailyTotal = PairDaily.load(id)

    if (!pairDailyTotal) {
      pairDailyTotal = new PairDaily(id)
      pairDailyTotal.token0 = token0
      pairDailyTotal.token1 = token1
      pairDailyTotal.timestamp = timestamp
      pairDailyTotal.volumeToken0 = ZERO_BD
      pairDailyTotal.volumeToken1 = ZERO_BD
      pairDailyTotal.volumeTradedEth = ZERO_BD
      pairDailyTotal.volumeTradedUsd = ZERO_BD
    }

    return pairDailyTotal as PairDaily

  }

  function getOrCreatePairHourly(token0: string, token1: string, timestamp: i32): PairHourly {
    let hourlyTimestamp = getHourTotalTimestamp(timestamp)
    let id = token0 + "-" + token1 + "-" + hourlyTimestamp.toString()
    let pairHourlyTotal = PairHourly.load(id)

    if (!pairHourlyTotal) {
      pairHourlyTotal = new PairHourly(id)
      pairHourlyTotal.token0 = token0
      pairHourlyTotal.token1 = token1
      pairHourlyTotal.timestamp = timestamp
      pairHourlyTotal.volumeToken0 = ZERO_BD
      pairHourlyTotal.volumeToken1 = ZERO_BD
      pairHourlyTotal.volumeTradedEth = ZERO_BD
      pairHourlyTotal.volumeTradedUsd = ZERO_BD
    }

    return pairHourlyTotal as PairHourly

  }
}
