const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const weiAmount = await ethers.provider.getBalance(deployer.address);
    const etherAmount = ethers.formatEther(weiAmount);
    console.log("Account balance:", etherAmount);

    const Token = await ethers.getContractFactory("CryptoClash");
    try {
        const token = await Token.deploy();
        console.log("Token object:", token);
        console.log("Token address:", token.target);



    } catch (error) {
        console.error("Deployment failed:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
