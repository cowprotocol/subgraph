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
import { UniswapPool, Bundle } from "../../../generated/schema";
import {
  Initialize as InitializeEvent,
  Mint as MintEvent,
} from "../../../generated/templates/Pool/Pool";
import {
  handleInitialize,
  handleMint,
} from "../../../src/uniswapMappings/uniswapPools";
import { buildUniswapPool, buildUniswapToken } from "../utils";

let pool: UniswapPool;
let poolId: string = "0xc6a872b86fac61e67c340921f100d366e80244f9";
let bundle: Bundle;
let tickLower: i32;
let tickUpper: i32;
let amount: BigInt;
let amount0: BigInt;
let amount1: BigInt;

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

function createMintEvent(
  sender: Address,
  owner: Address,
  tickLower: i32,
  tickUpper: i32,
  amount: BigInt,
  amount0: BigInt,
  amount1: BigInt
): MintEvent {
  let mockEvent = newMockEvent();

  let event = new MintEvent(
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

  let senderParam = new ethereum.EventParam(
    "sender",
    ethereum.Value.fromAddress(sender)
  );
  let ownerParam = new ethereum.EventParam(
    "owner",
    ethereum.Value.fromAddress(owner)
  );
  let lowerParam = new ethereum.EventParam(
    "tickLower",
    ethereum.Value.fromI32(tickLower)
  );
  let upperParam = new ethereum.EventParam(
    "tickUpper",
    ethereum.Value.fromI32(tickUpper)
  );
  let amountParam = new ethereum.EventParam(
    "amount",
    ethereum.Value.fromSignedBigInt(amount)
  );
  let amount0Param = new ethereum.EventParam(
    "amount0",
    ethereum.Value.fromSignedBigInt(amount0)
  );
  let amount1Param = new ethereum.EventParam(
    "amount1",
    ethereum.Value.fromSignedBigInt(amount1)
  );

  event.parameters.push(senderParam);
  event.parameters.push(ownerParam);
  event.parameters.push(lowerParam);
  event.parameters.push(upperParam);
  event.parameters.push(amountParam);
  event.parameters.push(amount0Param);
  event.parameters.push(amount1Param);

  return event;
}

describe("uniswapPools", () => {
  describe("handleInitialize", () => {
    afterAll(() => {
      clearStore();
    });

    describe("when pool exist", () => {
      beforeEach(() => {
        let token0 = buildUniswapToken(
          "token0",
          Address.fromString("0x0000000000000000000000000000000000000001"),
          "token0",
          "tk0",
          8,
          ["p1"]
        );
        token0.save();

        let token1 = buildUniswapToken(
          "token1",
          Address.fromString("0x0000000000000000000000000000000000000002"),
          "token1",
          "tk1",
          8,
          ["p1"]
        );
        token1.save();

        pool = buildUniswapPool(
          poolId,
          BigInt.fromI32(1),
          token0.id,
          token1.id,
          100.5,
          50.5,
          100,
          50.5,
          44.5
        );
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

  describe("handleMint", () => {
    afterAll(() => {
      clearStore();
    });

    describe("when pool exist", () => {
      beforeEach(() => {
        let token0 = buildUniswapToken(
          "token0",
          Address.fromString("0x0000000000000000000000000000000000000001"),
          "token0",
          "tk0",
          8,
          ["p1"]
        );
        token0.save();

        let token1 = buildUniswapToken(
          "token1",
          Address.fromString("0x0000000000000000000000000000000000000002"),
          "token1",
          "tk1",
          8,
          ["p1"]
        );
        token1.save();

        pool = buildUniswapPool(
          poolId,
          null,
          token0.id,
          token1.id,
          100.5,
          50.5,
          100,
          50.5,
          44.5
        );
        pool.save();
      });

      test("updates totalValueLockedToken0 and totalValueLockedToken1", () => {
        amount = BigInt.fromI32(100);
        amount0 = BigInt.fromString("5000000000");
        amount1 = BigInt.fromString("4000000000");

        let mintEvent = createMintEvent(
          Address.fromString("0x1000000000000000000000000000000000000000"),
          Address.fromString("0x2000000000000000000000000000000000000000"),
          null,
          null,
          amount,
          amount0,
          amount1
        );

        mintEvent.address = Address.fromString(poolId);

        handleMint(mintEvent);

        assert.fieldEquals(
          "UniswapPool",
          poolId,
          "totalValueLockedToken0",
          pool.totalValueLockedToken0
            .plus(BigDecimal.fromString("50"))
            .toString()
        );
        assert.fieldEquals(
          "UniswapPool",
          poolId,
          "totalValueLockedToken1",
          pool.totalValueLockedToken1
            .plus(BigDecimal.fromString("40"))
            .toString()
        );
      });

      describe("and pool tick is not null", () => {
        beforeEach(() => {
          pool.tick = BigInt.fromI32(5);
          pool.save();
        });

        describe("and tickLower is lower than pool tick", () => {
          beforeEach(() => {
            tickLower = 4;
          });

          describe("and tickUpper is greater than pool tick", () => {
            beforeEach(() => {
              tickUpper = 15;
            });

            test("updates pool liquidity", () => {
              amount = BigInt.fromI32(100);
              amount0 = BigInt.fromI32(50);
              amount1 = BigInt.fromI32(40);

              let mintEvent = createMintEvent(
                Address.fromString(
                  "0x1000000000000000000000000000000000000000"
                ),
                Address.fromString(
                  "0x2000000000000000000000000000000000000000"
                ),
                tickLower,
                tickUpper,
                amount,
                amount0,
                amount1
              );
              mintEvent.address = Address.fromString(poolId);

              handleMint(mintEvent);

              assert.fieldEquals(
                "UniswapPool",
                poolId,
                "liquidity",
                pool.liquidity.plus(amount).toString()
              );
            });
          });

          describe("and tickUpper is lower than pool tick", () => {
            beforeEach(() => {
              tickUpper = 4;
            });

            test("does not update pool liquidity", () => {
              amount = BigInt.fromI32(100);
              amount0 = BigInt.fromI32(50);
              amount1 = BigInt.fromI32(40);

              let mintEvent = createMintEvent(
                Address.fromString(
                  "0x1000000000000000000000000000000000000000"
                ),
                Address.fromString(
                  "0x2000000000000000000000000000000000000000"
                ),
                tickLower,
                tickUpper,
                amount,
                amount0,
                amount1
              );
              mintEvent.address = Address.fromString(poolId);

              handleMint(mintEvent);

              assert.fieldEquals(
                "UniswapPool",
                poolId,
                "liquidity",
                pool.liquidity.toString()
              );
            });
          });
        });

        describe("and tickLower is greater than pool tick", () => {
          beforeEach(() => {
            tickLower = 20;
          });

          test("does not update liquidity", () => {
            amount = BigInt.fromI32(100);
            amount0 = BigInt.fromI32(50);
            amount1 = BigInt.fromI32(40);

            let mintEvent = createMintEvent(
              Address.fromString("0x1000000000000000000000000000000000000000"),
              Address.fromString("0x2000000000000000000000000000000000000000"),
              tickLower,
              tickUpper,
              amount,
              amount0,
              amount1
            );
            mintEvent.address = Address.fromString(poolId);

            handleMint(mintEvent);

            assert.fieldEquals(
              "UniswapPool",
              poolId,
              "liquidity",
              pool.liquidity.toString()
            );
          });
        });
      });

      describe("and pool tick is null", () => {
        beforeEach(() => {
          pool.tick = null;
          pool.save();
        });

        test("does not update pool liquidity", () => {
          amount = BigInt.fromI32(100);
          amount0 = BigInt.fromString("5000000000");
          amount1 = BigInt.fromString("4000000000");

          let mintEvent = createMintEvent(
            Address.fromString("0x1000000000000000000000000000000000000000"),
            Address.fromString("0x2000000000000000000000000000000000000000"),
            null,
            null,
            amount,
            amount0,
            amount1
          );
          mintEvent.address = Address.fromString(poolId);

          handleMint(mintEvent);

          assert.fieldEquals(
            "UniswapPool",
            poolId,
            "liquidity",
            pool.liquidity.toString()
          );
        });
      });
    });
  });
});