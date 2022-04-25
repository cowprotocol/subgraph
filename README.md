# CoW-subgraph

Implements a subgraph for the [CoW Protocol](https://github.com/gnosis/gp-v2-contracts)

*So far this is a work in progress.*

- [Subgraph on mainnet](https://thegraph.com/hosted-service/subgraph/gnosis/cow)
- [Subgraph on rinkeby](https://thegraph.com/hosted-service/subgraph/gnosis/cow-rinkeby)
- [Subgraph on gnosis chain network](https://thegraph.com/hosted-service/subgraph/gnosis/cow-gc)

For more information about:

The Cow Protocol: https://docs.cow.fi/
The Graph: https://thegraph.com/docs/en/

There is also a GP v1 subgraph here: https://github.com/gnosis/dex-subgraph

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
  numberOfTrades: Int! 
  totalVolumeUsd: BigDecimal
  totalVolumeEth: BigDecimal 
}

Token --o TokenTradingEvent : History

class Order {
  id: ID!
  owner: User
  tradesTimestamp: BigInt
  invalidateTimestamp: BigInt
  presignTimestamp: BigInt
  trades: [Trade!] @derivedFrom(field: "order")
  isSigned: Boolean!
}

Order --o Trade : trades

class Trade {
  id: ID!
  timestamp: BigInt!
  gasPrice: BigInt!
  feeAmount: BigInt! 
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
}

Settlement --o Trade : trades
Settlement --o User : solver

class Total {
  id: ID!
  tokens: BigInt!
  orders: BigInt!
  traders: BigInt!
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
  volumeToken0: BigInt
  volumeToken1: BigInt
  volumeTradedEth: BigDecimal
  volumeTradedUsd: BigDecimal
}

Pair --o Token : token0 
Pair --o Token : token1 

class PairDaily {
  id: ID!
  token0: Token!
  token1: Token!
  timestamp: BigInt
  volumeToken0: BigInt
  volumeToken1: BigInt
  volumeTradedEth: BigDecimal
  volumeTradedUsd: BigDecimal
}

PairDaily --o Token : token0 
PairDaily --o Token : token1 

class PairHourly {
  id: ID!
  token0: Token!
  token1: Token!
  timestamp: BigInt
  volumeToken0: BigInt
  volumeToken1: BigInt
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

## Setup of your own test subgraph

*Requisites:* You must have access to a console and have yarn installed. More info about [yarn](https://classic.yarnpkg.com/lang/en/docs/)

1. Install the dependencies by executing:

```bash
$ yarn
```

2. Go to The Graph [hosted service](https://thegraph.com/hosted-service/dashboard) and log in using your github credentials. 

3. Copy your access token and run the following:

```bash
$ graph auth --product hosted-service <YourAccessToken>
```

5. In your browser, create a new subgraph in the dashboard by clicking "Add Subgraph" button. Complete the form. Notice your subgraph will be named: `YourGithubAccount/SubgraphName`

6. Create your own environment and edit so it points to your testing subgraph:

```bash
cp .env.example .env
```

7. Deploy:
```bash
yarn deploy
```

If everything went well you'll have a copy of this subgraph running on your hosted service account indexing your desired network.

Please notice a subgraph can only index a single network, if you want to index another network you should create a new subgraph and do same steps starting from step 3.
