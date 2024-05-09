const fs = require('fs');
const { ethers } = require('ethers');

// Configuration du client IPFS
async function setupIpfsClient() {
    try {
        const ipfsClient = await import('ipfs-http-client');
        return ipfsClient.create({ host: '127.0.0.1', port: 5001, protocol: 'http' });
    } catch (error) {
        console.error("Failed to import 'ipfs-http-client':", error);
        process.exit(1);
    }
}

const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractABI = require('artifacts/contracts/CryptoClash.sol/CryptoClash.json');
const contractAddress = '0x52BD45Da05C7915C46811A44CFddc1EDe9e4a227';
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

async function uploadMetadataAndMint(baseName, description, imageUri) {
    const ipfs = await setupIpfsClient();
    for (let i = 1; i <= 500; i++) {
        const name = `${baseName} #${i}`;
        const metadata = { name, description, image: imageUri };
        const buffer = Buffer.from(JSON.stringify(metadata));
        const result = await ipfs.add(buffer);
        const metadataUri = `ipfs://${result.path}`;

        const tx = await contract.mintNFT(metadataUri); // Appel de la fonction mintNFT du contrat
        await tx.wait();
        console.log(`Minted NFT ${name} with metadata URI: ${metadataUri}`);
    }
}

async function main() {
    await uploadMetadataAndMint("Unique Cat", "A unique digital cat", "ipfs://path_to_your_cat_image_CID");
}

main().catch(console.error);
