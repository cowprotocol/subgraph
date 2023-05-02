const assert = require("assert");
const { series } = require("async");
const { default: chalk } = require("chalk");
const { exec } = require("child_process");
const { confirm } = require("./utils");

require("dotenv").config();

const NETWORK = process.env.NETWORK;
assert(NETWORK, "NETWORK env var is required");

const SUBGRAPH = process.env.SUBGRAPH;
assert(SUBGRAPH, "SUBGRAPH env var is required");

const AUTH_TOKEN = process.env.AUTH_TOKEN;
assert(AUTH_TOKEN, "AUTH_TOKEN env var is required");

const VERSION = process.env.npm_package_version;
assert(
  VERSION,
  "npm_package_version env var is required. This is defined by npm when version field is defined in the package.json file."
);

console.log(`Prepare subgraph config for network ${NETWORK}`);
console.log(`  Generate subgraph.yaml`);

series(
  [
    (callback) => {
      return exec(
        `mustache config/${NETWORK}.json subgraph.yaml.mustache > subgraph.yaml`,
        callback
      );
    },
    (callback) => {
      console.log("\n📝 Generate code from your GraphQL schema");
      return exec("yarn codegen", callback);
    },
    (callback) => {
      console.log("\n📝 Build subgraph");
      return exec("yarn build", callback);
    },
    (callback) => {
      console.log("\n📝 Authenticate with the Graph Studio");
      return exec(`graph auth --studio ${AUTH_TOKEN}`, callback);
    },
    (callback) => {
      console.log(`\n⬆️  Deploying graph:
        ${chalk.blue("Subgraph")}: ${SUBGRAPH}
        ${chalk.blue("Network")}: ${NETWORK}
      `);
      confirm({
        message: chalk.red("Are you sure you want to deploy?"),
        callbackYes() {
          exec(
            `graph deploy --studio ${SUBGRAPH} --version-label ${VERSION}`,
            (error) => {
              if (error) {
                console.log(
                  `${chalk.red(
                    "\n\n🚩 There was an error deploying the subgraph 🚩"
                  )} \n\n`
                );
                console.error(`${error}`);
                return;
              }
            }
          );
          console.log(
            `\n🚀 Deploy graph to https://thegraph.com/studio/subgraph/${SUBGRAPH}`
          );
          callback();
        },
        callbackNo() {
          console.log("\n🤗 Ok, not deploying then");
          callback();
        },
      });
    },
  ],
  (error) => {
    if (error) {
      console.log(
        `${chalk.red(
          "\n\n🚩 There was an error preparing the subgraph 🚩"
        )} \n\n`
      );
      console.error(`${error}`);
      return;
    }
    return;
  }
);
