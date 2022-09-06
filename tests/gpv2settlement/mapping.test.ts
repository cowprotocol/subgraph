import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  afterEach,
  assert,
  clearStore,
  describe,
  test,
  dataSourceMock,
} from "matchstick-as";
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
    describe("when buyToken and sellToken do not exist", () => {
      test("stores tokens and trades", () => {
        let owner = Address.fromString(
          "0x0000000000000000000000000000000000000001"
        );
        let sellToken = Address.fromString(
          "0x0000000000000000000000000000000000000010"
        );
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

        mockErc20(sellToken, "Token 1", "TK1", BigInt.fromI32(18));
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
        let buyTokenId = buyToken.toHexString();

        assert.fieldEquals("Token", sellTokenId, "name", "Token 1");
        assert.fieldEquals("Token", sellTokenId, "symbol", "TK1");
        assert.fieldEquals("Token", sellTokenId, "decimals", "18");
        assert.fieldEquals("Token", sellTokenId, "totalVolume", "100");
        assert.fieldEquals("Token", sellTokenId, "priceEth", "1000000000000");
        assert.fieldEquals("Token", sellTokenId, "priceUsd", "1000000000000");
        assert.fieldEquals("Token", sellTokenId, "numberOfTrades", "1");
        assert.fieldEquals("Token", sellTokenId, "totalVolumeEth", "0.0001");
        assert.fieldEquals("Token", sellTokenId, "totalVolumeUsd", "0.0001");

        assert.fieldEquals("Token", buyTokenId, "name", "Token 2");
        assert.fieldEquals("Token", buyTokenId, "symbol", "TK2");
        assert.fieldEquals("Token", buyTokenId, "decimals", "18");
        assert.fieldEquals("Token", buyTokenId, "totalVolume", "50");
        assert.fieldEquals("Token", buyTokenId, "priceEth", "1000000000000");
        assert.fieldEquals("Token", buyTokenId, "priceUsd", "1000000000000");
        assert.fieldEquals("Token", buyTokenId, "numberOfTrades", "1");
        assert.fieldEquals("Token", buyTokenId, "totalVolumeEth", "0.00005");
        assert.fieldEquals("Token", buyTokenId, "totalVolumeUsd", "0.00005");

        // TODO: Check entity <Total>

        // TODO: Check entity <Settlement>

        let tradeId =
          orderUid.toHexString() +
          "|" +
          event.transaction.hash.toHexString() +
          "|" +
          event.transaction.index.toString();

        assert.fieldEquals(
          "Trade",
          tradeId,
          "buyToken",
          buyToken.toHexString()
        );
        assert.fieldEquals("Trade", tradeId, "buyAmount", "50");
        assert.fieldEquals(
          "Trade",
          tradeId,
          "sellToken",
          sellToken.toHexString()
        );
        assert.fieldEquals("Trade", tradeId, "sellAmount", "100");
        assert.fieldEquals("Trade", tradeId, "order", orderUid.toHexString());
        assert.fieldEquals(
          "Trade",
          tradeId,
          "gasPrice",
          event.transaction.gasPrice.toString()
        );
        assert.fieldEquals("Trade", tradeId, "feeAmount", feeAmount.toString());
        assert.fieldEquals("Trade", tradeId, "feeAmountUsd", "0.000005");
        assert.fieldEquals("Trade", tradeId, "feeAmountEth", "0.000005");
        assert.fieldEquals("Trade", tradeId, "buyAmountEth", "0.00005");
        assert.fieldEquals("Trade", tradeId, "sellAmountEth", "0.0001");
        assert.fieldEquals("Trade", tradeId, "buyAmountUsd", "0.00005");
        assert.fieldEquals("Trade", tradeId, "sellAmountUsd", "0.0001");
        assert.fieldEquals(
          "Trade",
          tradeId,
          "timestamp",
          event.block.timestamp.toString()
        );
        assert.fieldEquals(
          "Trade",
          tradeId,
          "txHash",
          event.transaction.hash.toHexString()
        );
        assert.fieldEquals(
          "Trade",
          tradeId,
          "settlement",
          event.transaction.hash.toHexString()
        );

        // TODO: Check entity <TokenTradingEvent>

        // TODO: Check entity <Order>

        // TODO: Check entity <User>

        // TODO: Check entity <Pair>
      });
    });
  });
});