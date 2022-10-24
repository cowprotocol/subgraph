# CoW-subgraph

Implements a subgraph for the [CoW Protocol](https://github.com/cowprotocol/contracts)

*This is a work in progress*

- [Subgraph on mainnet](https://thegraph.com/hosted-service/subgraph/cowprotocol/cow)
- [Subgraph on rinkeby (will be deprecated)](https://thegraph.com/hosted-service/subgraph/cowprotocol/cow-rinkeby)
- [Subgraph on goerli](https://thegraph.com/hosted-service/subgraph/cowprotocol/cow-goerli)
- [Subgraph on gnosis chain network](https://thegraph.com/hosted-service/subgraph/cowprotocol/cow-gc)

For more information about:

The Cow Protocol: https://docs.cow.fi/

The Graph: https://thegraph.com/docs/en/

There is also a GP v1 subgraph here: https://github.com/gnosis/dex-subgraph

## Model 

Further information about the model [here](./docs/model.md)

## Setup of your own test subgraph

*Requisites:* You must have access to a console and have yarn installed. More info about [yarn](https://classic.yarnpkg.com/lang/en/docs/)

1. Install the dependencies by executing:

```bash
$ yarn
```

2. Go to The Graph [hosted service](https://thegraph.com/hosted-service/dashboard) and log in using your github credentials. 

3. Copy your access token and run the following:

```bash
$ graph auth --product hosted-service <YourAccessToken>
```

5. In your browser, create a new subgraph in the dashboard by clicking "Add Subgraph" button. Complete the form. Notice your subgraph will be named: `YourGithubAccount/SubgraphName`

6. Create your own environment and edit so it points to your testing subgraph:

```bash
cp .env.example .env
```

7. Deploy:
```bash
yarn deploy
```

If everything went well you'll have a copy of this subgraph running on your hosted service account indexing your desired network.

Please notice a subgraph can only index a single network, if you want to index another network you should create a new subgraph and do same steps starting from step 3.

## Tests

For running all tests execute:

```bash
yarn test
```

Further information about creating tests, tests organization and running them [here](./docs/tests.md)
