import {
  Interaction,
  OrderInvalidated,
  PreSignature,
  Settlement,
  Trade
} from "../generated/GPV2Settlement/GPV2Settlement"
import { tokens, trades, orders, users } from "./modules"
import { getPrices } from "./utils/getPrices"
import { MINUS_ONE_BD } from "./utils/constants"
import { dataSource } from "@graphprotocol/graph-ts"

export function handleInteraction(event: Interaction): void { }

export function handleOrderInvalidated(event: OrderInvalidated): void {

  let orderId = event.params.orderUid.toHexString()
  let timestamp = event.block.timestamp

  let order = orders.invalidateOrder(orderId, timestamp)

  order.save()
}

export function handlePreSignature(event: PreSignature): void {

  let orderUid = event.params.orderUid.toHexString()
  let ownerAddress = event.params.owner
  let owner = ownerAddress.toHexString()
  let timestamp = event.block.timestamp
  let signed = event.params.signed

  let order = orders.setPresignature(orderUid, owner, timestamp, signed)

  order.save()

  users.getOrCreateUser(timestamp, ownerAddress)
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

  let timestamp = event.block.timestamp

  let sellToken = tokens.getOrCreateToken(sellTokenAddress, timestamp)
  let buyToken = tokens.getOrCreateToken(buyTokenAddress, timestamp)

  let tokenCurrentSellAmount = sellToken.totalVolume
  let tokenCurrentBuyAmount = buyToken.totalVolume

  sellToken.totalVolume =  tokenCurrentSellAmount.plus(sellAmount)
  buyToken.totalVolume =  tokenCurrentBuyAmount.plus(buyAmount)

  trades.getOrCreateTrade(event, buyToken, sellToken)

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

  sellToken.save()
  buyToken.save()

  let order = orders.getOrCreateOrderForTrade(orderId, timestamp, owner)

  sellToken.save()
  buyToken.save()
  order.save()

  users.getOrCreateUser(timestamp, ownerAddress)
}
