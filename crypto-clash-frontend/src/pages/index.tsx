import {useState} from "react";
import {ethers} from "ethers";
import ABI from '../../public/CryptoClash.sol/CryptoClash.json';
import NFT_ABI from '../../public/CryptoClashCat.sol/CryptoClashCat.json';


export default function Home() {
    const [tokenCount, setTokenCount] = useState("0");
    const [userAddress, setUserAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);

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
        </main>
    );
}
