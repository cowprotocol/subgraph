import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts"
import { ERC20 } from "../../generated/GPV2Settlement/ERC20"
import { Token, TokenDailyTotal, TokenHourlyTotal, TokenTradingEvent } from "../../generated/schema"
import { ZERO_BD, ZERO_BI, MINUS_ONE_BD, ONE_BI } from "../utils/constants"
import { getPrices } from "../utils/getPrices"
import { totals } from "./totals"
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

const DEFAULT_DECIMALS = 18

export namespace tokens {

  export function getOrCreateToken(tokenAddress: Address, timestamp: BigInt): Token {
    let tokenId = tokenAddress.toHexString()
    let token = Token.load(tokenId)
    let network = dataSource.network()

    if (!token) {
      token = new Token(tokenId)
      token.address = tokenAddress
      token.firstTradeTimestamp = timestamp

      let erc20Token = ERC20.bind(tokenAddress)
      let tokenDecimals = erc20Token.try_decimals()
      let tokenName = erc20Token.try_name()
      let tokenSymbol = erc20Token.try_symbol()
      token.decimals = !tokenDecimals.reverted
        ? tokenDecimals.value
        : DEFAULT_DECIMALS
      token.name = !tokenName.reverted ? tokenName.value : ""
      token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : ""
      token.totalVolume = ZERO_BI
      if (network == 'xdai') {
        let tokenPrices = getPrices(tokenAddress)
        if (tokenPrices.get("usd") != MINUS_ONE_BD &&
          tokenPrices.get("eth") != MINUS_ONE_BD) {
          token.priceUsd = tokenPrices.get("usd")
          token.priceEth = tokenPrices.get("eth")
        }
      } else {
        token.priceEth = ZERO_BD
        token.priceUsd = ZERO_BD
      }
      token.allowedPools = []
      token.numberOfTrades = 0
      token.totalVolumeEth = ZERO_BD
      token.totalVolumeUsd = ZERO_BD
      totals.addTokenCount(timestamp, tokenId)
    }

    // adding timestamp for token created by uniswap logic
    // start counting that token
    if (!token.firstTradeTimestamp) {
      token.firstTradeTimestamp = timestamp
      totals.addTokenCount(timestamp, tokenId)
    }

    token.save()

    return token as Token
  }

  export function getTokenDecimals(tokenAddress: Address): number {
    let tokenId = tokenAddress.toHexString()
    let token = Token.load(tokenId)

    if (token) {
      return token.decimals
    }

    let erc20Token = ERC20.bind(tokenAddress)
    let tokenDecimals = erc20Token.try_decimals()

    return tokenDecimals.reverted ? DEFAULT_DECIMALS : tokenDecimals.value
  }

  export function createTokenTradingEvent(timestamp: BigInt, tokenId: string, tradeId: string, amount: BigInt, amountEth: BigDecimal, amountUsd: BigDecimal, tokenPrice: BigDecimal | null): void {
    let id = tokenId + timestamp.toString()
    let tradingEvent = new TokenTradingEvent(id)
    tradingEvent.token = tokenId
    tradingEvent.trade = tradeId
    tradingEvent.timestamp = timestamp
    tradingEvent.amountEth = amountEth
    tradingEvent.amountUsd = amountUsd
    tradingEvent.save()
    updateTokenDailyTotal(timestamp, tokenId, amount, amountEth, amountUsd, tokenPrice)
    updateTokenHourlyTotal(timestamp, tokenId, amount, amountEth, amountUsd, tokenPrice)
  }

  function getOrCreateTokenDailyTotal(tokenId: string, timestamp: BigInt): TokenDailyTotal {

    let dailyTimestamp = getDayTotalTimestamp(timestamp)
    let dailyTimestampId = tokenId + "-" + dailyTimestamp.toString()
    let total = TokenDailyTotal.load(dailyTimestampId)

    if (!total) {
      total = new TokenDailyTotal(dailyTimestampId)
      total.token = tokenId
      total.timestamp = timestamp
      total.totalVolume = ZERO_BI
      total.totalVolumeEth = ZERO_BD
      total.totalVolumeUsd = ZERO_BD
      total.totalTrades = ZERO_BI
      total.openPrice = ZERO_BD
      total.closePrice = ZERO_BD
      total.higherPrice = ZERO_BD
      total.lowerPrice = ZERO_BD
      total.averagePrice = ZERO_BD
    }

    return total as TokenDailyTotal
  }

  function getOrCreateTokenHourlyTotal(tokenId: string, timestamp: BigInt): TokenHourlyTotal {

    let hourlyTimestamp = getHourTotalTimestamp(timestamp)
    let hourlyTimestampId = tokenId + "-" + hourlyTimestamp.toString()
    let total = TokenHourlyTotal.load(hourlyTimestampId)

    if (!total) {
      total = new TokenHourlyTotal(hourlyTimestampId)
      total.token = tokenId
      total.timestamp = timestamp
      total.totalVolume = ZERO_BI
      total.totalVolumeEth = ZERO_BD
      total.totalVolumeUsd = ZERO_BD
      total.totalTrades = ZERO_BI
      total.openPrice = ZERO_BD
      total.closePrice = ZERO_BD
      total.higherPrice = ZERO_BD
      total.lowerPrice = ZERO_BD
      total.averagePrice = ZERO_BD
    }

    return total as TokenHourlyTotal
  }

  function updateTokenDailyTotal(timestamp: BigInt, tokenId: string, amount: BigInt, amountEth: BigDecimal, amountUsd: BigDecimal, tokenPrice: BigDecimal | null): void {

    let total = getOrCreateTokenDailyTotal(tokenId, timestamp)

    // check if it is first trade
    if (total.totalTrades == ZERO_BI) {
      total.totalVolume = amount
      total.totalVolumeEth = amountEth
      total.totalVolumeUsd = amountUsd
      total.totalTrades = ONE_BI
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        total.openPrice = priceBD 
        total.lowerPrice = priceBD
        total.higherPrice = priceBD
        total.averagePrice = priceBD
      }
    } else {
      let prevTotalVolume = total.totalVolume
      let prevTotalVolumeEth = total.totalVolumeEth
      let prevTotalVolumeUsd = total.totalVolumeUsd
      let prevTotalTrades = total.totalTrades
      total.totalVolume = prevTotalVolume.plus(amount)
      total.totalVolumeEth = prevTotalVolumeEth.plus(amountEth)
      total.totalVolumeUsd = prevTotalVolumeUsd.plus(amountUsd)
      total.totalTrades = prevTotalTrades.plus(ONE_BI)
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        if (priceBD.lt(total.lowerPrice)) {
          total.lowerPrice = priceBD
        }
        if (priceBD.gt(total.higherPrice)) {
          total.higherPrice = priceBD
        }
        // TODO: check next line cast.
        let totalTradeBD = BigDecimal.fromString(total.totalTrades.toString())
        total.averagePrice = total.totalVolumeUsd.div(totalTradeBD)
      }
    }
    if (tokenPrice) {
      total.closePrice = tokenPrice as BigDecimal
    }

    total.save()

  }

  function updateTokenHourlyTotal(timestamp: BigInt, tokenId: string, amount: BigInt, amountEth: BigDecimal, amountUsd: BigDecimal, tokenPrice: BigDecimal | null): void {

    let total = getOrCreateTokenHourlyTotal(tokenId, timestamp)

    // check if it is first trade
    if (total.totalTrades == ZERO_BI) {
      total.totalVolume = amount
      total.totalVolumeEth = amountEth
      total.totalVolumeUsd = amountUsd
      total.totalTrades = ONE_BI
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        total.openPrice = priceBD
        total.lowerPrice = priceBD
        total.higherPrice = priceBD
        total.averagePrice = priceBD
      }
    } else {
      let prevTotalVolume = total.totalVolume
      let prevTotalVolumeEth = total.totalVolumeEth
      let prevTotalVolumeUsd = total.totalVolumeUsd
      let prevTotalTrades = total.totalTrades
      total.totalVolume = prevTotalVolume.plus(amount)
      total.totalVolumeEth = prevTotalVolumeEth.plus(amountEth)
      total.totalVolumeUsd = prevTotalVolumeUsd.plus(amountUsd)
      total.totalTrades = prevTotalTrades.plus(ONE_BI)
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        if (priceBD.lt(total.lowerPrice)) {
          total.lowerPrice = priceBD
        }
        if (priceBD.gt(total.higherPrice)) {
          total.higherPrice = priceBD
        }
        // TODO: check next line cast.
        let totalTradeBD = BigDecimal.fromString(total.totalTrades.toString())
        total.averagePrice = total.totalVolumeUsd.div(totalTradeBD)
      }
    }
    if (tokenPrice) {
      total.closePrice = tokenPrice as BigDecimal
    }

    total.save()

  }
}