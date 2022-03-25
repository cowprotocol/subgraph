/* eslint-disable prefer-const */
import { BigInt, BigDecimal, Address } from '@graphprotocol/graph-ts'
import { UniswapV2Pair__getReservesResult } from '../../generated/GPV2Settlement/UniswapV2Pair'

export let ZERO_BI = BigInt.fromI32(0)
export let ONE_BI = BigInt.fromI32(1)
export let ZERO_BD = BigDecimal.fromString('0')
export let ONE_BD = BigDecimal.fromString('1')
export let MINUS_ONE_BD = ZERO_BD.minus(ONE_BD)


export let ZERO_ADDRESS = Address.fromI32(0)
export let EMPTY_RESERVES_RESULT = new UniswapV2Pair__getReservesResult(ZERO_BI, ZERO_BI, ZERO_BI)
export let UNISWAP_FACTORY = Address.fromString('0xA818b4F111Ccac7AA31D0BCc0806d64F2E0737D7')

export let WETH_ADDRESS = new Map<string, Address>()
WETH_ADDRESS.set('xdai', Address.fromString('0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1'))

export let STABLECOIN_ADDRESS = new Map<string, Address>()
STABLECOIN_ADDRESS.set('xdai', Address.fromString('0xe91d153e0b41518a2ce8dd3d7944fa863463a97d'))