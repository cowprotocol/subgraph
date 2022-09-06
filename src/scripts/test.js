const { exec } = require('child_process')
const { series } = require('async')
require('dotenv').config()

const network = process.env.NETWORK

series([
  (callback) => exec(`mustache config/${network}.json subgraph.yaml.mustache > subgraph.yaml`, null, callback),
  (callback) => exec(`yarn codegen`, null, callback),
  () => exec(`yarn test:${network} && yarn test:cow`, null, (_err, stdout, _stderr) => { console.log(stdout) }),  
])