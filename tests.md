# Tests explained

### About test framework

We are using **matchstick** for testing subgraphs. For being able to run the matchstick tests you need to install *postgresql*. You can find more information [here](https://thegraph.com/docs/en/developing/unit-testing-framework/)

### About folder organization
 
There are 3 different folders for organizing the tests:

1.- **gpv2settlement:** this folder will contain tests related to settlement contract. It doesn't matter where it's deployed which code will be execueted in that case
2.- **gc:** this folder will contain tests related to price calculation that's being done on Gnosis Chain only. At the moment we are using honeyswap (Uniswap v2 pools) to estimate prices.
3.- **mainnet:** this folder will containt tests related to price calculation in mainnet. In mainnet Uniswap v3 is being indexed, it's pools and tokens.

Inside each folder we will put the tests replicating `src` folder structure of what the test aim to test. 
It's important to notice all files should contain .test. string on it's name.
There's also a `utils.js` file that will contain utilities and helpers for creating entities or mocks that are common to different tests.

### About writting tests

All files will contain different `describe` functions nested and a `test` function at the end:

``` Javascript
describe(FileName, () => { // FileName will be replaced by it's file name
  describe(FunctionName () => { // FunctionName will be replaced by it's function name
    describe(SetupExpectations, () => { // SetupExpectations is the stage we need to build to make possible the test to run
      test(WhatAreWeTesting, () => { // Here we will name the test using what's the result we are waiting after test is executed.
```

### About test running.

- `yarn test`: running this command all tests on folder `tests` will be run. 
- `yarn test:env`: running this .env variable will be read to run that sepcific set of tests
- `yarn test:gc`:  we filter the tests to the gc folder only
- `yarn test:mainnet`: we filter the tests to the mainnet folder only
- `yarn test:cow`: runing this we filter by gpv2settlement contract only.

