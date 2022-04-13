const assert = require('assert')
const {series} = require('async')
const { default: chalk } = require('chalk')
const {exec} = require('child_process')
const {confirm} = require('./utils')

require('dotenv').config()

const NETWORK = process.env.NETWORK
assert(NETWORK, 'NETWORK env var is required')

const SUBGRAPH = process.env.SUBGRAPH
assert(SUBGRAPH, 'SUBGRAPH env var is required')

console.log(`Prepare subgraph config for network ${NETWORK}`)
console.log(`  Generate subgraph.yaml`)

series([
  (callback) => exec(`yarn prepare:mainnet`, null, callback),

  (callback) => {
    console.log('\n📝 Generate code from your GraphQL schema')
    return exec('yarn codegen', undefined, callback)    
  },

  (callback) => {
    console.log(`\n⬆️  Deploying graph:
      ${chalk.blue('Subgraph')}: ${SUBGRAPH}
      ${chalk.blue('Network')}: ${NETWORK}
`)
    confirm({
      message: chalk.red('Are you sure you want to deploy?'),
      callbackYes() {      
        exec(`graph deploy ${SUBGRAPH} --node https://api.thegraph.com/deploy/`)
        console.log(`\n🚀 Deploy graph to https://thegraph.com/hosted-service/subgraph/${SUBGRAPH}`)  
        callback()
      },
      callbackNo() {
        console.log('\n🤗 Ok, not deploying then'); callback()
      }
    })    
  }
], function(error) {
  if(error) {
    console.log(`${chalk.red('\n\n🚩 There was an error preparing the subgraph 🚩')}: \n\n ${error}`)
    return
  }
});