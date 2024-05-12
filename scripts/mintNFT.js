require('dotenv').config({ path: '../.env' });
const CryptoClashCatArtifact = require("../artifacts/contracts/CryptoClashCat.sol/CryptoClashCat.json");
const { ethers } = require("ethers");

async function setupIpfsClient() {
    try {
        const ipfsClient = await import('ipfs-http-client');
        return ipfsClient.create({ host: '127.0.0.1', port: 5001, protocol: 'http' });
    } catch (error) {
        console.error("Échec de l'importation de 'ipfs-http-client':", error);
        process.exit(1);
    }
}

const baseImageCID = "Qmaomtuj6aU3oj1osWZ7eRs9nEFta5zHZLGKDsLXGJrWXQ";

async function uploadMetadataAndMint(baseName, description) {
    const ipfs = await setupIpfsClient();
    const metadataURIs = [];

    if (!process.env.CONTRACT_NFT_ADDRESS) {
        console.error("Contract address is not defined");
        return;
    }
    console.log("Contract address:", process.env.CONTRACT_NFT_ADDRESS);

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL_2);

    const cryptoClashCat = new ethers.Contract(process.env.CONTRACT_NFT_ADDRESS, CryptoClashCatArtifact.abi, provider);

    let nextTokenId;
    try {
        nextTokenId = await cryptoClashCat.getNextTokenId();
        console.log("Next Token ID;", nextTokenId);
    } catch (err) {
        console.error("Unable to retrieve the next token ID:", err);
        return;
    }

    const serialNumber = nextTokenId.toString().padStart(4, '0');
    const name = `${baseName} #${serialNumber}`;

    const metadata = {
        name: name,
        description: description,
        image: `ipfs://${baseImageCID}`,
        attributes: [
            { trait_type: "Version", value: "Origin" },
            { trait_type: "Serial Number", value: serialNumber }
        ]
    };

    const buffer = Buffer.from(JSON.stringify(metadata));
    const result = await ipfs.add(buffer);
    const metadataUri = `ipfs://${result.path}`;
    console.log("Metadata URI:", metadataUri);
    metadataURIs.push(metadataUri);

    return metadataURIs;
}

module.exports = { uploadMetadataAndMint };
