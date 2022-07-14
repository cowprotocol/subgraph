import {
  Address,
  BigInt,
} from "@graphprotocol/graph-ts"
  
// Static token definition was taken from this commit on Uniswap V3
// https://github.com/Uniswap/v3-subgraph/commit/16947766080d88f93fb7f0d9dfcb957212d6ab8f

// Initialize a Token Definition with the attributes
export class StaticTokenDefinition {
  address : Address
  symbol: string
  name: string
  decimals: BigInt

  // Initialize a Token Definition with its attributes
  constructor(address: Address, symbol: string, name: string, decimals: BigInt) {
    this.address = address
    this.symbol = symbol
    this.name = name
    this.decimals = decimals
  }

  // Get all tokens with a static defintion
  static getStaticDefinitions(): Array<StaticTokenDefinition> {
    let staticDefinitions = new Array<StaticTokenDefinition>(6)

    // Add DGD
    let tokenDGD = new StaticTokenDefinition(
      Address.fromString('0xe0b7927c4af23765cb51314a0e0521a9645f0e2a'),
      'DGD',
      'DGD',
      BigInt.fromI32(9)
    )
    staticDefinitions[0] = tokenDGD

    // Add AAVE
    let tokenAAVE = new StaticTokenDefinition(
      Address.fromString('0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9'),
      'AAVE',
      'Aave Token',
      BigInt.fromI32(18)
    )
    staticDefinitions.push(tokenAAVE)
    staticDefinitions[1] = tokenAAVE

    // Add LIF
    let tokenLIF = new StaticTokenDefinition(
      Address.fromString('0xeb9951021698b42e4399f9cbb6267aa35f82d59d'),
      'LIF',
      'Lif',
      BigInt.fromI32(18)
    )
    staticDefinitions[2] = tokenLIF

    // Add SVD
    let tokenSVD = new StaticTokenDefinition(
      Address.fromString('0xbdeb4b83251fb146687fa19d1c660f99411eefe3'),
      'SVD',
      'savedroid',
      BigInt.fromI32(18)
    )
    staticDefinitions[3] = tokenSVD

    // Add TheDAO
    let tokenTheDAO = new StaticTokenDefinition(
      Address.fromString('0xbb9bc244d798123fde783fcc1c72d3bb8c189413'),
      'TheDAO',
      'TheDAO',
      BigInt.fromI32(16)
    )
    staticDefinitions[4] = tokenTheDAO

    // Add HPB
    let tokenHPB = new StaticTokenDefinition(
      Address.fromString('0x38c6a68304cdefb9bec48bbfaaba5c5b47818bb2'),
      'HPB',
      'HPBCoin',
      BigInt.fromI32(18)
    )
    staticDefinitions[5] = tokenHPB

    return staticDefinitions
  }

  // Helper for hardcoded tokens
  static fromAddress(tokenAddress: Address) : StaticTokenDefinition | null {
    let staticDefinitions = this.getStaticDefinitions()
    let tokenAddressHex = tokenAddress.toHexString()

    // Search the definition using the address
    for (let i = 0; i < staticDefinitions.length; i++) {
      let staticDefinition = staticDefinitions[i]
      if(staticDefinition.address.toHexString() == tokenAddressHex) {
        return staticDefinition
      }
    }

    // If not found, return null
    return null
  }

}