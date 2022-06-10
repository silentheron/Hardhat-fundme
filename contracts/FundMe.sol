// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";
import "hardhat/console.sol";

error FundMe__NotOwner();

/// @title A contract for crowd funding
/// @author Boris Ryjkov
/// @notice This contract is to demo a sample funding contract
/// @dev This implements price feeds as our library
contract FundMe {
    // Type declarations
    using PriceConverter for uint256; // lets me use functions from PriceConverter contract on uint256

    // State variables
    address[] public s_funders;
    mapping(address => uint256) private s_addressToAmountFunded;
    uint256 public constant MINIMUN_USD = 50 * 1e18;
    address private immutable i_owner;
    AggregatorV3Interface public s_priceFeed;

    modifier onlyOwner() {
        //  require(msg.sender == i_owner, "Sender is not owner");
        if (msg.sender != i_owner) {
            revert FundMe__NotOwner();
        }
        _;
    }

    constructor(address priceFeedAddrress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddrress);
    }

    function fund() public payable {
        // Want to be able to set a minimum value in USD
        // 1. How to send ETH to this contract?
        require(msg.value.getConversionRate(s_priceFeed) >= MINIMUN_USD,"Didn't send enough"); // 1e18 == 1 * 10 ** 18 == 1000000000000000000
        s_funders.push(msg.sender);
        s_addressToAmountFunded[msg.sender] += msg.value;
        // emit Funded(msg.sender, msg.value);
    }

    function withdraw() public onlyOwner {
        
        for (uint256 funderIndex = 0; funderIndex < s_funders.length; funderIndex++) {
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        s_funders = new address[](0);

        // actually withdraw the funds

        (bool callSuccess, ) = payable(msg.sender).call{ value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }

    function cheaperWithdraw() public payable onlyOwner {
        address[] memory funders = s_funders;
        for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
            address funder = funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        // reset the array
        s_funders = new address[](0);
         (bool callSuccess, ) = payable(msg.sender).call{ value: address(this).balance}("");
        require(callSuccess, "Call failed");
    }
    
    function getOwner() public view returns(address) {
        return i_owner;
    }

    function getFunder(uint256 funderIndex) public view returns(address) {
        return s_funders[funderIndex];
    }

    function getAmountFunded(address funder) public view returns(uint256) {
        return s_addressToAmountFunded[funder];
    }
    // What happens if someone sends this contract ETH without the fund function?

    function getPriceFeed() public view returns(AggregatorV3Interface) {
        return s_priceFeed;
    }
}
