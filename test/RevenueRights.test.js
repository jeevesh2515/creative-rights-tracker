const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RevenueRights", function () {
  let revenueRights;
  let owner, creator, artist, beneficiary, addr1;

  beforeEach(async function () {
    [owner, creator, artist, beneficiary, addr1] = await ethers.getSigners();

    const RevenueRights = await ethers.getContractFactory("RevenueRights");
    revenueRights = await RevenueRights.deploy(
      [creator.address, artist.address, beneficiary.address],
      ["Creator", "Artist", "Beneficiary"],
      ["creator", "artist", "beneficiary"],
      [5000, 3000, 2000]
    );
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(revenueRights.address).to.not.equal(0);
    });

    it("Should set correct owner", async function () {
      expect(await revenueRights.owner()).to.equal(owner.address);
    });

    it("Should initialize rights holders correctly", async function () {
      const holders = await revenueRights.getRightsHolders();
      expect(holders.length).to.equal(3);
      expect(holders[0].name).to.equal("Creator");
      expect(holders[0].basisPoints).to.equal(5000);
    });

    it("Should reject mismatched array lengths", async function () {
      const RevenueRights = await ethers.getContractFactory("RevenueRights");
      await expect(
        RevenueRights.deploy(
          [creator.address, artist.address],
          ["Creator"],
          ["creator", "artist"],
          [5000, 5000]
        )
      ).to.be.revertedWith("Array length mismatch");
    });

    it("Should reject basis points that don't sum to 10000", async function () {
      const RevenueRights = await ethers.getContractFactory("RevenueRights");
      await expect(
        RevenueRights.deploy(
          [creator.address, artist.address],
          ["Creator", "Artist"],
          ["creator", "artist"],
          [5000, 4000]
        )
      ).to.be.revertedWith("Basis points must sum to 10000");
    });
  });

  describe("Revenue Distribution", function () {
    it("Should emit HolderPaid event", async function () {
      const amount = ethers.parseEther("100");
      const tx = await revenueRights.connect(owner).distributeRevenue({ value: amount });
      await expect(tx).to.emit(revenueRights, "HolderPaid");
    });

    it("Should emit RevenueDistributed event", async function () {
      const amount = ethers.parseEther("100");
      const tx = await revenueRights.connect(owner).distributeRevenue({ value: amount });
      await expect(tx).to.emit(revenueRights, "RevenueDistributed");
    });

    it("Should track total distributed", async function () {
      const amount1 = ethers.parseEther("50");
      await revenueRights.connect(owner).distributeRevenue({ value: amount1 });
      const total = await revenueRights.getTotalDistributed();
      expect(total).to.equal(amount1);
    });

    it("Should reject distribution with 0 value", async function () {
      await expect(
        revenueRights.connect(owner).distributeRevenue({ value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });

    it("Should reject distribution if not owner", async function () {
      const amount = ethers.parseEther("100");
      await expect(
        revenueRights.connect(addr1).distributeRevenue({ value: amount })
      ).to.be.revertedWith("Not owner");
    });
  });

  describe("View Functions", function () {
    it("Should return total distributed", async function () {
      const amount = ethers.parseEther("50");
      await revenueRights.connect(owner).distributeRevenue({ value: amount });
      const total = await revenueRights.getTotalDistributed();
      expect(total).to.equal(amount);
    });

    it("Should return rights holders list", async function () {
      const holders = await revenueRights.getRightsHolders();
      expect(holders.length).to.equal(3);
      expect(holders[0].wallet).to.equal(creator.address);
      expect(holders[0].name).to.equal("Creator");
    });
  });
});
