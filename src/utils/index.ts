/* eslint-disable prefer-const */
import { BigInt, BigDecimal, ethereum } from '@graphprotocol/graph-ts'
import { ONE_BI, ZERO_BI, ZERO_BD, ONE_BD } from '../utils/constants'

export function exponentToBigDecimal(decimals: BigInt): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = ZERO_BI; i.lt(decimals as BigInt); i = i.plus(ONE_BI)) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

// return 0 if denominator is 0 in division
export function safeDiv(amount0: BigDecimal, amount1: BigDecimal): BigDecimal {
  if (amount1.equals(ZERO_BD)) {
    return ZERO_BD
  } else {
    return amount0.div(amount1)
  }
}

export function isNullEthValue(value: string): boolean {
  return value == '0x0000000000000000000000000000000000000000000000000000000000000001'
}

export function convertTokenToDecimal(tokenAmount: BigInt, exchangeDecimals: BigInt): BigDecimal {
  let exchangeDecimalsExponent = exchangeDecimals ? exponentToBigDecimal(exchangeDecimals) : ZERO_BD
  if (!exchangeDecimals || exchangeDecimals == ZERO_BI || exchangeDecimalsExponent == ZERO_BD) {
    return tokenAmount.toBigDecimal()
  }
  return tokenAmount.toBigDecimal().div(exchangeDecimalsExponent)
}