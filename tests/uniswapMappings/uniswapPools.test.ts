import { ethereum, BigInt, BigDecimal, Address } from "@graphprotocol/graph-ts";
import {
  describe,
  test,
  assert,
  beforeEach,
  afterAll,
  clearStore,
  newMockEvent,
} from "matchstick-as";
import { UniswapPool, UniswapToken, Bundle } from "../../generated/schema";
import { Initialize as InitializeEvent } from "../../generated/templates/Pool/Pool";
import { handleInitialize } from "../../src/uniswapMappings/uniswapPools";
let pool: UniswapPool;
let poolId: string = "0xc6a872b86fac61e67c340921f100d366e80244f9";
let bundle: Bundle;
function createEvent(tick: i32, sqrtPriceX96: BigInt): InitializeEvent {
  let mockEvent = newMockEvent();

  let event = new InitializeEvent(
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters,
    null
  );

  event.parameters = new Array();

  let tickParam = new ethereum.EventParam("tick", ethereum.Value.fromI32(tick));
  let sqrtPriceX96Param = new ethereum.EventParam(
    "sqrtPriceX96",
    ethereum.Value.fromUnsignedBigInt(sqrtPriceX96)
  );

  event.parameters.push(sqrtPriceX96Param);
  event.parameters.push(tickParam);

  return event;
}

describe("handleInitialize", () => {
  afterAll(() => {
    clearStore();
  });

  describe("when pool exist", () => {
    beforeEach(() => {
      let token0 = new UniswapToken("token0");
      token0.address = Address.fromString(
        "0x0000000000000000000000000000000000000001"
      );
      token0.name = "token0";
      token0.symbol = "tk0";
      token0.decimals = 8;
      token0.allowedPools = ["p1"];
      token0.save();
      let token1 = new UniswapToken("token1");
      token1.address = Address.fromString(
        "0x0000000000000000000000000000000000000002"
      );
      token1.name = "token1";
      token1.symbol = "tk1";
      token1.decimals = 8;
      token1.allowedPools = ["p1"];
      token1.save();
      pool = new UniswapPool(poolId);
      pool.tick = BigInt.fromI32(1);
      pool.token0 = token0.id;
      pool.token1 = token1.id;
      pool.token0Price = BigDecimal.fromString("100.5");
      pool.token1Price = BigDecimal.fromString("50.5");
      pool.liquidity = BigInt.fromI32(100);
      pool.totalValueLockedToken0 = BigDecimal.fromString("50.5");
      pool.totalValueLockedToken1 = BigDecimal.fromString("44.5");
      pool.save();
    });

    describe("and Bundle exist", () => {
      beforeEach(() => {
        bundle = new Bundle("1");
        bundle.ethPriceUSD = BigDecimal.fromString("10");
        bundle.save();
      });

      test("updates pool.tick, bundle.ethPriceUSD, token.priceEth and token.priceUsd", () => {
        let event = createEvent(10, BigInt.fromI32(100));
        event.address = Address.fromString(poolId);

        handleInitialize(event);

        assert.fieldEquals("UniswapPool", poolId, "tick", "10");
        assert.fieldEquals("Bundle", "1", "ethPriceUSD", "0");
        assert.fieldEquals("UniswapToken", "token0", "priceEth", "0");
        assert.fieldEquals("UniswapToken", "token1", "priceEth", "0");
        assert.fieldEquals("UniswapToken", "token0", "priceUsd", "0");
        assert.fieldEquals("UniswapToken", "token1", "priceUsd", "0");
      });
    });
  });

  describe("when pool does not exist", () => {
    describe("and bundle exist", () => {
      beforeEach(() => {
        bundle = new Bundle("1");
        bundle.ethPriceUSD = BigDecimal.fromString("10");
        bundle.save();
      });

      test("updats bundle.ethPriceUSD", () => {
        let event = createEvent(10, BigInt.fromI32(100));

        handleInitialize(event);

        assert.fieldEquals("Bundle", "1", "ethPriceUSD", "0");
      });
    });
  });
});
