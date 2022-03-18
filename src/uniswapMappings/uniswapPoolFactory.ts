import { ALLOWED_TOKENS } from '../utils/pricing'
/* eslint-disable prefer-const */
import { ZERO_BI, ZERO_BD } from '../utils/constants'
import { PoolCreated } from '../../generated/Factory/Factory'
import { UniswapPool, Token, Bundle } from '../../generated/schema'
import { Pool as PoolTemplate } from '../../generated/templates'
import { fetchTokenSymbol, fetchTokenName, fetchTokenDecimals } from '../utils/token'
import { log, Address } from '@graphprotocol/graph-ts'

export function handlePoolCreated(event: PoolCreated): void {
  // temp fix
  if (event.params.pool == Address.fromHexString('0x8fe8d9bb8eeba3ed688069c3d6b556c9ca258248')) {
    return
  }

  let bundle = Bundle.load('1')
  if (bundle === null) {
    // create new bundle for tracking eth price
    let bundle = new Bundle('1')
    bundle.ethPriceUSD = ZERO_BD
    bundle.save()
  }

  let pool = new UniswapPool(event.params.pool.toHexString()) as UniswapPool
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.address = event.params.token0
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals.toI32()
    token0.priceEth = ZERO_BD
    token0.priceUsd = ZERO_BD
    token0.allowedPools = []
  }

  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.address = event.params.token1
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }
    token1.decimals = decimals.toI32()
    token1.priceEth = ZERO_BD
    token1.priceUsd = ZERO_BD
    token1.allowedPools = []
  }

  // update white listed pools
  if (ALLOWED_TOKENS.includes(token0.id)) {
    let newPools = token1.allowedPools
    newPools.push(pool.id)
    token1.allowedPools = newPools
  }
  if (ALLOWED_TOKENS.includes(token1.id)) {
    let newPools = token0.allowedPools
    newPools.push(pool.id)
    token0.allowedPools = newPools
  }

  pool.token0 = token0.id
  pool.token1 = token1.id
  pool.liquidity = ZERO_BI
  pool.token0Price = ZERO_BD
  pool.token1Price = ZERO_BD
  pool.totalValueLockedToken0 = ZERO_BD
  pool.totalValueLockedToken1 = ZERO_BD

  pool.save()
  // create the tracked contract based on the template
  PoolTemplate.create(event.params.pool)
  token0.save()
  token1.save()
}
