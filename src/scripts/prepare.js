const assert = require('assert')
const {series} = require('async')
const {exec} = require('child_process')

require('dotenv').config()

// const DEV_SUBGRAPH = process.env.DEV_SUBGRAPH
// assert(DEV_SUBGRAPH, 'DEV_SUBGRAPH env var is required')
const NETWORK = process.env.NETWORK
assert(NETWORK, 'NETWORK env var is required')

console.log(`📝 Prepare subgraph config for network ${NETWORK}`)
exec(
  `mustache config/${NETWORK}.json subgraph.yaml.mustache > subgraph.yaml`,
  undefined,
  () => console.log(`🎉 Generated subgraph.yaml`)
)