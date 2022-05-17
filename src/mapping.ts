import {
  Interaction,
  OrderInvalidated,
  PreSignature,
  Settlement,
  Trade
} from "../generated/GPV2Settlement/GPV2Settlement"
import { tokens, trades, orders, users } from "./modules"
import { getPrices } from "./utils/getPrices"
import { MINUS_ONE_BD, ZERO_BI } from "./utils/constants"
import { BigDecimal, BigInt, dataSource, log } from "@graphprotocol/graph-ts"
import { convertTokenToDecimal } from "./utils"

export function handleInteraction(event: Interaction): void { }

export function handleOrderInvalidated(event: OrderInvalidated): void {

  let orderId = event.params.orderUid.toHexString()
  let timestamp = event.block.timestamp.toI32()

  let order = orders.invalidateOrder(orderId, timestamp)

  order.save()
}

export function handlePreSignature(event: PreSignature): void {

  let orderUid = event.params.orderUid.toHexString()
  let ownerAddress = event.params.owner
  let owner = ownerAddress.toHexString()
  let timestamp = event.block.timestamp.toI32()
  let signed = event.params.signed

  let order = orders.setPresignature(orderUid, owner, timestamp, signed)

  order.save()

  users.getOrCreateSigner(owner, ownerAddress)
}

export function handleSettlement(event: Settlement): void { }


export function handleTrade(event: Trade): void {
  let orderId = event.params.orderUid.toHexString()
  let ownerAddress = event.params.owner
  let owner = ownerAddress.toHexString()
  let sellTokenAddress = event.params.sellToken
  let buyTokenAddress = event.params.buyToken
  let sellAmount = event.params.sellAmount
  let buyAmount = event.params.buyAmount
  let network = dataSource.network()

  let timestamp = event.block.timestamp.toI32()

  let sellToken = tokens.getOrCreateToken(sellTokenAddress, timestamp)
  let buyToken = tokens.getOrCreateToken(buyTokenAddress, timestamp)

  let tokenCurrentSellAmount = sellToken.totalVolume
  let tokenCurrentBuyAmount = buyToken.totalVolume

  sellToken.totalVolume =  tokenCurrentSellAmount.plus(sellAmount)
  buyToken.totalVolume =  tokenCurrentBuyAmount.plus(buyAmount)

  if (network == 'xdai') {
    let sellTokenPrices = getPrices(sellTokenAddress)
    let buyTokenPrices = getPrices(buyTokenAddress)
    if (sellTokenPrices.get("usd") != MINUS_ONE_BD &&
      sellTokenPrices.get("eth") != MINUS_ONE_BD) {
      sellToken.priceUsd = sellTokenPrices.get("usd")
      sellToken.priceEth = sellTokenPrices.get("eth")
    }
    if (buyTokenPrices.get("usd") != MINUS_ONE_BD &&
      buyTokenPrices.get("eth") != MINUS_ONE_BD) {
      buyToken.priceUsd = buyTokenPrices.get("usd")
      buyToken.priceEth = buyTokenPrices.get("eth")
    }
  }

  let buyPrevNumberOfTrades = buyToken.numberOfTrades
  buyToken.numberOfTrades = buyPrevNumberOfTrades + 1

  let sellPrevNumberOfTrades = sellToken.numberOfTrades
  sellToken.numberOfTrades = sellPrevNumberOfTrades + 1

  let buyTokenPrevTotalVolumeUsd = buyToken.totalVolumeUsd
  let buyTokenPrevTotalVolumeEth = buyToken.totalVolumeEth
  let sellTokenPrevTotalVolumeUsd = sellToken.totalVolumeUsd
  let sellTokenPrevTotalVolumeEth = sellToken.totalVolumeEth

  let buyCurrentAmountDecimals = convertTokenToDecimal(buyAmount, BigInt.fromI32(buyToken.decimals))
  let sellCurrentAmountDecimals = convertTokenToDecimal(sellAmount, BigInt.fromI32(sellToken.decimals))

  if (buyToken.priceUsd != null) {
    let buyTokenPriceUsd = buyToken.priceUsd as BigDecimal
    let buyCurrentTradeUsd = buyCurrentAmountDecimals.times(buyTokenPriceUsd)
    buyToken.totalVolumeUsd = buyTokenPrevTotalVolumeUsd.plus(buyCurrentTradeUsd)
  }
  if (sellToken.priceUsd != null) {
    let sellTokenPriceUsd = sellToken.priceUsd as BigDecimal
    let sellCurrentTradeUsd = sellCurrentAmountDecimals.times(sellTokenPriceUsd)
    sellToken.totalVolumeUsd = sellTokenPrevTotalVolumeUsd.plus(sellCurrentTradeUsd)
  }
  if (buyToken.priceEth != null) {
    let buyTokenPriceEth = buyToken.priceEth as BigDecimal
    let buyCurrentTradeEth = buyCurrentAmountDecimals.times(buyTokenPriceEth)
    buyToken.totalVolumeEth = buyTokenPrevTotalVolumeEth.plus(buyCurrentTradeEth)
  }
  if (sellToken.priceEth != null) {
    let sellTokenPriceEth = sellToken.priceEth as BigDecimal
    let sellCurrentTradeEth = sellCurrentAmountDecimals.times(sellTokenPriceEth)
    sellToken.totalVolumeEth = sellTokenPrevTotalVolumeEth.plus(sellCurrentTradeEth)
  }

  // this call need to go after price update
  // it uses the prices of each token calculated above.
  trades.getOrCreateTrade(event, buyToken, sellToken)

  sellToken.save()
  buyToken.save()

  let order = orders.getOrCreateOrderForTrade(orderId, timestamp, owner)

  sellToken.save()
  buyToken.save()
  order.save()

}
