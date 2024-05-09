const { ethers } = require("hardhat");
const CryptoClashCatArtifact = require("../artifacts/contracts/CryptoClashCat.sol/CryptoClashCat.json");

async function main() {
    try {
        const [deployer] = await ethers.getSigners();
        console.log("Deploying contracts with the account:", deployer.address);

        // Utilisation de l'ABI pour déployer le contrat
        const CryptoClashCat = await ethers.getContractFactory(CryptoClashCatArtifact.abi, CryptoClashCatArtifact.bytecode);
        const cryptoClashCat = await CryptoClashCat.deploy();

        console.log("CryptoClashCat deployed to:", cryptoClashCat.target);

        // Appel de la fonction initialize avec une limite de gaz ajustée
        const maxNfts = 1000;
        const tx = await cryptoClashCat.initialize(maxNfts, { gasLimit: 3000000 });
        await tx.wait();

        console.log("Contract initialized with maxNFTs set to:", maxNfts);

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
