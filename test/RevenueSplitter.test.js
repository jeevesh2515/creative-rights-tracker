const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RevenueSplitter", function () {
  let revenueSplitter;
  let owner, payee1, payee2, payee3, other;

  beforeEach(async function () {
    [owner, payee1, payee2, payee3, other] = await ethers.getSigners();
    const RevenueSplitter = await ethers.getContractFactory("RevenueSplitter");
    revenueSplitter = await RevenueSplitter.deploy();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(revenueSplitter.address).to.not.equal(0);
    });

    it("Should set owner to deployer", async function () {
      expect(await revenueSplitter.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero total shares", async function () {
      expect(await revenueSplitter.totalShares()).to.equal(0);
    });

    it("Should initialize with zero total released", async function () {
      expect(await revenueSplitter.totalReleased()).to.equal(0);
    });
  });

  describe("Payee Management", function () {
    it("Should allow owner to add payee", async function () {
      const shares = 1000;
      const tx = await revenueSplitter.connect(owner).addPayee(payee1.address, shares);
      await expect(tx).to.emit(revenueSplitter, "PayeeAdded").withArgs(payee1.address, shares);
      expect(await revenueSplitter.shares(payee1.address)).to.equal(shares);
    });

    it("Should reject non-owner adding payee", async function () {
      await expect(
        revenueSplitter.connect(payee1).addPayee(payee2.address, 1000)
      ).to.be.revertedWith("Only owner can configure payees");
    });

    it("Should reject adding zero address", async function () {
      await expect(
        revenueSplitter.connect(owner).addPayee(ethers.ZeroAddress, 1000)
      ).to.be.revertedWith("Account is zero address");
    });

    it("Should allow adding multiple payees", async function () {
      await revenueSplitter.connect(owner).addPayee(payee1.address, 1000);
      await revenueSplitter.connect(owner).addPayee(payee2.address, 1500);
      expect(await revenueSplitter.totalShares()).to.equal(2500);
    });
  });

  describe("Payment Release", function () {
    beforeEach(async function () {
      await revenueSplitter.connect(owner).addPayee(payee1.address, 2000);
      await revenueSplitter.connect(owner).addPayee(payee2.address, 3000);
      await revenueSplitter.connect(owner).addPayee(payee3.address, 5000);
    });

    it("Should reject release for non-payee", async function () {
      const amount = ethers.parseEther("100");
      await owner.sendTransaction({
        to: revenueSplitter.address,
        value: amount,
      });
      await expect(
        revenueSplitter.connect(other).release(other.address)
      ).to.be.revertedWith("Account has no shares");
    });

    it("Should reject double release", async function () {
      const amount = ethers.parseEther("100");
      await owner.sendTransaction({
        to: revenueSplitter.address,
        value: amount,
      });
      await revenueSplitter.connect(payee1).release(payee1.address);
      await expect(
        revenueSplitter.connect(payee1).release(payee1.address)
      ).to.be.revertedWith("Account is not due payment");
    });
  });
});
