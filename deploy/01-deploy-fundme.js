// import

// main

// calling main

// async function deployFunc(hre) {
//     console.log("Sup bitches!");
// }

// module.exports.default = deployFunc;

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre;
// };
const { network } = require("hardhat");
const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;

    // if chainId is X use address Y
    let ethUsdPriceFeedAddress;
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }
    // if a contract doesn't exist, we deploy a minimal version of it for local testing

    // when going for localhost or hardhat network we want to use a mock
    log("Deploying FundMe and waiting for confirmations...");
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, // put price feed address,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    log(`Deployer at ${deployer}`);
    if (
        !developmentChain.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(fundMe.address, args);
    }
    log("----------------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
