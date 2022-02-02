import { Address, BigInt } from "@graphprotocol/graph-ts"
import { ERC20 } from "../../generated/GPV2Settlement/ERC20"
import { Token } from "../../generated/schema"
import { ZERO_BD } from "../utils/constants"

const DEFAULT_DECIMALS = 18

export namespace tokens {

    export function getOrCreateToken(tokenAddress: Address, timestamp: BigInt): Token {
        let tokenId = tokenAddress.toHexString()
        let token = Token.load(tokenId)
      
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
          token.derivedETH = ZERO_BD
          token.allowedPools = []
      
        }
        // adding timestamp for token created by uniswap logic
        if (!token.firstTradeTimestamp) {
          token.firstTradeTimestamp = timestamp
        }
      
      
        return token as Token
      }
}