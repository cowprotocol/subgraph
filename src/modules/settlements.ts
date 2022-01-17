import { BigInt, Bytes } from "@graphprotocol/graph-ts"
import { Settlement } from "../../generated/schema"

export namespace settlements {

    export function getOrCreateSettlement(txHash: Bytes, tradeTimestamp: BigInt): void { 

        let settlementId = txHash.toHexString()

        let settlement = Settlement.load(settlementId)

        if (!settlement) {
            settlement = new Settlement(settlementId)
            settlement.txHash = txHash
            settlement.firstTradeTimestamp = tradeTimestamp
            settlement.save()
        } 
    }
}