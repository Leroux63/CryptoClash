import {useState} from "react";
import {ethers} from "ethers";
import ABI from '../../public/CryptoClash.sol/CryptoClash.json';
import NFT_ABI from '../../public/CryptoClashCat.sol/CryptoClashCat.json';
import { create } from 'ipfs-http-client';



interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}
export default function Home() {
    const [tokenCount, setTokenCount] = useState("0");
    const [userAddress, setUserAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [nfts, setNfts] = useState<NFT[]>([]);
    console.log(nfts);
    async function handleWalletConnection() {
        if (!isConnected) {
            connectWallet();
        } else {
            disconnectWallet();
        }
    }

    async function connectWallet() {
        if (window.ethereum) {
            try {
                const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
                setUserAddress(accounts[0]);
                fetchTokenCount(accounts[0]);
                setIsConnected(true); // Mettre à jour l'état de connexion
                fetchNFTs(accounts[0]); // Récupère les NFTs juste après la connexion
            } catch (error) {
                console.error("Error connecting to the wallet:", error);
            }
        } else {
            alert("Please install a compatible wallet.");
        }
    }


    function disconnectWallet() {
        setUserAddress("");
        setTokenCount("0");
        setIsConnected(false);
    }

    async function fetchTokenCount(address: string) {
        const ethereum = window.ethereum;
        const provider = new ethers.BrowserProvider(ethereum);
        const tokenContract = new ethers.Contract(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS!, ABI.abi, provider);
        try {
            const count = await tokenContract.balanceOf(address);
            const formattedCount = ethers.formatUnits(count, 18);
            console.log(`Number of tokens for the address ${address}: ${formattedCount}`);
            setTokenCount(formattedCount);
        } catch (error) {
            console.error("Error fetching the number of tokens:", error);
        }
    }

    async function mintNft() {
        if (window.ethereum && isConnected && userAddress) {
            try {
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = provider.getSigner();
                const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
                const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, await signer);

                const response = await fetch("/api/mintNFT", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({userAddress})
                });

                if (response.ok) {
                    const {metadataURIs} = await response.json();
                    for (const uri of metadataURIs) {
                        await contract.safeMint(userAddress, uri, {value: ethers.parseEther("0.05")});
                    }
                    console.log("NFT successfully minted!");
                } else {
                    console.error("Failed to mint NFT:", await response.text());
                }
            } catch (error) {
                console.error("Error during the NFT minting request:", error);
            }
        }
    }

    async function fetchNFTs(address: string) {
        const client = create({ url: 'http://127.0.0.1:5001' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);

        const balance = await tokenContract.balanceOf(address);
        const items = [];

        for (let i = 0; i < balance; i++) {
            const tokenId = await tokenContract.tokenOfOwnerByIndex(address, i);
            const tokenURI = await tokenContract.tokenURI(tokenId);
            const cid = tokenURI.split('ipfs://')[1];

            try {
                const metadataStream = client.cat(cid);
                const metadataString = await streamToString(metadataStream);
                const metadata = JSON.parse(metadataString);

                if (metadata.image) {
                    const imageCid = metadata.image.split('ipfs://')[1];
                    const imageUrl = `http://127.0.0.1:8080/ipfs/${imageCid}`;

                    items.push({
                        tokenId,
                        image: imageUrl,
                        name: metadata.name,
                        description: metadata.description
                    });
                } else {
                    console.error("Invalid metadata structure:", metadata);
                }
            } catch (error) {
                console.error("Error fetching NFT data from IPFS:", error);
            }
        }

        setNfts(items);
    }

// Helper function to convert AsyncIterable<Uint8Array> to string
    async function streamToString(stream: any) {
        let content = '';
        for await (const chunk of stream) {
            content += new TextDecoder().decode(chunk, { stream: true });
        }
        return content + new TextDecoder().decode(); // Ensure final flush of the stream
    }


    async function streamToArrayBuffer(stream: any) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        return new Uint8Array(chunks.flat()).buffer;
    }

    // async function fetchNFTs(address: string) {
    //     const ethereum = window.ethereum;
    //     const provider = new ethers.BrowserProvider(ethereum);
    //     const tokenContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
    //     const tokenContract = new ethers.Contract(tokenContractAddress, NFT_ABI.abi, provider);
    //     const balance = await tokenContract.balanceOf(address);
    //
    //     const items = [];
    //     for (let i = 0; i < balance; i++) {
    //         const tokenId = await tokenContract.tokenOfOwnerByIndex(address, i);
    //         const tokenURI = await tokenContract.tokenURI(tokenId);
    //         const url = `https://ipfs.io/ipfs/${tokenURI.split('ipfs://')[1]}`;
    //
    //
    //         try {
    //             const response = await fetch(url, { mode: 'no-cors' });
    //             // Utilisation de la réponse ici
    //             // Notez que vous ne pourrez pas lire la réponse si le mode est 'no-cors'
    //         } catch (error) {
    //             console.error("Error fetching NFT data from IPFS:", error);
    //         }
    //     }
    // }



    return (
        <main className="flex flex-col items-center justify-center min-h-screen p-4">
            <h1 className="text-2xl font-bold">Welcome to Crypto Clash</h1>
            <button onClick={handleWalletConnection}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
            </button>
            {userAddress && <p className="text-xl">Number of tokens: {tokenCount}</p>}
            {isConnected && (
                <button onClick={mintNft} className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                    Mint NFT
                </button>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4">
                {nfts.map((nft, index) => (
                    <div key={index} className="card bg-white p-4 rounded shadow">
                        <img src={nft.image} alt={nft.name} className="rounded mb-2"/>
                        <div className="font-bold">{nft.name}</div>
                        <p>{nft.description}</p>
                    </div>
                ))}
            </div>
        </main>
    );
}
