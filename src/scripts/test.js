const assert = require('assert')
const { exec } = require('child_process')
require('dotenv').config()

const NETWORK = process.env.NETWORK
assert(NETWORK, 'NETWORK env var is required')

exec(`graph test ${NETWORK}`, (error, stdout, stderr) => {
  console.log(stdout)
})