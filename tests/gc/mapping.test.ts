import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  afterEach,
  assert,
  clearStore,
  describe,
  test,
  dataSourceMock,
} from "matchstick-as";
import { Token } from "../../generated/schema";
import { handleTrade } from "../../src/mapping";
import {
  STABLECOIN_ADDRESS_GC,
  UNISWAP_FACTORY,
  WETH_ADDRESS_GC,
} from "../../src/utils/constants";
import {
  mockErc20,
  mockUniswapFactoryGetPair,
  mockUniswapV2Pair,
  createTradeEvent,
} from "./utils";

describe("Mapping", () => {
  afterEach(() => {
    clearStore();
  });

  describe("handleTrade", () => {
    describe("when sellToken is a stablecoin", () => {
      test("GetPrice should return one dollar price", () => {
        let owner = Address.fromString(
          "0x0000000000000000000000000000000000000001"
        );
        let sellToken = STABLECOIN_ADDRESS_GC
        let buyToken = Address.fromString(
          "0x0000000000000000000000000000000000000020"
        );

        let sellAmount = BigInt.fromI32(100);
        let buyAmount = BigInt.fromI32(50);
        let feeAmount = BigInt.fromI32(5);

        let orderUid = Bytes.fromHexString(
          "0x0000000000000000000000000000000000000022"
        );

        dataSourceMock.setNetwork("xdai");

        mockErc20(sellToken, "DAI", "DAI", BigInt.fromI32(6));
        mockErc20(buyToken, "Token 2", "TK2", BigInt.fromI32(18));
        mockErc20(WETH_ADDRESS_GC, "WETH", "WETH", BigInt.fromI32(6));
        mockErc20(STABLECOIN_ADDRESS_GC, "DAI", "DAI", BigInt.fromI32(6));

        let pair = Address.fromString(
          "0x0000000000000000000000000000000000000100"
        );

        let pair2 = Address.fromString(
          "0x0000000000000000000000000000000000000101"
        );

        let pair3 = Address.fromString(
          "0x0000000000000000000000000000000000000102"
        );

        mockUniswapFactoryGetPair(
          UNISWAP_FACTORY,
          [sellToken, WETH_ADDRESS_GC],
          pair
        );

        mockUniswapV2Pair(
          pair,
          [BigInt.fromI32(100), BigInt.fromI32(100), BigInt.fromI32(100)],
          sellToken,
          WETH_ADDRESS_GC
        );

        mockUniswapFactoryGetPair(
          UNISWAP_FACTORY,
          [WETH_ADDRESS_GC, STABLECOIN_ADDRESS_GC],
          pair2
        );

        mockUniswapV2Pair(
          pair2,
          [BigInt.fromI32(50), BigInt.fromI32(50), BigInt.fromI32(50)],
          WETH_ADDRESS_GC,
          STABLECOIN_ADDRESS_GC
        );

        mockUniswapFactoryGetPair(
          UNISWAP_FACTORY,
          [buyToken, WETH_ADDRESS_GC],
          pair3
        );

        mockUniswapV2Pair(
          pair3,
          [BigInt.fromI32(10), BigInt.fromI32(10), BigInt.fromI32(10)],
          buyToken,
          WETH_ADDRESS_GC
        );

        let event = createTradeEvent(
          owner,
          sellToken,
          buyToken,
          sellAmount,
          buyAmount,
          feeAmount,
          orderUid
        );

        handleTrade(event);

        let sellTokenId = sellToken.toHexString();

        assert.fieldEquals("Token", sellTokenId, "priceUsd", "1");
      });
    });
  });
});