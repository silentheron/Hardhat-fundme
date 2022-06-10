const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    console.log("Withdrawing funds from contract...");
    const balance = await ethers.provider.getBalance(fundMe.address);
    const transactionResponse = await fundMe.withdraw();
    await transactionResponse.wait(1);
    console.log(
        `--Deployer at ${deployer}\n--Withdrawn ${balance.toString()} Wei\n--From contract address: ${
            (await fundMe).address
        }`
    );
    // console.log(`Withdrawn ${balance.toString} ETH successfuly`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
