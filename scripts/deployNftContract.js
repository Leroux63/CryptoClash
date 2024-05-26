const { ethers } = require("hardhat");
const CryptoClashCatArtifact = require("../artifacts/contracts/CryptoClashCat.sol/CryptoClashCat.json");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);


        const cryptoClashTokenAddress = process.env.TOKEN_CONTRACT_ADDRESS;
        if (!cryptoClashTokenAddress) {
            throw new Error("TOKEN_CONTRACT_ADDRESS is not set in the .env file");
        }


        const CryptoClashCat = await ethers.getContractFactory(CryptoClashCatArtifact.abi, CryptoClashCatArtifact.bytecode);
        const cryptoClashCat = await CryptoClashCat.deploy();

        console.log("CryptoClashCat deployed to:", cryptoClashCat.target);


        const maxNfts = 1000;
        const tx = await cryptoClashCat.initialize(maxNfts, { gasLimit: 3000000 });
        await tx.wait();
        console.log("Contract initialized with maxNFTs set to:", maxNfts);


        const setTokenTx = await cryptoClashCat.setCryptoClashToken(cryptoClashTokenAddress);
        await setTokenTx.wait();
        console.log("Set ERC20 token address in the ERC721 contract.");


        const cryptoClash = new ethers.Contract(cryptoClashTokenAddress, [
            "function approve(address spender, uint256 amount) public returns (bool)",
        ], deployer);

        const approvalAmount = ethers.parseUnits('1000000', 18); // Ajustez le montant si nécessaire
        const approvalTx = await cryptoClash.approve(cryptoClashCat.target, approvalAmount);
        await approvalTx.wait();
        console.log("Approved CryptoClashCat contract to spend tokens on behalf of deployer");

        const firstPlaceReward = await cryptoClashCat.firstPlaceReward();
        const secondPlaceReward = await cryptoClashCat.secondPlaceReward();
        const thirdPlaceReward = await cryptoClashCat.thirdPlaceReward();

        console.log("First place reward:", ethers.formatUnits(firstPlaceReward, 18));
        console.log("Second place reward:", ethers.formatUnits(secondPlaceReward, 18));
        console.log("Third place reward:", ethers.formatUnits(thirdPlaceReward, 18));

    } catch (error) {
        console.error("Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
