import { BigInt, Bytes, Address, dataSource } from "@graphprotocol/graph-ts"
import { Settlement } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"
import { getEthPriceInUSD } from "../utils/pricing"

export namespace settlements {

    export function getOrCreateSettlement(txHash: Bytes, tradeTimestamp: i32, solver: Address, txGasPrice: BigInt): void { 

        let settlementId = txHash.toHexString()
        let network = dataSource.network()

        let settlement = Settlement.load(settlementId)

        let DEFAULT_DECIMALS =  BigInt.fromI32(18)
        let gasPriceUsd = ZERO_BD
        if (network == 'xdai') {
            gasPriceUsd = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
        } else {
            // txgasPrice in Eth networks is expressed in eth so we need to do a conversion
            let ethPrice = getEthPriceInUSD()
            let txGasPriceEth = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
            gasPriceUsd = txGasPriceEth.times(ethPrice)
        }

        if (!settlement) {
            settlement = new Settlement(settlementId)
            settlement.txHash = txHash
            settlement.firstTradeTimestamp = tradeTimestamp
            settlement.solver = solver.toHexString()
            settlement.txCostUsd = gasPriceUsd
            settlement.save()
            totals.addSettlementCount(tradeTimestamp)
        } 
    }
}