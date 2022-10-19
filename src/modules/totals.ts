import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { DailyTotal, HourlyTotal, Total } from "../../generated/schema";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

export namespace totals {

    function getOrCreateTotals(): Total {
        let total = Total.load("1")
        if(!total) {
            total = new Total("1")
            total.tokens = ZERO_BI
            total.orders = ZERO_BI
            total.traders = ZERO_BI
            total.settlements = ZERO_BI
            total.volumeEth = ZERO_BD
            total.volumeUsd = ZERO_BD
            total.feesEth = ZERO_BD
            total.feesUsd = ZERO_BD
            total.numberOfTrades = ZERO_BI
        }
        
        return total as Total
    }

    function getOrCreateDailyTotals(timestamp: i32): DailyTotal {
        let totalId = timestamp.toString()
        let total = DailyTotal.load(totalId)

        if(!total) {
            total = new DailyTotal(totalId)
            total.timestamp = timestamp
       //     total.totalTokens = ZERO_BI
            total.orders = ZERO_BI
            total.settlements = ZERO_BI
            total.volumeUsd = ZERO_BD
            total.volumeEth = ZERO_BD
            total.feesUsd = ZERO_BD
            total.feesEth = ZERO_BD
            total.numberOfTrades = ZERO_BI
        //    total.tokens = []
        }

        return total as DailyTotal
    }

    function getOrCreateHourlyTotals(timestamp: i32): HourlyTotal {
        let totalId = timestamp.toString()
        let total = HourlyTotal.load(totalId)

        if(!total) {
            total = new HourlyTotal(totalId)
            total.timestamp = timestamp
        //   total.totalTokens = ZERO_BI
            total.orders = ZERO_BI
            total.settlements = ZERO_BI
            total.volumeUsd = ZERO_BD
            total.volumeEth = ZERO_BD
            total.feesUsd = ZERO_BD
            total.feesEth = ZERO_BD
            total.numberOfTrades = ZERO_BI
        //    total.tokens = []
        }

        return total as HourlyTotal
    }

    export function updateTokenTotalsCount(): void {
        let total = getOrCreateTotals()
        let prevTokensCount = total.tokens
        total.tokens = prevTokensCount.plus(ONE_BI)
        total.save()
    }
//    We made the decision to avoid this for now.
//    https://github.com/cowprotocol/subgraph/issues/47#issuecomment-1183515135
//
//    function updateDailyTokensCount(timestamp: i32, tokenId: string): void {
//        let total = getOrCreateDailyTotals(timestamp)
//        let prevtotalTokens = total.totalTokens
//        let prevTokens = total.tokens
//        prevTokens.push(tokenId)
//        total.tokens = prevTokens
//        total.totalTokens = prevtotalTokens.plus(ONE_BI)
//        total.save()
//    }
//
//    function updateHourlyTokensCount(timestamp: i32, tokenId: string): void {
//        let total = getOrCreateHourlyTotals(timestamp)
//        let prevtotalTokens = total.totalTokens
//        let prevTokens = total.tokens
//        prevTokens.push(tokenId)
//        total.tokens = prevTokens
//        total.totalTokens = prevtotalTokens.plus(ONE_BI)
//        total.save()
//    }
//
//    export function addTokenCount(timestamp: i32, tokenId: string): void{
//        let dayTimestamp = getDayTotalTimestamp(timestamp)
//        let hourTimestamp = getHourTotalTimestamp(timestamp)
//         updateDailyTokensCount(dayTimestamp, tokenId)
//         updateHourlyTokensCount(hourTimestamp, tokenId)
//        updateTokenTotalsCount()
//    }

    function updateOrdersTotalsCount(): void {
        let total = getOrCreateTotals()
        let prevOrdersCount = total.orders
        total.orders = prevOrdersCount.plus(ONE_BI)
        total.save()
    }

    function updateHourlyOrdersCount(timestamp: i32): void {
        let total = getOrCreateHourlyTotals(timestamp)
        let prevtotalOrders = total.orders

        total.orders = prevtotalOrders.plus(ONE_BI)
        total.save()
    }

    function updateDailyOrdersCount(timestamp: i32): void {
        let total = getOrCreateDailyTotals(timestamp)
        let prevtotalOrders = total.orders

        total.orders = prevtotalOrders.plus(ONE_BI)
        total.save()
    }

    export function addOrderCount(timestamp: i32): void {
        let dayTimestamp = getDayTotalTimestamp(timestamp)
        let hourTimestamp = getHourTotalTimestamp(timestamp)
        updateDailyOrdersCount(dayTimestamp)
        updateHourlyOrdersCount(hourTimestamp)
        updateOrdersTotalsCount()
    }

    export function addTraderCount(): void {
        let total = getOrCreateTotals()
        let prevTradersCount = total.traders
        total.traders = prevTradersCount.plus(ONE_BI)
        total.save()
    }

    function updateSettlementsTotalsCount(): void{
        let total = getOrCreateTotals()
        let prevSettlementsCount = total.settlements
        total.settlements = prevSettlementsCount.plus(ONE_BI)
        total.save()
    }

    function updateDailySettlementsCount(timestamp: i32): void {
        let total = getOrCreateDailyTotals(timestamp)
        let prevtotalSettlements = total.settlements

        total.settlements = prevtotalSettlements.plus(ONE_BI)
        total.save()
    }

    function updateHourlySettlementsCount(timestamp: i32): void {
        let total = getOrCreateHourlyTotals(timestamp)
        let prevtotalSettlements = total.settlements

        total.settlements = prevtotalSettlements.plus(ONE_BI)
        total.save()
    }

    export function addSettlementCount(timestamp: i32): void {
        let dayTimestamp = getDayTotalTimestamp(timestamp)
        let hourTimestamp = getHourTotalTimestamp(timestamp)
        updateDailySettlementsCount(dayTimestamp)
        updateHourlySettlementsCount(hourTimestamp)
        updateSettlementsTotalsCount()
    }


    function updateVolumesAndFeesTotals(volumeEth: BigDecimal | null, volumeUsd: BigDecimal | null, feesEth: BigDecimal | null, feesUsd: BigDecimal | null): void {
        let total = getOrCreateTotals()
        let prevVolumeEth = total.volumeEth
        let prevVolumeUsd = total.volumeUsd
        let prevFeesEth = total.feesEth
        let prevFeesUsd = total.feesUsd
        let prevTrades = total.numberOfTrades

        if (volumeEth && prevVolumeEth) {
            total.volumeEth = prevVolumeEth.plus(volumeEth)
        }
        if (volumeUsd && prevVolumeUsd) {
            total.volumeUsd = prevVolumeUsd.plus(volumeUsd)
        }
        if (feesEth && prevFeesEth) {
            total.feesEth = prevFeesEth.plus(feesEth)
        }
        if (feesUsd && prevFeesUsd) {
            total.feesUsd = prevFeesUsd.plus(feesUsd)
        }
        total.numberOfTrades = prevTrades.plus(ONE_BI)
        total.save()
    }

    function updateHourlyVolumesAndFees(volumeEth: BigDecimal | null, volumeUsd: BigDecimal | null, feesEth: BigDecimal | null, feesUsd: BigDecimal | null, timestamp: i32): void {
        let total = getOrCreateHourlyTotals(timestamp)
        let prevVolumeEth = total.volumeEth
        let prevVolumeUsd = total.volumeUsd
        let prevFeesEth = total.feesEth
        let prevFeesUsd = total.feesUsd
        let prevTrades = total.numberOfTrades

        if (volumeEth && prevVolumeEth) {
            total.volumeEth = prevVolumeEth.plus(volumeEth)
        }
        if (volumeUsd && prevVolumeUsd) {
            total.volumeUsd = prevVolumeUsd.plus(volumeUsd)
        }
        if (feesEth && prevFeesEth) {
            total.feesEth = prevFeesEth.plus(feesEth)
        }
        if (feesUsd && prevFeesUsd) {
            total.feesUsd = prevFeesUsd.plus(feesUsd)
        }
        total.numberOfTrades = prevTrades.plus(ONE_BI)
        total.save()
    }

    function updateDailyVolumesAndFees(volumeEth: BigDecimal | null, volumeUsd: BigDecimal | null, feesEth: BigDecimal | null, feesUsd: BigDecimal | null, timestamp: i32): void {
        let total = getOrCreateDailyTotals(timestamp)
        let prevVolumeEth = total.volumeEth
        let prevVolumeUsd = total.volumeUsd
        let prevFeesEth = total.feesEth
        let prevFeesUsd = total.feesUsd
        let prevTrades = total.numberOfTrades

        if (volumeEth && prevVolumeEth) {
            total.volumeEth = prevVolumeEth.plus(volumeEth)
        }
        if (volumeUsd && prevVolumeUsd) {
            total.volumeUsd = prevVolumeUsd.plus(volumeUsd)
        }
        if (feesEth && prevFeesEth) {
            total.feesEth = prevFeesEth.plus(feesEth)
        }
        if (feesUsd && prevFeesUsd) {
            total.feesUsd = prevFeesUsd.plus(feesUsd)
        }
        total.numberOfTrades = prevTrades.plus(ONE_BI)
        total.save()
    }

    export function addVolumesAndFees(volumeEth: BigDecimal | null, volumeUsd: BigDecimal | null, feesEth: BigDecimal | null, feesUsd: BigDecimal | null, timestamp: i32): void {
        let dayTimestamp = getDayTotalTimestamp(timestamp)
        let hourTimestamp = getHourTotalTimestamp(timestamp)
        updateDailyVolumesAndFees(volumeEth, volumeUsd, feesEth, feesUsd, dayTimestamp)
        updateHourlyVolumesAndFees(volumeEth, volumeUsd, feesEth, feesUsd, hourTimestamp)
        updateVolumesAndFeesTotals(volumeEth, volumeUsd, feesEth, feesUsd)
    }
}