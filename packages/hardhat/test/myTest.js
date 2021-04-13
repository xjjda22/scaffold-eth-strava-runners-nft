const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
const { utils } = require("ethers");

use(solidity);

describe("My Dapp", function() {
  let myContract;
  let accounts;

  before(async function() {
    accounts = await ethers.getSigners();
    // for(_i in accounts) {
    //   const _b = await ethers.getDefaultProvider().getBalance(accounts[_i].address);
    //   console.log('account, balance:',accounts[_i].address, utils.formatEther(_b));
    // };
    // console.log(ethers);
  });

  describe("YourCollectible", function() {
    it("Should deploy YourCollectible", async function() {
      const YourCollectible = await ethers.getContractFactory(
        "YourCollectible"
      );

      myContract = await YourCollectible.deploy();
      const _a = await myContract.address;
      const _o = await myContract.owner();
      console.log("YourCollectible address", _a);
      console.log("YourCollectible owner", _o);
    });

    describe("check fields()", function() {
      it("check name", async function() {
        const _n = await myContract.name();
        // console.log(_n);
        expect(_n).to.equal("YourCollectible");
      });

      it("check symbol", async function() {
        const _s = await myContract.symbol();
        // console.log(_s);
        expect(_s).to.equal("YCB");
      });
    });
  });
});
