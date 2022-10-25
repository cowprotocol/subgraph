import { BigInt, Bytes, Address, dataSource, BigDecimal } from "@graphprotocol/graph-ts"
import { Settlement } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"
import { getEthPriceInUSD } from "../utils/pricing"

export namespace settlements {

    export function getOrCreateSettlement(blockNumber: BigInt, txHash: Bytes, tradeTimestamp: i32, solver: Address, txGasCost: BigInt, feeAmountUsd: BigDecimal | null): void { 

        let settlementId = txHash.toHexString()
        let network = dataSource.network()

        let settlement = Settlement.load(settlementId)

        let DEFAULT_DECIMALS =  BigInt.fromI32(18)
        let txCostUsd = ZERO_BD
        let txCostNative = convertTokenToDecimal(txGasCost, DEFAULT_DECIMALS)
        if (network == 'xdai') {
            txCostUsd = txCostNative
        } else {
            // txgasPrice in Eth networks is expressed in eth so we need to do a conversion
            let ethPrice = getEthPriceInUSD()
            txCostUsd = txCostNative.times(ethPrice)
        }

        if (!settlement) {
            settlement = new Settlement(settlementId)
            settlement.txHash = txHash
            settlement.blockNumber = blockNumber
            settlement.firstTradeTimestamp = tradeTimestamp
            settlement.solver = solver.toHexString()
            settlement.txCostUsd = txCostUsd
            settlement.txCostNative = txCostNative
            settlement.aggregatedFeeAmountUsd = ZERO_BD
            settlement.profitability = ZERO_BD
            totals.addSettlementCount(tradeTimestamp)
        } 
        if(feeAmountUsd) {
            let prevFeeAmountUsd = settlement.aggregatedFeeAmountUsd
            settlement.aggregatedFeeAmountUsd = prevFeeAmountUsd.plus(feeAmountUsd)
        }
        settlement.profitability = settlement.aggregatedFeeAmountUsd.minus(settlement.txCostUsd)
        settlement.save()
    }
}
