# CoW-subgraph

Implements a subgraph for the [CoW Protocol](https://github.com/cowprotocol/contracts)

_This is a work in progress_

- [Subgraph on mainnet](https://thegraph.com/studio/subgraph/cow/)
- [Subgraph on goerli](https://thegraph.com/studio/subgraph/cow-goerli/)
- [Subgraph on gnosis chain network](https://thegraph.com/studio/subgraph/cow-gc/)

For more information about:

The Cow Protocol: https://docs.cow.fi/

The Graph: https://thegraph.com/docs/en/

There is also a GP v1 subgraph here: https://github.com/gnosis/dex-subgraph

## Model

Further information about the model [here](./model.md)

## Setup of your own test subgraph

_Requisites:_ You must have access to a console and have yarn installed. More info about [yarn](https://classic.yarnpkg.com/lang/en/docs/)

1. Install the dependencies by executing:

```bash
$ yarn
```

2. Go to The Graph [Studio](https://thegraph.com/studio/dashboard) and log in using your github credentials.

3. In your browser, create a new subgraph in the dashboard by clicking "Add Subgraph" button. Complete the form.

4. Create your own environment and edit so it points to your testing subgraph:

```bash
cp .env.example .env
```

5. Deploy:

```bash
yarn deploy
```

If everything went well you'll have a copy of this subgraph running on your hosted service account indexing your desired network.

Please notice a subgraph can only index a single network, if you want to index another network you should create a new subgraph and do same steps starting from step 3.
