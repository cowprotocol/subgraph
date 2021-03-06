const assert = require('assert')
const { series } = require('async')
const { default: chalk } = require('chalk')
const { exec } = require('child_process')
const { confirm } = require('./utils')

require('dotenv').config()

const NETWORK = process.env.NETWORK
assert(NETWORK, 'NETWORK env var is required')

const SUBGRAPH = process.env.SUBGRAPH
assert(SUBGRAPH, 'SUBGRAPH env var is required')

console.log(`Prepare subgraph config for network ${NETWORK}`)
console.log(`  Generate subgraph.yaml`)

series([
  (callback) => exec(`mustache config/${NETWORK}.json subgraph.yaml.mustache > subgraph.yaml`, null, callback),

  (callback) => {
    console.log('\nš Generate code from your GraphQL schema')
    return exec('yarn codegen', undefined, callback)
  },

  (callback) => {
    console.log(`\nā¬ļø  Deploying graph:
      ${chalk.blue('Subgraph')}: ${SUBGRAPH}
      ${chalk.blue('Network')}: ${NETWORK}
`)
    confirm({
      message: chalk.red('Are you sure you want to deploy?'),
      callbackYes() {
        exec(`graph deploy ${SUBGRAPH} --node https://api.thegraph.com/deploy/ --ipfs https://api.thegraph.com/ipfs/`, (error) => {
          if (error) {
            console.log(`${chalk.red('\n\nš© There was an error deploying the subgraph š©')} \n\n`)
            console.error(`${error}`)
            return
          }
        })
        console.log(`\nš Deploy graph to https://thegraph.com/hosted-service/subgraph/${SUBGRAPH}`)
        callback()
      },
      callbackNo() {
        console.log('\nš¤ Ok, not deploying then'); callback()
      }
    })
  }
], (error) => {
  if (error) {
    console.log(`${chalk.red('\n\nš© There was an error preparing the subgraph š©')} \n\n`)
    console.error(`${error}`)
    return
  }
  return
});