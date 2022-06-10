const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("FundMe", function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          let expectedAmount = ethers.utils.parseEther("1");
          beforeEach(async function () {
              // deploy fundMe contract
              // using hardhat-deploy
              deployer = (await getNamedAccounts()).deployer;
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
              await fundMe.fund({ value: expectedAmount });
          });
          describe("constructor", function () {
              it("sets the aggregator addresses correctly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", function () {
              it("Fails if you don't send enough ETH", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "Didn't send enough"
                  );
              });
              it("Updated the amount funded data structure", async function () {
                  const amountInContract = await fundMe.getAmountFunded(
                      deployer
                  );
                  assert.equal(
                      expectedAmount.toString(),
                      amountInContract.toString()
                  );
              });

              it("Update the funders array with funder addresses", async function () {
                  const funder = await fundMe.getFunder(0);
                  assert.equal(deployer, funder);
              });
          });

          describe("Withdraw", function () {
              it("Should withdraw ETH from a single funder", async function () {
                  // Arrange
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address); // This is the balance in the contract
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer); // This is the balance of the deployer which is also the first funder
                  // Act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // Assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  );
              });

              it("Allows us to withdraw from multiple getFunder", async function () {
                  // get multiple accounts from hardhat
                  const accounts = await ethers.getSigners();
                  for (let i = 0; i < 6; i++) {
                      // connects each account to the fund me contract
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({
                          value: expectedAmount,
                      });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Act
                  await fundMe.connect(deployer);
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );

                  // the contract
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      );
                  }
              });

              it("Only allows the owner of the contract to withdraw the funds", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner()");
              });

              it("cheaperWithdraw testing...", async function () {
                  // get multiple accounts from hardhat
                  const accounts = await ethers.getSigners();
                  for (let i = 0; i < 6; i++) {
                      // connects each account to the fund me contract
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({
                          value: expectedAmount,
                      });
                  }

                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //Act
                  await fundMe.connect(deployer);
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);

                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );

                  // the contract
                  await expect(fundMe.getFunder(0)).to.be.reverted;

                  for (i = 0; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAmountFunded(accounts[i].address),
                          0
                      );
                  }
              });
          });
      });
