import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { PairDaily, PairHourly, Pair } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

export namespace pairs {

  export class TokenProps {
    token: string
    volume: BigInt
    price: BigDecimal
		constructor(
      _token: string,
      _volume: BigInt,
      _price: BigDecimal,
    ) {
      this.token = _token
      this.volume = _volume
      this.price = _price
    }
  }

  export function createOrUpdatePair(timestamp: BigInt, buyTokenId: string, sellTokenId: string, buyAmount: BigInt, sellAmount: BigInt,
    sellAmountEth: BigDecimal, sellAmountUsd: BigDecimal, buyTokenPrice: BigDecimal, sellTokenPrice: BigDecimal): void {
    let canonicalMarket = getCanonicalMarket(buyTokenId, sellTokenId, buyAmount, sellAmount, buyTokenPrice, sellTokenPrice)

    let token0Props = canonicalMarket.get("token0")
    let token0 = token0Props.token
    let volumeToken0 = token0Props.volume
    let priceToken0 = token0Props.price

    let token1Props = canonicalMarket.get("token1")
    let token1 = token1Props.token
    let volumeToken1 = token1Props.volume
    let priceToken1 = token1Props.price

    let pairTotal = getOrCreatePair(token0, token1)
    let pairDailyTotal = getOrCreatePairDaily(token0, token1, timestamp)
    let pairHourlyTotal = getOrCreatePairHourly(token0, token1, timestamp)

    totalsUpdate(pairTotal, pairDailyTotal, pairHourlyTotal, volumeToken0, volumeToken1, priceToken0, priceToken1, sellAmountEth, sellAmountUsd)
  }

  function getCanonicalMarket(buyTokenId: string, sellTokenId: string, buyAmount: BigInt, sellAmount: BigInt,
    buyTokenPrice: BigDecimal, sellTokenPrice: BigDecimal): Map<string, TokenProps> {
    let buyTokenAddress = Address.fromString(buyTokenId)
    let sellTokenAddress = Address.fromString(sellTokenId)
    let buyTokenNumber = BigInt.fromUnsignedBytes(buyTokenAddress)
    let sellTokenNumber = BigInt.fromUnsignedBytes(sellTokenAddress)
    let value = new Map<string, TokenProps>()

    let buyTokenProps = new TokenProps(buyTokenId, buyAmount, buyTokenPrice)
    let sellTokenProps = new TokenProps(sellTokenId, sellAmount, sellTokenPrice)

    if (buyTokenNumber.lt(sellTokenNumber)) {
      value.set("token0", buyTokenProps)
      value.set("token1", sellTokenProps)
    } else {
      value.set("token0", sellTokenProps)
      value.set("token1", buyTokenProps)
    }

    return value
  }

  function totalsUpdate(pair: Pair, pairDaily: PairDaily, pairHourly: PairHourly, volumeToken0: BigInt, volumeToken1: BigInt, 
    priceToken0: BigDecimal, priceToken1: BigDecimal, sellAmountEth: BigDecimal, sellAmountUsd: BigDecimal): void {

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
    pair.volumeTradedEth = prevPairTotalEth.plus(sellAmountEth)
    pair.volumeTradedUsd = prevPairTotalUsd.plus(sellAmountUsd)
    pair.token0Price = priceToken0
    pair.token1Price = priceToken1
    pair.save()

    // update volumes for a pair daily totals
    pairDaily.volumeToken0 = prevPairDailyVolume0.plus(volumeToken0)
    pairDaily.volumeToken1 = prevPairDailyVolume1.plus(volumeToken1)
    pairDaily.volumeTradedEth = prevPairDailyEth.plus(sellAmountEth)
    pairDaily.volumeTradedUsd = prevPairDailyUsd.plus(sellAmountUsd)
    pairDaily.token0Price = priceToken0
    pairDaily.token1Price = priceToken1
    pairDaily.save()

    // update volumes for a pair hourly totals
    pairHourly.volumeToken0 = prevPairHourlyVolume0.plus(volumeToken0)
    pairHourly.volumeToken1 = prevPairHourlyVolume1.plus(volumeToken1)
    pairHourly.volumeTradedEth = prevPairHourlyEth.plus(sellAmountEth)
    pairHourly.volumeTradedUsd = prevPairHourlyUsd.plus(sellAmountUsd)
    pairHourly.token0Price = priceToken0
    pairHourly.token1Price = priceToken1
    pairHourly.save()
  }


  function getOrCreatePair(token0: string, token1: string): Pair {
    let id = token0 + "-" + token1
    let pairTotal = Pair.load(id)

    if (!pairTotal) {
      pairTotal = new Pair(id)
      pairTotal.token0 = token0
      pairTotal.token1 = token1
      pairTotal.volumeToken0 = ZERO_BI
      pairTotal.volumeToken1 = ZERO_BI
      pairTotal.volumeTradedEth = ZERO_BD
      pairTotal.volumeTradedUsd = ZERO_BD
    }

    return pairTotal as Pair
  }

  function getOrCreatePairDaily(token0: string, token1: string, timestamp: BigInt): PairDaily {
    let dailyTimestamp = getDayTotalTimestamp(timestamp)
    let id = token0 + "-" + token1 + "-" + dailyTimestamp.toString()
    let pairDailyTotal = PairDaily.load(id)

    if (!pairDailyTotal) {
      pairDailyTotal = new PairDaily(id)
      pairDailyTotal.token0 = token0
      pairDailyTotal.token1 = token1
      pairDailyTotal.timestamp = timestamp
      pairDailyTotal.volumeToken0 = ZERO_BI
      pairDailyTotal.volumeToken1 = ZERO_BI
      pairDailyTotal.volumeTradedEth = ZERO_BD
      pairDailyTotal.volumeTradedUsd = ZERO_BD
    }

    return pairDailyTotal as PairDaily

  }

  function getOrCreatePairHourly(token0: string, token1: string, timestamp: BigInt): PairHourly {
    let hourlyTimestamp = getHourTotalTimestamp(timestamp)
    let id = token0 + "-" + token1 + "-" + hourlyTimestamp.toString()
    let pairHourlyTotal = PairHourly.load(id)

    if (!pairHourlyTotal) {
      pairHourlyTotal = new PairHourly(id)
      pairHourlyTotal.token0 = token0
      pairHourlyTotal.token1 = token1
      pairHourlyTotal.timestamp = timestamp
      pairHourlyTotal.volumeToken0 = ZERO_BI
      pairHourlyTotal.volumeToken1 = ZERO_BI
      pairHourlyTotal.volumeTradedEth = ZERO_BD
      pairHourlyTotal.volumeTradedUsd = ZERO_BD
    }

    return pairHourlyTotal as PairHourly

  }
}
