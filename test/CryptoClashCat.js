const { expect } = require("chai");
const { ethers} = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
describe("CryptoClashCat", function () {
    async function deployCryptoClashCatFixture() {
        const [owner, otherAccount, player1, player2] = await ethers.getSigners();

        const CryptoClashCat = await ethers.getContractFactory("CryptoClashCat");
        const cryptoClashCat = await CryptoClashCat.deploy();
        await cryptoClashCat.initialize(100);

        return { cryptoClashCat, owner, otherAccount, player1, player2 };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { cryptoClashCat, owner } = await loadFixture(deployCryptoClashCatFixture);
            expect(await cryptoClashCat.owner()).to.equal(owner.address);
        });
    });

    describe("Minting", function () {
        it("Should mint a new NFT", async function () {
            const { cryptoClashCat, player1 } = await loadFixture(deployCryptoClashCatFixture);

            await cryptoClashCat.connect(player1).safeMint(player1.address, "ipfs://tokenURI", { value: ethers.parseEther("0.05") });
            expect(await cryptoClashCat.ownerOf(1)).to.equal(player1.address);
        });

        it("Should fail to mint more than maxNFTs", async function () {
            const { cryptoClashCat, player1 } = await loadFixture(deployCryptoClashCatFixture);

            for (let i = 0; i < 100; i++) {
                await cryptoClashCat.connect(player1).safeMint(player1.address, `ipfs://tokenURI${i}`, { value: ethers.parseEther("0.05") });
            }

            await expect(cryptoClashCat.connect(player1).safeMint(player1.address, "ipfs://tokenURI101", { value: ethers.parseEther("0.05") }))
                .to.be.revertedWith("Maximum number of NFTs minted");
        });
    });

    describe("Battles", function () {
        it("Should start a battle", async function () {
            const { cryptoClashCat, player1, player2 } = await loadFixture(deployCryptoClashCatFixture);

            await cryptoClashCat.connect(player1).safeMint(player1.address, "ipfs://tokenURI1", { value: ethers.parseEther("0.05") });
            await cryptoClashCat.connect(player2).safeMint(player2.address, "ipfs://tokenURI2", { value: ethers.parseEther("0.05") });

            await cryptoClashCat.connect(player1).chooseAttack(1, "rock");
            await cryptoClashCat.connect(player1).startBattle(1, 2, "rock");

            const battle = await cryptoClashCat.getBattle(1);
            expect(battle.player1).to.equal(player1.address);
            expect(battle.player2).to.equal(player2.address);
            expect(battle.tokenId1).to.equal(1);
            expect(battle.tokenId2).to.equal(2);
            expect(battle.attack1).to.equal("rock");
            expect(battle.status).to.equal(0); // Pending
        });

        it("Should submit an attack and resolve battle", async function () {
            const { cryptoClashCat, player1, player2 } = await loadFixture(deployCryptoClashCatFixture);

            await cryptoClashCat.connect(player1).safeMint(player1.address, "ipfs://tokenURI1", { value: ethers.parseEther("0.05") });
            await cryptoClashCat.connect(player2).safeMint(player2.address, "ipfs://tokenURI2", { value: ethers.parseEther("0.05") });

            await cryptoClashCat.connect(player1).chooseAttack(1, "rock");
            await cryptoClashCat.connect(player1).startBattle(1, 2, "rock");
            await cryptoClashCat.connect(player2).submitAttack(1, 2, "scissors");

            const battle = await cryptoClashCat.getBattle(1);
            expect(battle.status).to.equal(1); // Completed

            const winnerToken = await cryptoClashCat.getWins(1);
            expect(winnerToken).to.equal(1);
        });
    });
});
