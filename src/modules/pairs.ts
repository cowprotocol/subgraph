import { BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import { PairDaily, PairHourly, Pair } from "../../generated/schema";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

export namespace pairs {
    export function createOrUpdatePair(timestamp: i32, buyTokenId: string, sellTokenId: string, buyAmount: BigInt, sellAmount: BigInt, sellAmountEth: BigDecimal, sellAmountUsd: BigDecimal): void {
        let canonicalMarket = getCanonicalMarket(buyTokenId, sellTokenId, buyAmount, sellAmount)
        
        let token0 = canonicalMarket.get("token0")
        let volumeToken0 = BigInt.fromString(canonicalMarket.get("volumeToken0"))
        let token1 = canonicalMarket.get("token1")
        let volumeToken1 = BigInt.fromString(canonicalMarket.get("volumeToken1"))

        let pairTotal = getOrCreatePair(token0, token1)
        let pairDailyTotal = getOrCreatePairDaily(token0, token1, timestamp)
        let pairHourlyTotal = getOrCreatePairHourly(token0, token1, timestamp)

        totalsUpdate(pairTotal, pairDailyTotal, pairHourlyTotal, volumeToken0, volumeToken1, sellAmountEth, sellAmountUsd)
    }

    function getCanonicalMarket(buyTokenId: string, sellTokenId: string, buyAmount: BigInt, sellAmount: BigInt): Map<string, string> {
        let buyTokenAddress = Address.fromString(buyTokenId)
        let sellTokenAddress = Address.fromString(sellTokenId)
        let buyTokenNumber = BigInt.fromUnsignedBytes(buyTokenAddress)
        let sellTokenNumber = BigInt.fromUnsignedBytes(sellTokenAddress)
        let value = new Map<string, string>()

        if (buyTokenNumber.lt(sellTokenNumber)) {
            value.set("token0", buyTokenId)
            value.set("volumeToken0", buyAmount.toString())
            value.set("token1", sellTokenId)
            value.set("volumeToken1", sellAmount.toString())
        } else {
            value.set("token0", sellTokenId)
            value.set("volumeToken0", sellAmount.toString())
            value.set("token1", buyTokenId)
            value.set("volumeToken1", buyAmount.toString())
        }

        return value
    }

    function totalsUpdate(pair: Pair, pairDaily: PairDaily, pairHourly: PairHourly, volumeToken0: BigInt, volumeToken1: BigInt, sellAmountEth: BigDecimal, sellAmountUsd: BigDecimal): void {

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
        pair.save()

        // update volumes for a pair daily totals
        pairDaily.volumeToken0 = prevPairDailyVolume0.plus(volumeToken0)
        pairDaily.volumeToken1 = prevPairDailyVolume1.plus(volumeToken1)
        pairDaily.volumeTradedEth = prevPairDailyEth.plus(sellAmountEth)
        pairDaily.volumeTradedUsd = prevPairDailyUsd.plus(sellAmountUsd)
        pairDaily.save()

        // update volumes for a pair hourly totals
        pairHourly.volumeToken0 = prevPairHourlyVolume0.plus(volumeToken0)
        pairHourly.volumeToken1 = prevPairHourlyVolume1.plus(volumeToken1)
        pairHourly.volumeTradedEth = prevPairHourlyEth.plus(sellAmountEth)
        pairHourly.volumeTradedUsd = prevPairHourlyUsd.plus(sellAmountUsd)
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

    function getOrCreatePairDaily(token0: string, token1: string, timestamp: i32): PairDaily {
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

    function getOrCreatePairHourly(token0: string, token1: string, timestamp: i32): PairHourly {
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
 