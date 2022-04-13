import { Trade } from "../../generated/GPV2Settlement/GPV2Settlement"
import { BigInt } from "@graphprotocol/graph-ts"
import { Token, Trade as TradeEntity } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { settlements, tokens, totals, users, pairs } from "./"

export namespace trades {

    export function getOrCreateTrade(event: Trade, buyToken: Token, sellToken: Token): void {
        let orderId = event.params.orderUid.toHexString()
        let eventIndex = event.transaction.index.toString()
        let txHash = event.transaction.hash
        let txHashString = txHash.toHexString()
        let tradeId = orderId + "|" + txHashString + "|" + eventIndex
        let timestamp = event.block.timestamp
        let sellAmount = event.params.sellAmount
        let buyAmount = event.params.buyAmount
        let txGasPrice = event.transaction.gasPrice
        let feeAmount = event.params.feeAmount
        let solver = event.transaction.from
        let ownerAddress = event.params.owner
        let owner = ownerAddress.toHexString()

        let buyAmountDecimals = convertTokenToDecimal(buyAmount, BigInt.fromI32(buyToken.decimals))
        let buyAmountUsd = buyToken.priceUsd.times(buyAmountDecimals)
        let buyAmountEth = buyToken.priceEth.times(buyAmountDecimals)
        let sellAmountDecimals = convertTokenToDecimal(sellAmount, BigInt.fromI32(sellToken.decimals))
        let sellAmountUsd = sellToken.priceUsd.times(sellAmountDecimals)
        let sellAmountEth = sellToken.priceEth.times(sellAmountDecimals)

        let feeAmountDecimals = convertTokenToDecimal(feeAmount, BigInt.fromI32(sellToken.decimals))
        let feeAmountUsd = sellToken.priceUsd.times(feeAmountDecimals)
        let feeAmountEth = sellToken.priceEth.times(feeAmountDecimals)

        // This statement need to be after tokens prices calculation.
        settlements.getOrCreateSettlement(txHash, timestamp, solver, txGasPrice)

        let trade = TradeEntity.load(tradeId)

        if (!trade) {
            trade = new TradeEntity(tradeId)
        }
        let buyTokenId = buyToken.id
        let sellTokenId = sellToken.id

        tokens.createTokenTradingEvent(timestamp, buyTokenId, tradeId, buyAmount, buyAmountEth, buyAmountUsd, buyToken.priceUsd)
        tokens.createTokenTradingEvent(timestamp, sellTokenId, tradeId, sellAmount, sellAmountEth, sellAmountUsd, sellToken.priceUsd)

        trade.timestamp = timestamp
        trade.txHash = txHash
        trade.settlement = txHashString
        trade.buyToken = buyTokenId
        trade.buyAmount = buyAmount
        trade.sellToken = sellTokenId
        trade.sellAmount = sellAmount
        trade.order = orderId
        trade.gasPrice = txGasPrice
        trade.feeAmount = feeAmount
        trade.buyAmountEth = buyAmountEth
        trade.sellAmountEth = sellAmountEth
        trade.buyAmountUsd = buyAmountUsd
        trade.sellAmountUsd = sellAmountUsd
        trade.save()

        // for now using sell amount
        users.getOrCreateTrader(owner, timestamp, ownerAddress, sellAmountEth, sellAmountUsd)
        users.getOrCreateSolver(solver, sellAmountEth, sellAmountUsd)

        totals.addVolumesAndFees(sellAmountEth, sellAmountUsd, feeAmountEth, feeAmountUsd, timestamp)

        pairs.createOrUpdatePair(timestamp, buyTokenId, sellTokenId, buyAmount, sellAmount, sellAmountEth, sellAmountUsd)
    }

}