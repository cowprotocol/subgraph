
# Model explained

## Available entities

```mermaid
classDiagram
class User {
  id: ID!
  address: Bytes!
  firstTradeTimestamp: BigInt
  ordersPlaced: [Order!]! @derivedFrom(field: "owner")
  isSolver: Boolean!
  numberOfTrades: Int! 
  solvedAmountEth: BigDecimal
  solvedAmountUsd: BigDecimal
  tradedAmountUsd: BigDecimal
  tradedAmountEth: BigDecimal
}

User --o Order : ordersPlaced

class Token {
  id: ID!
  address: Bytes!
  firstTradeTimestamp: BigInt
  name: String!
  symbol: String!
  decimals: Int!
  totalVolume: BigInt
  priceEth: BigDecimal
  priceUsd: BigDecimal
  allowedPools: [BigInt!]!
  history: [TokenTradingEvent!]! @derivedFrom(field: "token")
  hourlyTotals: [TokenHourlyTotal!]! @derivedFrom(field: "token")
  dailyTotals: [TokenDailyTotal!]! @derivedFrom(field: "token")
  numberOfTrades: Int! 
  totalVolumeUsd: BigDecimal
  totalVolumeEth: BigDecimal 
}

Token --o TokenTradingEvent : History
Token --o TokenDailyTotal : dailyTotals
Token --o TokenHourlyTotal : hourlyTotals

class Order {
  id: ID!
  owner: User
  tradesTimestamp: BigInt
  invalidateTimestamp: BigInt
  presignTimestamp: BigInt
  trades: [Trade!] @derivedFrom(field: "order")
  isSigned: Boolean
  isValid: Boolean
}

Order --o Trade : trades

class Trade {
  id: ID!
  timestamp: BigInt!
  gasPrice: BigInt!
  feeAmount: BigInt! 
  feeAmountUsd: BigDecimal
  feeAmountEth: BigDecimal
  txHash: Bytes!
  settlement: Settlement!
  buyAmount: BigInt!
  sellAmount: BigInt!
  sellToken: Token!
  buyToken: Token!
  order: Order!
  buyAmountEth: BigDecimal
  sellAmountEth: BigDecimal
  buyAmountUsd: BigDecimal
  sellAmountUsd: BigDecimal
}

Trade --o Token : buyToken
Trade --o Token : sellToken
Trade --o Order : order
Trade --o Settlement : settlement

class Settlement {
  id: ID!
  txHash: Bytes!
  firstTradeTimestamp: BigInt!
  trades: [Trade!] @derivedFrom(field: "settlement")
  solver: User
  txCostUsd: BigDecimal!
  aggregatedFeeAmountUsd: BigDecimal 
  profitability: BigDecimal!
}

Settlement --o Trade : trades
Settlement --o User : solver

class Total {
  id: ID!
  tokens: BigInt!
  orders: BigInt!
  traders: BigInt!
  numberOfTrades: BigInt!
  settlements: BigInt!
  volumeUsd: BigDecimal
  volumeEth: BigDecimal
  feesUsd: BigDecimal
  feesEth: BigDecimal
}

class DailyTotal {
  id: ID!
  timestamp: BigInt!
  totalTokens: BigInt!
  numberOfTrades: BigInt!
  orders: BigInt!
  settlements: BigInt!
  volumeUsd: BigDecimal
  volumeEth: BigDecimal
  feesUsd: BigDecimal
  feesEth: BigDecimal
  tokens: [Token!]!
}

DailyTotal --o Token : tokens

class HourlyTotal {
  id: ID!
  timestamp: BigInt!
  totalTokens: BigInt!
  numberOfTrades: BigInt!
  orders: BigInt!
  settlements: BigInt!
  volumeUsd: BigDecimal
  volumeEth: BigDecimal
  feesUsd: BigDecimal
  feesEth: BigDecimal
  tokens: [Token!]!
}

HourlyTotal --o Token : tokens

class TokenDailyTotal {
  id: ID!
  token: Token!
  timestamp: BigInt!
  totalVolume: BigInt!
  totalVolumeUsd: BigDecimal!
  totalVolumeEth: BigDecimal!
  totalTrades: BigInt!
  openPrice: BigDecimal!
  closePrice: BigDecimal!
  higherPrice: BigDecimal!
  lowerPrice: BigDecimal!
  averagePrice: BigDecimal!
}

class TokenHourlyTotal {
  id: ID!
  token: Token!
  timestamp: BigInt!
  totalVolume: BigInt!
  totalVolumeUsd: BigDecimal!
  totalVolumeEth: BigDecimal!
  totalTrades: BigInt!
  openPrice: BigDecimal!
  closePrice: BigDecimal!
  higherPrice: BigDecimal!
  lowerPrice: BigDecimal!
  averagePrice: BigDecimal!
}

class TokenTradingEvent {
  id: ID!
  token: Token!
  trade: Trade!
  timestamp: BigInt!
  amountEth: BigDecimal!
  amountUsd: BigDecimal!
}

TokenTradingEvent --o Token : token

class Pair {
  id: ID!
  token0: Token!
  token1: Token!
  token0Price: BigDecimal
  token1Price: BigDecimal
  token0relativePrice: BigDecimal
  token1relativePrice: BigDecimal
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeTradedEth: BigDecimal
  volumeTradedUsd: BigDecimal
}

Pair --o Token : token0 
Pair --o Token : token1 

class PairDaily {
  id: ID!
  token0: Token!
  token1: Token!
  token0Price: BigDecimal
  token1Price: BigDecimal
  token0relativePrice: BigDecimal
  token1relativePrice: BigDecimal
  timestamp: BigInt
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeTradedEth: BigDecimal
  volumeTradedUsd: BigDecimal
}

PairDaily --o Token : token0 
PairDaily --o Token : token1 

class PairHourly {
  id: ID!
  token0: Token!
  token1: Token!
  token0Price: BigDecimal
  token1Price: BigDecimal
  token0relativePrice: BigDecimal
  token1relativePrice: BigDecimal
  timestamp: BigInt
  volumeToken0: BigDecimal!
  volumeToken1: BigDecimal!
  volumeTradedEth: BigDecimal
  volumeTradedUsd: BigDecimal
}

PairHourly --o Token : token0 
PairHourly --o Token : token1 
```

### Settlement entity notes

So far settlements are being created using txHash as ID and that hash is creating the relation between Settlement and Trade entities.

### Orders entity notes

Notice order entity has 3 different timestamps. Each timestamp will be filled depending on the entry point that order passed.

**Entrypoints are:**

- On trade event
- On invalidate order event
- On pre sign event

### About token prices

In token entity you can find prices for each token. It's price it's being calculated using Honeyswap pools prices in gnosis chain or UniswapV3 in ethereum mainnet or rinkeby. 

### About totals

Totals is a singleton entity where it's aggregated information about how many different tokens had been traded, total traded volume in usd and eth, etc. You can find more detailed information in the subgraph schema. Please notice there's also a totals calculated by hour and by day.

### About pairs

Pairs are entities for a pair of tokens that had been traded on our platform. For keeping the tokens ordered in the same way, addresses are being sorted and token0 always stores the lower value and token1 the greater one. Please notice there's also a pairs entity by hour and by day.