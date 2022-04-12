import { BigInt, Bytes, Address, dataSource } from "@graphprotocol/graph-ts"
import { Settlement } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { ZERO_BD } from "../utils/constants"
import { totals } from "./totals"
// import { getEthPriceInUSD } from "../utils/pricing"

export namespace settlements {

<<<<<<< HEAD
    export function getOrCreateSettlement(txHash: Bytes, tradeTimestamp: BigInt, solver: string): void { 
=======
    export function getOrCreateSettlement(txHash: Bytes, tradeTimestamp: BigInt, solver: Address, txGasPrice: BigInt): void { 
>>>>>>> Added volumes, daily totals and pairs

        let settlementId = txHash.toHexString()
        let network = dataSource.network()

        let settlement = Settlement.load(settlementId)

        // both xdai and weth have the same amount of decimals
        let DEFAULT_DECIMALS =  BigInt.fromI32(18)
        let gasPriceUsd = ZERO_BD
        if (network == 'xdai') {
            // txGasPrice is in xdai
            gasPriceUsd = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
        } else {
            //txGasPrice is in eth
            //let ethPrice = ZERO_BD
            //ethPrice = getEthPriceInUSD()
            //let txGasPriceEth = convertTokenToDecimal(txGasPrice, DEFAULT_DECIMALS)
            //gasPriceUsd = txGasPriceEth.times(ethPrice)
        }

        if (!settlement) {
            settlement = new Settlement(settlementId)
            settlement.txHash = txHash
            settlement.firstTradeTimestamp = tradeTimestamp
            settlement.solver = solver.toHexString()
            //settlement.txCostUsd = gasPriceUsd
            settlement.save()
            totals.addSettlementCount(tradeTimestamp)
        } 
    }
}