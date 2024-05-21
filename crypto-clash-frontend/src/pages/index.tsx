import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { create } from 'ipfs-http-client';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import Battle from '@/components/Battle';
import NFTDetailsModal from '@/components/NFTDetailsModal';
import ABI from '../../public/CryptoClash.sol/CryptoClash.json';
import NFT_ABI from '../../public/CryptoClashCat.sol/CryptoClashCat.json';

interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

const client = create({ url: 'http://127.0.0.1:5001' });

export default function Home() {
    const [tokenCount, setTokenCount] = useState("0");
    const [userAddress, setUserAddress] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [opponentNFT, setOpponentNFT] = useState<NFT | null>(null);
    const [opponentNFTs, setOpponentNFTs] = useState<NFT[]>([]);
    const [attack, setAttack] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [opponents, setOpponents] = useState<string[]>([]);
    const [battleId, setBattleId] = useState<number | null>(null);
    const [pendingBattles, setPendingBattles] = useState<any[]>([]);
    const [completedBattles, setCompletedBattles] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (isConnected) {
            checkForPendingBattle();
        }
    }, [isConnected]);

    useEffect(() => {
        fetchAllHolders();
    }, []);

    useEffect(() => {
        if (userAddress) {
            fetchUserNFTs();
        }
    }, [userAddress]);

    useEffect(() => {
        updateBattleStatus();
    }, []);

// Log pending and completed battles
    useEffect(() => {
        console.log("Pending Battles:", pendingBattles);
        console.log("Completed Battles:", completedBattles);
    }, [pendingBattles, completedBattles]);
    async function fetchAllHolders() {
        const provider = new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_URL_2!);
        const nftContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);

        try {
            const events = await nftContract.queryFilter("Transfer", 0, "latest");

            const addresses = events.map(event => {
                const eventArgs = (event as ethers.EventLog).args;
                if (eventArgs && eventArgs.length >= 2) {
                    return eventArgs[1];
                }
                return null;
            }).filter(address => address !== null);

            const uniqueAddresses = addresses.filter((address, index) => addresses.indexOf(address) === index);
            setOpponents(uniqueAddresses as string[]);
        } catch (error) {
            console.error("Error fetching NFT holders:", error);
        }
    }

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
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                setUserAddress(accounts[0]);
                fetchTokenCount(accounts[0]);
                setIsConnected(true);
                checkForPendingBattle();
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
        const provider = new ethers.BrowserProvider(window.ethereum);
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
                    body: JSON.stringify({ userAddress })
                });

                if (response.ok) {
                    const { metadataURIs } = await response.json();
                    for (const uri of metadataURIs) {
                        await contract.safeMint(userAddress, uri, { value: ethers.parseEther("0.05") });
                    }
                    console.log("NFT successfully minted!");
                    fetchUserNFTs();
                } else {
                    console.error("Failed to mint NFT:", await response.text());
                }
            } catch (error) {
                console.error("Error during the NFT minting request:", error);
            }
        }
    }

    async function fetchNFTs(address: string): Promise<NFT[]> {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);

        const balance = await tokenContract.balanceOf(address);
        const items: NFT[] = [];

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

        return items;
    }

    async function fetchUserNFTs() {
        const items = await fetchNFTs(userAddress);
        setNfts(items);
    }

    async function fetchOpponentNFTs(opponentAddress: string) {
        const items = await fetchNFTs(opponentAddress);
        setOpponentNFTs(items);
    }

    async function streamToString(stream: any) {
        let content = '';
        for await (const chunk of stream) {
            content += new TextDecoder().decode(chunk, { stream: true });
        }
        return content + new TextDecoder().decode();
    }

    function selectNFT(nft: NFT) {
        setSelectedNFT(nft);
        setShowModal(true);
        setResult(null);
    }

    async function startBattle() {
        if (selectedNFT && attack && opponents.length > 0) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, signer);

            try {
                // Filtrer les adversaires pour exclure l'adresse de l'utilisateur actuel
                const filteredOpponents = opponents.filter(opponent => opponent.toLowerCase() !== userAddress.toLowerCase());

                if (filteredOpponents.length === 0) {
                    setResult("No opponents available.");
                    return;
                }

                const randomOpponentAddress = filteredOpponents[Math.floor(Math.random() * filteredOpponents.length)];
                console.log("Opponent Address:", randomOpponentAddress);

                await fetchOpponentNFTs(randomOpponentAddress);
                if (opponentNFTs.length === 0) {
                    setResult("No NFTs found for the opponent.");
                    return;
                }

                const randomOpponentNFT = opponentNFTs[Math.floor(Math.random() * opponentNFTs.length)];
                setOpponentNFT(randomOpponentNFT);

                await contract.startBattle(selectedNFT.tokenId, randomOpponentNFT.tokenId);
                const battleCounter = await contract.getBattleCounter();
                setBattleId(Number(battleCounter));
                console.log("Battle started with ID:", battleCounter);

                await contract.submitAttack(battleCounter, selectedNFT.tokenId, attack);
                setResult(`Your attack has been submitted. Waiting for opponent...`);
                setShowModal(false);  // Close the modal after starting the battle
            } catch (error) {
                console.error("Error during the battle:", error);
            }
        } else {
            alert("Please select an NFT, choose an attack, and ensure an opponent is available.");
        }
    }

    async function submitAttack(battleId: number) {
        if (selectedNFT && attack) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, signer);

            try {
                console.log(`Submitting attack for battle ID: ${battleId}, Token ID: ${selectedNFT.tokenId}, Attack: ${attack}`);
                const tx = await contract.submitAttack(battleId, selectedNFT.tokenId, attack);
                console.log(`Transaction hash: ${tx.hash}`);

                const receipt = await tx.wait();
                console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

                setResult(`Your attack has been submitted.`);
                console.log("Attack submitted for battle ID:", battleId);

                const updatedBattle = await contract.getBattle(battleId);
                console.log("Updated battle details after submission:", updatedBattle);

                updateBattleLists(battleId, updatedBattle);
            } catch (error) {
                console.error("Error submitting attack:", error);
            }
        } else {
            alert("Please select an NFT and choose an attack.");
        }
    }




    async function checkBattleStatus(battleId: number) {
        if (battleId) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

            try {
                const battle = await contract.getBattle(battleId);
                console.log("Checking status for battle ID:", battleId, "Battle details:", battle);

                if (battle.player1Played && battle.player2Played) {
                    let wins = 0;
                    if (selectedNFT) {
                        wins = await contract.getWins(selectedNFT.tokenId);
                    }
                    setResult(`Your NFT has won ${wins} times!`);
                    setBattleId(null);
                    updateBattleLists(battleId, battle);
                } else {
                    setResult("Waiting for opponent to play...");
                }
            } catch (error) {
                console.error("Error checking battle status:", error);
            }
        } else {
            setResult("No battle in progress or NFT not selected.");
        }
    }

    async function checkForPendingBattle() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

        try {
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = latestBlock - 20000;

            const battleStartedFilter = contract.filters.BattleStarted();
            const attackSubmittedFilter = contract.filters.AttackSubmitted();

            const [battles, attacks] = await Promise.all([
                contract.queryFilter(battleStartedFilter, fromBlock, "latest"),
                contract.queryFilter(attackSubmittedFilter, fromBlock, "latest"),
            ]);

            const playerBattles = battles.filter((battle: any) => {
                const eventArgs = battle.args;
                return (eventArgs && eventArgs.player1 && eventArgs.player1.toLowerCase() === userAddress.toLowerCase()) ||
                    (eventArgs && eventArgs.player2 && eventArgs.player2.toLowerCase() === userAddress.toLowerCase());
            });

            const detailedBattles = await Promise.all(playerBattles.map(async (battle: any) => {
                const battleId = battle.args.battleId.toString();
                const battleDetails = await contract.getBattle(battleId);

                const mutableBattleDetails = Object.assign({}, battleDetails);

                attacks.forEach((attack: any) => {
                    if (attack.args.battleId.toString() === battleId) {
                        if (attack.args.player1 && attack.args.player1.toLowerCase() === battle.args.player1.toLowerCase()) {
                            mutableBattleDetails.attack1 = attack.args.attack;
                        } else if (attack.args.player2 && attack.args.player2.toLowerCase() === battle.args.player2.toLowerCase()) {
                            mutableBattleDetails.attack2 = attack.args.attack;
                        }
                    }
                });

                const nft = (battle.args.player1.toLowerCase() === userAddress.toLowerCase()) ? battle.args.tokenId1 : battle.args.tokenId2;
                console.log(`Battle ID: ${battleId}, NFT in battle: ${nft}`);

                return {
                    event: battle,
                    details: mutableBattleDetails,
                    nft
                };
            }));

            const pendingBattles = detailedBattles.filter(battle => !battle.details.player1Played || !battle.details.player2Played);
            const completedBattles = detailedBattles.filter(battle => battle.details.player1Played && battle.details.player2Played);

            setPendingBattles(pendingBattles);
            setCompletedBattles(completedBattles);

            if (pendingBattles.length > 0) {
                const pendingBattle = pendingBattles[0];
                const battleId = pendingBattle.event.args.battleId.toString();
                setBattleId(battleId);
                setResult("You have a pending battle. Please select your attack.");
            }
        } catch (error) {
            console.error("Error checking for pending battles:", error);
        }
    }
    async function updateBattleStatus() {
        if (battleId) {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
            const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

            try {
                const battle = await contract.getBattle(battleId);
                console.log("Checking status for battle ID:", battleId, "Battle details:", battle);

                if (battle.player1Played && battle.player2Played) {
                    let wins = 0;
                    if (selectedNFT) {
                        wins = await contract.getWins(selectedNFT.tokenId);
                    }
                    setResult(`Your NFT has won ${wins} times!`);
                    setBattleId(null);
                    updateBattleLists(battleId, battle);
                } else {
                    setResult("Waiting for opponent to play...");
                }
            } catch (error) {
                console.error("Error checking battle status:", error);
            }
        } else {
            setResult("No battle in progress or NFT not selected.");
        }
    }


    function updateBattleLists(battleId: number, updatedBattle: any) {
        const isCompleted = updatedBattle.player1Played && updatedBattle.player2Played;
        console.log(`Updating battle lists for Battle ID: ${battleId}, Is Completed: ${isCompleted}`);

        if (isCompleted) {
            console.log(`Battle ID ${battleId} is completed.`);
            const updatedPendingBattles = pendingBattles.filter(battle => battle.event.args.battleId.toString() !== battleId.toString());
            const completedBattle = pendingBattles.find(battle => battle.event.args.battleId.toString() === battleId.toString());
            if (completedBattle) {
                console.log(`Moving Battle ID ${battleId} to completed battles.`);
                setCompletedBattles(prevCompletedBattles => [...prevCompletedBattles, { ...completedBattle, details: updatedBattle }]);
            }
            setPendingBattles(updatedPendingBattles);
        } else {
            console.log(`Battle ID ${battleId} is still pending.`);
        }
    }

    return (
        <main className="flex flex-col min-h-screen">
            <Navbar isConnected={isConnected} handleWalletConnection={handleWalletConnection} />
            <div className="container mx-auto">
                {userAddress && <p className="text-xl">Number of tokens: {tokenCount} CCH</p>}
                {isConnected && (
                    <button onClick={mintNft}
                            className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                        Mint NFT
                    </button>
                )}
                <div className="grid grid-cols-3 gap-4 mt-4" style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {nfts.map((nft, index) => (
                        <NFTCard key={index} nft={nft} onClick={() => selectNFT(nft)} highlight={pendingBattles.some(battle => battle.nft === nft.tokenId)} />
                    ))}
                </div>
                {selectedNFT && showModal && (
                    <NFTDetailsModal
                        nft={selectedNFT}
                        attack={attack}
                        setAttack={setAttack}
                        startBattle={startBattle}
                        closeModal={() => setShowModal(false)}
                    />
                )}
                {selectedNFT && opponentNFT && (
                    <div className="flex justify-between mt-8">
                        <NFTCard nft={selectedNFT} onClick={() => { }} />
                        <NFTCard nft={opponentNFT} onClick={() => { }} />
                    </div>
                )}

                {battleId && (
                    <button onClick={() => checkBattleStatus(battleId)} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Check Battle Status
                    </button>
                )}
                {pendingBattles.length > 0 && (
                    <div className="mt-4">
                        <h2>Pending Battles</h2>
                        {pendingBattles.map((battle, index) => (
                            <div key={index} className="mt-2">
                                <p>Battle ID: {battle.event.args.battleId.toString()}</p>
                                <p>Player 1: {battle.event.args.player1}</p>
                                <p>Player 2: {battle.event.args.player2}</p>
                                <p>Player 1 Played: {battle.details[6].toString()}</p>
                                <p>Player 2 Played: {battle.details[7].toString()}</p>
                                <p>Player 1 Attack: {battle.details[4] || 'N/A'}</p>
                                <p>Player 2 Attack: {battle.details[5] || 'N/A'}</p>
                                {userAddress.toLowerCase() === battle.event.args.player2.toLowerCase() && !battle.details.player2Played && (
                                    <button onClick={() => submitAttack(battle.event.args.battleId.toString())}
                                            className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                                        Submit Attack
                                    </button>
                                )}
                                {userAddress.toLowerCase() === battle.event.args.player2.toLowerCase() && battle.details.player2Played && (
                                    <p>Your attack: {battle.details.attack2}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                {completedBattles.length > 0 && (
                    <div className="mt-4">
                        <h2 className="text-2xl font-bold mb-4">Completed Battles</h2>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Battle ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 1 Attack</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player 2 Attack</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {completedBattles.map((battle, index) => {
                                const winner = getBattleWinner(battle);
                                return (
                                    <tr key={index} className={winner === "Draw" ? "" : winner === battle.event.args.player1 ? "bg-green-100" : "bg-red-100"}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{battle.event.args.battleId.toString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battle.event.args.player1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battle.event.args.player2}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battle.details.attack1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{battle.details.attack2}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{winner}</td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );

    function getBattleWinner(battle: any) {
        if (
            (battle.details.attack1 === "rock" && battle.details.attack2 === "scissors") ||
            (battle.details.attack1 === "scissors" && battle.details.attack2 === "paper") ||
            (battle.details.attack1 === "paper" && battle.details.attack2 === "rock")
        ) {
            return battle.event.args.player1;
        } else if (
            (battle.details.attack2 === "rock" && battle.details.attack1 === "scissors") ||
            (battle.details.attack2 === "scissors" && battle.details.attack1 === "paper") ||
            (battle.details.attack2 === "paper" && battle.details.attack1 === "rock")
        ) {
            return battle.event.args.player2;
        } else {
            return "Draw";
        }
    }
}
