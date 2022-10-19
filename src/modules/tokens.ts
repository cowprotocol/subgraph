import { Address, BigDecimal, BigInt, dataSource } from "@graphprotocol/graph-ts"
import { ERC20 } from "../../generated/GPV2Settlement/ERC20"
import { Token, TokenDailyTotal, TokenHourlyTotal, TokenTradingEvent } from "../../generated/schema"
import { ZERO_BD, ZERO_BI, MINUS_ONE_BD, ONE_BI } from "../utils/constants"
import { getPrices } from "../utils/getPrices"
import { totals } from "./totals"
import { getDayTotalTimestamp, getHourTotalTimestamp } from "../utils/timeframeTimestamp";

let DEFAULT_DECIMALS = 18

export namespace tokens {

  export function getOrCreateToken(tokenAddress: Address, timestamp: i32): Token {
    let tokenId = tokenAddress.toHexString()
    let token = Token.load(tokenId)
    let network = dataSource.network()

    // check if token exists
    if (!token) {
      // creates a new token and fill properites
      token = new Token(tokenId)
      token.address = tokenAddress
      token.firstTradeTimestamp = timestamp ? timestamp : 0

      // try contract calls for filling decimals, name and symbol
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
        // prices will be fetched on gnosis chain
        let tokenPrices = getPrices(tokenAddress)
        if (tokenPrices.get("usd") != MINUS_ONE_BD &&
          tokenPrices.get("eth") != MINUS_ONE_BD) {
          token.priceUsd = tokenPrices.get("usd")
          token.priceEth = tokenPrices.get("eth")
        }
      } else {
        // for eth network will be calculated in a different way
        // it'll be filled with zero
        token.priceEth = ZERO_BD
        token.priceUsd = ZERO_BD
      }
      token.numberOfTrades = 0
      token.totalVolumeEth = ZERO_BD
      token.totalVolumeUsd = ZERO_BD

      // add token created to the totals
      // code commented https://github.com/cowprotocol/subgraph/issues/47#issuecomment-1183515135
      //totals.addTokenCount(timestamp, tokenId)
      totals.updateTokenTotalsCount()
    }

    // adding timestamp for token created by uniswap logic
    // start counting that token
    if (!token.firstTradeTimestamp) {
      token.firstTradeTimestamp = timestamp
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

  export function createTokenTradingEvent(timestamp: i32, tokenId: string, tradeId: string, amount: BigInt, amountEth: BigDecimal | null, amountUsd: BigDecimal | null, tokenPrice: BigDecimal | null): void {
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

  function getOrCreateTokenDailyTotal(tokenId: string, timestamp: i32): TokenDailyTotal {

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

  function getOrCreateTokenHourlyTotal(tokenId: string, timestamp: i32): TokenHourlyTotal {

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

  function updateTokenDailyTotal(timestamp: i32, tokenId: string, amount: BigInt, amountEth: BigDecimal | null, amountUsd: BigDecimal | null, tokenPrice: BigDecimal | null): void {

    let total = getOrCreateTokenDailyTotal(tokenId, timestamp)

    // check if it is first trade
    if (total.totalTrades == ZERO_BI) {
      total.totalVolume = amount
      total.totalVolumeEth = amountEth ? amountEth : ZERO_BD
      total.totalVolumeUsd = amountUsd ? amountUsd : ZERO_BD
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
      total.totalVolumeEth = amountEth ? prevTotalVolumeEth.plus(amountEth) : prevTotalVolumeEth
      total.totalVolumeUsd = amountUsd ? prevTotalVolumeUsd.plus(amountUsd) : prevTotalVolumeUsd
      total.totalTrades = prevTotalTrades.plus(ONE_BI)
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        if (priceBD.lt(total.lowerPrice)) {
          total.lowerPrice = priceBD
        }
        if (priceBD.gt(total.higherPrice)) {
          total.higherPrice = priceBD
        }

        total.averagePrice = calculateWeightedAveragePrice(total.totalVolume, total.averagePrice, amount, priceBD)
      }
    }
    if (tokenPrice) {
      total.closePrice = tokenPrice as BigDecimal
    }

    total.save()

  }

  function calculateWeightedAveragePrice(prevVol: BigInt, prevAvgPrice: BigDecimal, currentVol: BigInt, currentPrice: BigDecimal): BigDecimal {
    let prevVolumeBD = prevVol.toBigDecimal()
    let prevValWeighted = prevVolumeBD.times(prevAvgPrice)
    let currentVolumeBD = currentVol.toBigDecimal()
    let currentAvgWeighted = currentVolumeBD.times(currentPrice)

    let numerator = prevValWeighted.plus(currentAvgWeighted)
    let denominator = prevVolumeBD.plus(currentVolumeBD)
    return numerator.div(denominator) as BigDecimal
  }
  function updateTokenHourlyTotal(timestamp: i32, tokenId: string, amount: BigInt, amountEth: BigDecimal | null, amountUsd: BigDecimal | null, tokenPrice: BigDecimal | null): void {

    let total = getOrCreateTokenHourlyTotal(tokenId, timestamp)

    // check if it is first trade
    if (total.totalTrades == ZERO_BI) {
      total.totalVolume = amount
      total.totalVolumeEth = amountEth ? amountEth : ZERO_BD
      total.totalVolumeUsd = amountUsd ? amountUsd : ZERO_BD
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
      total.totalVolumeEth = amountEth ? prevTotalVolumeEth.plus(amountEth) : prevTotalVolumeEth
      total.totalVolumeUsd = amountUsd ? prevTotalVolumeUsd.plus(amountUsd) : prevTotalVolumeUsd
      total.totalTrades = prevTotalTrades.plus(ONE_BI)
      if (tokenPrice) {
        let priceBD = tokenPrice as BigDecimal
        if (priceBD.lt(total.lowerPrice)) {
          total.lowerPrice = priceBD
        }
        if (priceBD.gt(total.higherPrice)) {
          total.higherPrice = priceBD
        }

        total.averagePrice = calculateWeightedAveragePrice(total.totalVolume, total.averagePrice, amount, priceBD)
      }
    }
    if (tokenPrice) {
      total.closePrice = tokenPrice as BigDecimal
    }

    total.save()

  }
}