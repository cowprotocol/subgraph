import { BigInt, Bytes, Address, dataSource, BigDecimal } from "@graphprotocol/graph-ts"
import { Settlement } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"
import { getEthPriceInUSD } from "../utils/pricing"

export namespace settlements {

    export function getOrCreateSettlement(txHash: Bytes, tradeTimestamp: i32, solver: Address, txGasPrice: BigInt, feeAmountUsd: BigDecimal): void { 

        let settlementId = txHash.toHexString()
        let network = dataSource.network()

        let settlement = Settlement.load(settlementId)

        let DEFAULT_DECIMALS =  BigInt.fromI32(18)
        let txCostUsd = ZERO_BD
        let txCostNative = ZERO_BD
        if (network == 'xdai') {
            txCostUsd = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
            txCostNative = txCostUsd
        } else {
            // txgasPrice in Eth networks is expressed in eth so we need to do a conversion
            let ethPrice = getEthPriceInUSD()
            let txGasPriceEth = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
            txCostUsd = txGasPriceEth.times(ethPrice)
            txCostNative = txGasPriceEth
        }

        if (!settlement) {
            settlement = new Settlement(settlementId)
            settlement.txHash = txHash
            settlement.firstTradeTimestamp = tradeTimestamp
            settlement.solver = solver.toHexString()
            settlement.txCostUsd = txCostUsd
            settlement.txCostNative = txCostNative
            settlement.aggregatedFeeAmountUsd = ZERO_BD
            settlement.profitability = ZERO_BD
            totals.addSettlementCount(tradeTimestamp)
        } 
        let prevFeeAmountUsd = settlement.aggregatedFeeAmountUsd
        settlement.aggregatedFeeAmountUsd = prevFeeAmountUsd.plus(feeAmountUsd)
        settlement.profitability = settlement.aggregatedFeeAmountUsd.minus(settlement.txCostUsd)
        settlement.save()
    }
}