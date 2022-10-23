import { Trade } from "../../generated/GPV2Settlement/GPV2Settlement"
import { BigInt, BigDecimal } from "@graphprotocol/graph-ts"
import { Token, Trade as TradeEntity } from "../../generated/schema"
import { convertTokenToDecimal } from "../utils"
import { settlements, tokens, totals, users, pairs } from "./"
import { ZERO_ADDRESS, ZERO_BD, ZERO_BI, ONE_BI } from "../utils/constants"

export namespace trades {

    export function getOrCreateTrade(event: Trade, buyToken: Token, sellToken: Token): void {
        let orderId = event.params.orderUid.toHexString()
        let eventIndex = event.transaction.index.toString()
        let txHash = event.transaction.hash
        let txHashString = txHash.toHexString()
        let tradeId = orderId + "|" + txHashString + "|" + eventIndex
        let timestamp = event.block.timestamp.toI32()
        let sellAmount = event.params.sellAmount
        let buyAmount = event.params.buyAmount
        let txGasPrice = event.transaction.gasPrice
        let feeAmount = event.params.feeAmount
        let solver = event.transaction.from
        let ownerAddress = event.params.owner
        let owner = ownerAddress.toHexString()
        let blockNumber = event.block.number

        let receipt = event.receipt

        let gasUsed = ONE_BI

        if (receipt) {
            gasUsed = receipt.gasUsed
        }

        let txCost = gasUsed.times(txGasPrice)
        
        let buyAmountDecimals = convertTokenToDecimal(buyAmount, BigInt.fromI32(buyToken.decimals))
        
        let _buyTokenPriceUsd = buyToken.priceUsd
        let buyAmountUsd = _buyTokenPriceUsd ? _buyTokenPriceUsd.times(buyAmountDecimals) : null

        let _buyTokenPriceEth = buyToken.priceEth
        let buyAmountEth = _buyTokenPriceEth ? _buyTokenPriceEth.times(buyAmountDecimals) : null
        let sellAmountDecimals = convertTokenToDecimal(sellAmount, BigInt.fromI32(sellToken.decimals))

        let feeAmountDecimals = convertTokenToDecimal(feeAmount, BigInt.fromI32(sellToken.decimals))
        
        let _sellTokenPriceUsd = sellToken.priceUsd
        
        let sellAmountUsd = _sellTokenPriceUsd ? _sellTokenPriceUsd.times(sellAmountDecimals) : null
        let feeAmountUsd = _sellTokenPriceUsd ?_sellTokenPriceUsd.times(feeAmountDecimals) : null

        let _sellTokenPriceEth = sellToken.priceEth
        let sellAmountEth = _sellTokenPriceEth ? _sellTokenPriceEth.times(sellAmountDecimals) : null
        let feeAmountEth = _sellTokenPriceEth ?_sellTokenPriceEth.times(feeAmountDecimals) : null

        // This statement need to be after tokens prices calculation.
        settlements.getOrCreateSettlement(blockNumber, txHash, timestamp, solver, txCost, feeAmountUsd)

        let trade = TradeEntity.load(tradeId)

        if (!trade) {
            trade = new TradeEntity(tradeId)
        }
        let buyTokenId = buyToken.id
        let sellTokenId = sellToken.id

        let buyTokenPriceUsd = _buyTokenPriceUsd ? _buyTokenPriceUsd as BigDecimal : null
        let sellTokenPriceUsd = _sellTokenPriceUsd ? _sellTokenPriceUsd as BigDecimal : null

        tokens.createTokenTradingEvent(timestamp, buyTokenId, tradeId, buyAmount, buyAmountEth, buyAmountUsd, buyTokenPriceUsd)
        tokens.createTokenTradingEvent(timestamp, sellTokenId, tradeId, sellAmount, sellAmountEth, sellAmountUsd, sellTokenPriceUsd)

        trade.timestamp = timestamp ? timestamp : 0
        trade.txHash = txHash ? txHash : ZERO_ADDRESS
        trade.settlement = txHashString ? txHashString : ""
        trade.buyToken = buyTokenId ? buyTokenId : ""
        trade.buyAmount = buyAmount ? buyAmount : ZERO_BI
        trade.sellToken = sellTokenId ? sellTokenId : ""
        trade.sellAmount = sellAmount ? sellAmount : ZERO_BI
        trade.order = orderId ? orderId : ""
        trade.gasPrice = txGasPrice ? txGasPrice : ZERO_BI
        trade.feeAmount = feeAmount ? feeAmount : ZERO_BI
        trade.feeAmountUsd = feeAmountUsd
        trade.feeAmountEth = feeAmountEth
        trade.buyAmountEth = buyAmountEth
        trade.sellAmountEth = sellAmountEth
        trade.buyAmountUsd = buyAmountUsd
        trade.sellAmountUsd = sellAmountUsd
        trade.gasUsed = gasUsed
        trade.save()

        // determine the amount to calculate volumes. 
        // try first with sellAmountUsd
        // if it can't be calculated will use buyAmounts
        let usdAmountForVolumes = sellAmountUsd
        let ethAmountForVolumes = sellAmountEth
        if (sellAmountUsd && sellAmountUsd.le(ZERO_BD)) {
            usdAmountForVolumes = buyAmountUsd
            ethAmountForVolumes = buyAmountEth
        }

        users.getOrCreateTrader(owner, timestamp, ownerAddress, ethAmountForVolumes, usdAmountForVolumes)
        users.getOrCreateSolver(solver, ethAmountForVolumes, usdAmountForVolumes)

        totals.addVolumesAndFees(ethAmountForVolumes, usdAmountForVolumes, feeAmountEth, feeAmountUsd, timestamp)

        pairs.createOrUpdatePair(timestamp, buyTokenId, sellTokenId, buyAmount, sellAmount, 
            sellAmountEth, sellAmountUsd, buyTokenPriceUsd, sellTokenPriceUsd, buyAmountDecimals, sellAmountDecimals)
    }

}
