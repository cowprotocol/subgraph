import { Address, ethereum, BigInt, Bytes } from "@graphprotocol/graph-ts";
import { createMockedFunction, newMockEvent } from "matchstick-as";
import { Trade as TradeEvent } from "../../generated/GPV2Settlement/GPV2Settlement";

export function createTradeEvent(
  owner: Address,
  sellToken: Address,
  buyToken: Address,
  sellAmount: BigInt,
  buyAmount: BigInt,
  feeAmount: BigInt,
  orderUid: Bytes
): TradeEvent {
  let mockEvent = newMockEvent();

  let event = new TradeEvent(
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

  let ownerParam = new ethereum.EventParam(
    "owner",
    ethereum.Value.fromAddress(owner)
  );
  let sellTokenParam = new ethereum.EventParam(
    "sellToken",
    ethereum.Value.fromAddress(sellToken)
  );
  let buyTokenParam = new ethereum.EventParam(
    "buyToken",
    ethereum.Value.fromAddress(buyToken)
  );
  let sellAmountParam = new ethereum.EventParam(
    "sellAmount",
    ethereum.Value.fromSignedBigInt(sellAmount)
  );
  let buyAmountParam = new ethereum.EventParam(
    "buyAmount",
    ethereum.Value.fromSignedBigInt(buyAmount)
  );
  let feeAmountParam = new ethereum.EventParam(
    "feeAmount",
    ethereum.Value.fromSignedBigInt(feeAmount)
  );
  let orderUidParam = new ethereum.EventParam(
    "orderUid",
    ethereum.Value.fromBytes(orderUid)
  );

  event.parameters.push(ownerParam);
  event.parameters.push(sellTokenParam);
  event.parameters.push(buyTokenParam);
  event.parameters.push(sellAmountParam);
  event.parameters.push(buyAmountParam);
  event.parameters.push(feeAmountParam);
  event.parameters.push(orderUidParam);

  return event;
}

function mockContractFunction(
  address: Address,
  name: string,
  signature: string,
  result: ethereum.Value[],
  args: ethereum.Value[]
): void {
  createMockedFunction(address, name, signature)
    .withArgs(args)
    .returns(result);
}

function mockErc20Decimals(address: Address, value: BigInt): void {
  mockContractFunction(
    address,
    "decimals",
    "decimals():(uint8)",
    [ethereum.Value.fromUnsignedBigInt(value)],
    []
  );
}

function mockErc20Name(address: Address, value: string): void {
  mockContractFunction(
    address,
    "name",
    "name():(string)",
    [ethereum.Value.fromString(value)],
    []
  );
}

function mockErc20Symbol(address: Address, value: string): void {
  mockContractFunction(
    address,
    "symbol",
    "symbol():(string)",
    [ethereum.Value.fromString(value)],
    []
  );
}

export function mockErc20(
  address: Address,
  name: string,
  symbol: string,
  decimals: BigInt
): void {
  mockErc20Name(address, name);
  mockErc20Symbol(address, symbol);
  mockErc20Decimals(address, decimals);
}

export function mockUniswapFactoryGetPair(
  contractAddress: Address,
  functionArgs: Address[],
  functionResult: Address
): void {
  mockContractFunction(
    contractAddress,
    "getPair",
    "getPair(address,address):(address)",
    [ethereum.Value.fromAddress(functionResult)],
    [
      ethereum.Value.fromAddress(functionArgs[0]),
      ethereum.Value.fromAddress(functionArgs[1]),
    ]
  );
}

function mockUniswapV2PairGetReserves(
  address: Address,
  one: BigInt,
  two: BigInt,
  three: BigInt
): void {
  mockContractFunction(
    address,
    "getReserves",
    "getReserves():(uint112,uint112,uint32)",
    [
      ethereum.Value.fromUnsignedBigInt(one),
      ethereum.Value.fromUnsignedBigInt(two),
      ethereum.Value.fromUnsignedBigInt(three),
    ],
    []
  );
}

function mockUniswapV2PairToken0(address: Address, value: Address): void {
  mockContractFunction(
    address,
    "token0",
    "token0():(address)",
    [ethereum.Value.fromAddress(value)],
    []
  );
}

function mockUniswapV2PairToken1(address: Address, value: Address): void {
  mockContractFunction(
    address,
    "token1",
    "token1():(address)",
    [ethereum.Value.fromAddress(value)],
    []
  );
}

export function mockUniswapV2Pair(
  address: Address,
  reserves: BigInt[],
  token0: Address,
  token1: Address
): void {
  mockUniswapV2PairGetReserves(address, reserves[0], reserves[1], reserves[2]);
  mockUniswapV2PairToken0(address, token0);
  mockUniswapV2PairToken1(address, token1);
}