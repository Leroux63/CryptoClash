const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
describe("CryptoClash", function () {
    async function deployCryptoClashFixture() {
        const [owner, otherAccount] = await ethers.getSigners();

        const CryptoClash = await ethers.getContractFactory("CryptoClash");
        const cryptoClash = await CryptoClash.deploy();

        return { cryptoClash, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { cryptoClash, owner } = await loadFixture(deployCryptoClashFixture);
            expect(await cryptoClash.owner()).to.equal(owner.address);
        });

        it("Should have correct initial supply", async function () {
            const { cryptoClash, owner } = await loadFixture(deployCryptoClashFixture);
            const ownerBalance = await cryptoClash.balanceOf(owner.address);
            expect(ownerBalance).to.equal(ethers.parseUnits("1000000", 18));
        });
    });

    describe("Minting", function () {
        it("Should mint new tokens by owner", async function () {
            const { cryptoClash, owner, otherAccount } = await loadFixture(deployCryptoClashFixture);
            await cryptoClash.mint(otherAccount.address, ethers.parseUnits("1000", 18));
            const otherBalance = await cryptoClash.balanceOf(otherAccount.address);
            expect(otherBalance).to.equal(ethers.parseUnits("1000", 18));
        });

        it("Should fail to mint tokens by non-owner", async function () {
            const { cryptoClash, otherAccount } = await loadFixture(deployCryptoClashFixture);
            await expect(cryptoClash.connect(otherAccount).mint(otherAccount.address, ethers.parseUnits("1000", 18)))
                .to.be.revertedWith("Caller is not the owner");
        });
    });

    describe("Approvals", function () {
        it("Should approve spending by owner", async function () {
            const { cryptoClash, owner, otherAccount } = await loadFixture(deployCryptoClashFixture);
            await cryptoClash.approveSpending(otherAccount.address, ethers.parseUnits("500", 18));
            const allowance = await cryptoClash.allowance(owner.address, otherAccount.address);
            expect(allowance).to.equal(ethers.parseUnits("500", 18));
        });

        it("Should fail to approve spending by non-owner", async function () {
            const { cryptoClash, owner, otherAccount } = await loadFixture(deployCryptoClashFixture);
            await expect(cryptoClash.connect(otherAccount).approveSpending(owner.address, ethers.parseUnits("500", 18)))
                .to.be.revertedWith("Caller is not the owner");
        });
    });
});
