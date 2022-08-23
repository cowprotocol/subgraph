import { Address, BigInt, BigDecimal } from "@graphprotocol/graph-ts";
import { UniswapPool, UniswapToken } from "../../generated/schema";

export function buildUniswapToken(
  id: string,
  address: Address,
  name: string,
  symbol: string,
  decimals: i32,
  allowedPools: string[]
): UniswapToken {
  let token = new UniswapToken(id);
  token.address = address;
  token.name = name;
  token.symbol = symbol;
  token.decimals = decimals;
  token.allowedPools = allowedPools;

  return token;
}

export function buildUniswapPool(
  id: string,
  tick: BigInt | null,
  token0: string,
  token1: string,
  token0Price: number,
  token1Price: number,
  liquidity: i32,
  totalValueLockedToken0: number,
  totalValueLockedToken1: number
): UniswapPool {
  let pool = new UniswapPool(id);
  pool.tick = tick;
  pool.token0 = token0;
  pool.token1 = token1;
  pool.token0Price = BigDecimal.fromString(token0Price.toString());
  pool.token1Price = BigDecimal.fromString(token1Price.toString());
  pool.liquidity = BigInt.fromI32(liquidity);
  pool.totalValueLockedToken0 = BigDecimal.fromString(
    totalValueLockedToken0.toString()
  );
  pool.totalValueLockedToken1 = BigDecimal.fromString(
    totalValueLockedToken1.toString()
  );
  return pool;
}
