import React, {useEffect, useState} from 'react';
import {ethers} from 'ethers';
import {create} from 'ipfs-http-client';
import Navbar from '@/components/Navbar';
import NFTCard from '@/components/NFTCard';
import NFTDetailsModal from '@/components/NFTDetailsModal';
import ABI from '../../public/CryptoClash.sol/CryptoClash.json';
import NFT_ABI from '../../public/CryptoClashCat.sol/CryptoClashCat.json';
import styles from '../styles/Home.module.css';
import {NFT} from '@/interfaces/NFT';
import useWallet from "@/hooks/useWallet";

const client = create({url: 'http://127.0.0.1:5001'});

export default function Home() {
    const {isConnected, userAddress, connectWallet, disconnectWallet, provider} = useWallet()
    const [tokenCount, setTokenCount] = useState("0");
    const [nfts, setNfts] = useState<NFT[]>([]);
    const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
    const [battleNFTs, setBattleNFTs] = useState<{ [key: string]: NFT | null }>({});
    const [opponentNFT, setOpponentNFT] = useState<NFT | null>(null);
    const [attack, setAttack] = useState("");
    const [result, setResult] = useState<string | null>(null);
    const [opponents, setOpponents] = useState<string[]>([]);
    const [battleId, setBattleId] = useState<number | null>(null);
    const [pendingBattles, setPendingBattles] = useState<any[]>([]);
    const [completedBattles, setCompletedBattles] = useState<any[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [topNFTs, setTopNFTs] = useState<NFT[]>([]);


    useEffect(() => {
        if (isConnected) {
            fetchPendingBattles();
            fetchCompletedBattles();
            fetchTokenCount(userAddress);
            fetchTopNFTs().then(setTopNFTs);
        }
    }, [isConnected]);
    useEffect(() => {
        if (pendingBattles.length > 0) {
            pendingBattles.forEach(battle => {
                const player1TokenId = battle.details[2].toString();
                const player2TokenId = battle.details[3].toString();

                // Fetch player 1 NFT details
                if (!battleNFTs[player1TokenId]) {
                    fetchNFTDetails(player1TokenId).then(nft => {
                        setBattleNFTs(prev => ({...prev, [player1TokenId]: nft}));
                    });
                }

                // Fetch player 2 NFT details
                if (!battleNFTs[player2TokenId]) {
                    fetchNFTDetails(player2TokenId).then(nft => {
                        setBattleNFTs(prev => ({...prev, [player2TokenId]: nft}));
                    });
                }
            });
        }
    }, [pendingBattles]);
    useEffect(() => {
        if (pendingBattles.length > 0) {
            const playerBattle = pendingBattles.find(battle =>
                battle.details[0].toLowerCase() === userAddress.toLowerCase() ||
                battle.details[1].toLowerCase() === userAddress.toLowerCase()
            );

            if (playerBattle) {
                const playerTokenId = playerBattle.details[0].toLowerCase() === userAddress.toLowerCase() ? playerBattle.details[2].toString() : playerBattle.details[3].toString();
                const nft = nfts.find(nft => nft.tokenId === playerTokenId);
                setSelectedNFT(nft || null);
            }
        }
    }, [pendingBattles, userAddress, nfts]);


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
                console.log("Attempting to mint NFT...");

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

                console.log("Response from mintNFT API:", response);

                if (response.ok) {
                    const {metadataURIs} = await response.json();
                    for (const uri of metadataURIs) {
                        await contract.safeMint(userAddress, uri, {value: ethers.parseEther("0.05")});
                    }
                    console.log("NFT successfully minted!");
                    fetchUserNFTs();
                } else {
                    const errorText = await response.text();
                    console.error("Failed to mint NFT:", errorText);
                }
            } catch (error) {
                console.error("Error during the NFT minting request:", error);
            }
        } else {
            console.error("Ethereum window object not found or not connected.");
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
                        tokenId: tokenId.toString(),
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
        console.log("Fetched NFTs:", items);
        return items;
    }

    async function fetchUserNFTs() {
        const items = await fetchNFTs(userAddress);
        setNfts(items);
    }

    async function streamToString(stream: any) {
        let content = '';
        for await (const chunk of stream) {
            content += new TextDecoder().decode(chunk, {stream: true});
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
                const filteredOpponents = opponents.filter(opponent => opponent.toLowerCase() !== userAddress.toLowerCase());

                if (filteredOpponents.length === 0) {
                    setResult("No opponents available.");
                    return;
                }

                const randomOpponentAddress = filteredOpponents[Math.floor(Math.random() * filteredOpponents.length)];
                console.log("Opponent Address:", randomOpponentAddress);

                const opponentNFTs = await fetchNFTs(randomOpponentAddress);
                if (opponentNFTs.length === 0) {
                    setResult("No NFTs found for the opponent.");
                    return;
                }

                const randomOpponentNFT = opponentNFTs[Math.floor(Math.random() * opponentNFTs.length)];
                setOpponentNFT(randomOpponentNFT);

                const startTx = await contract.startBattle(selectedNFT.tokenId, randomOpponentNFT.tokenId, attack);
                console.log(`Start Battle Transaction hash: ${startTx.hash}`);
                const receipt = await startTx.wait();
                console.log(`Start Battle confirmed in block ${receipt.blockNumber}`);

                const battleCounter = await contract.getBattleCounter();
                setBattleId(Number(battleCounter));
                console.log("Battle started with ID:", battleCounter);

                setResult(`Your attack has been submitted. Waiting for opponent...`);
                setShowModal(false);
                fetchPendingBattles();
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
                fetchTopNFTs().then(setTopNFTs);
            } catch (error) {
                console.error("Error submitting attack:", error);
            }
        } else {
            alert("Please select an attack.");
        }
    }

    async function fetchPendingBattles() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

        try {
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = latestBlock - 20000;

            const battleStartedFilter = contract.filters.BattleStarted();

            const battles = await contract.queryFilter(battleStartedFilter, fromBlock, "latest");

            console.log("Battles fetched: ", battles);

            const playerBattles = battles.filter((battle: any) => {
                const eventArgs = battle.args;
                return (eventArgs && eventArgs.player1 && eventArgs.player1.toLowerCase() === userAddress.toLowerCase()) ||
                    (eventArgs && eventArgs.player2 && eventArgs.player2.toLowerCase() === userAddress.toLowerCase());
            });

            const detailedBattles = await Promise.all(playerBattles.map(async (battle: any) => {
                const battleId = battle.args.battleId.toString();
                const battleDetails = await contract.getBattle(battleId);

                console.log(`Pending Battle ID: ${battleId}`, battleDetails);

                return {
                    event: battle,
                    details: battleDetails
                };
            }));

            console.log("Detailed Pending Battles: ", detailedBattles);

            const pendingBattles = detailedBattles.filter(battle => battle.details[8] === BigInt(0)); // Utilisation de BigInt constructor

            console.log("Pending Battles: ", pendingBattles);

            setPendingBattles(pendingBattles);

            if (pendingBattles.length > 0) {
                const pendingBattle = pendingBattles[0];
                const battleId = pendingBattle.event.args.battleId.toString();
                setBattleId(battleId);
                setResult("You have a pending battle. Please select your attack.");
            }
        } catch (error) {
            console.error("Error fetching pending battles:", error);
        }
    }

    async function fetchNFTWins(tokenId: string): Promise<number> {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

        try {
            const wins = await contract.getWins(tokenId);
            return wins.toNumber ? wins.toNumber() : parseInt(wins, 10);
        } catch (error) {
            console.error("Error fetching NFT wins:", error);
            return 0;
        }
    }


    async function fetchCompletedBattles() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
        const contract = new ethers.Contract(contractAddress, NFT_ABI.abi, provider);

        try {
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = latestBlock - 20000;

            const battleStartedFilter = contract.filters.BattleStarted();

            const battles = await contract.queryFilter(battleStartedFilter, fromBlock, "latest");

            console.log("Battles fetched: ", battles);

            const playerBattles = battles.filter((battle: any) => {
                const eventArgs = battle.args;
                return (eventArgs && eventArgs.player1 && eventArgs.player1.toLowerCase() === userAddress.toLowerCase()) ||
                    (eventArgs && eventArgs.player2 && eventArgs.player2.toLowerCase() === userAddress.toLowerCase());
            });

            const detailedBattles = await Promise.all(playerBattles.map(async (battle: any) => {
                const battleId = battle.args.battleId.toString();
                const battleDetails = await contract.getBattle(battleId);

                console.log(`Completed Battle ID: ${battleId}`, battleDetails);

                return {
                    event: battle,
                    details: battleDetails
                };
            }));

            console.log("Detailed Completed Battles: ", detailedBattles);

            const completedBattles = detailedBattles.filter(battle => battle.details[8] === BigInt(1)); // Utilisation de BigInt constructor

            console.log("Completed Battles: ", completedBattles);

            setCompletedBattles(completedBattles);
        } catch (error) {
            console.error("Error fetching completed battles:", error);
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

    async function fetchNFTDetails(tokenId: string): Promise<NFT | null> {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);
        try {
            const tokenURI = await tokenContract.tokenURI(tokenId);
            const cid = tokenURI.split('ipfs://')[1];
            const metadataStream = client.cat(cid);
            const metadataString = await streamToString(metadataStream);
            const metadata = JSON.parse(metadataString);

            if (metadata.image) {
                const imageCid = metadata.image.split('ipfs://')[1];
                const imageUrl = `http://127.0.0.1:8080/ipfs/${imageCid}`;

                return {
                    tokenId,
                    image: imageUrl,
                    name: metadata.name,
                    description: metadata.description
                };
            } else {
                console.error("Invalid metadata structure:", metadata);
                return null;
            }
        } catch (error) {
            console.error("Error fetching NFT data from contract:", error);
            return null;
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
                setCompletedBattles(prevCompletedBattles => [...prevCompletedBattles, {
                    ...completedBattle,
                    details: updatedBattle
                }]);
            }
            setPendingBattles(updatedPendingBattles);
        } else {
            console.log(`Battle ID ${battleId} is still pending.`);
        }
    }

    function getBattleWinner(battle: any) {
        if (
            (battle.details[4] === "rock" && battle.details[5] === "scissors") ||
            (battle.details[4] === "scissors" && battle.details[5] === "paper") ||
            (battle.details[4] === "paper" && battle.details[5] === "rock")
        ) {
            return battle.event.args.player1;
        } else if (
            (battle.details[5] === "rock" && battle.details[4] === "scissors") ||
            (battle.details[5] === "scissors" && battle.details[4] === "paper") ||
            (battle.details[5] === "paper" && battle.details[4] === "rock")
        ) {
            return battle.event.args.player2;
        } else {
            return "Draw";
        }
    }

    function truncateAddress(address: string) {
        if (!address) return "";
        const start = address.substring(0, 6);
        const end = address.substring(address.length - 4, address.length);
        return `${start}...${end}`;
    }

    async function fetchTopNFTs(): Promise<NFT[]> {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const nftContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);

        try {
            const totalSupply = await nftContract.totalSupply();
            const nftWins = [];

            for (let i = 1; i <= totalSupply; i++) {
                const wins = await fetchNFTWins(i.toString());
                nftWins.push({ tokenId: i.toString(), wins });
            }

            nftWins.sort((a, b) => b.wins - a.wins);

            const topNFTTokenIds = nftWins.slice(0, 3).map(nft => nft.tokenId);
            const topNFTDetails = (await Promise.all(topNFTTokenIds.map(fetchNFTDetails))).filter(nft => nft !== null) as NFT[];

            return topNFTDetails;
        } catch (error) {
            console.error("Error fetching top NFTs:", error);
            return [];
        }
    }
    async function fetchNFTOwners(tokenIds: string[]): Promise<string[]> {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const nftContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, provider);

        const owners = await Promise.all(tokenIds.map(async (tokenId) => {
            const owner = await nftContract.ownerOf(tokenId);
            console.log(`Owner of tokenId ${tokenId}: ${owner}`);
            return owner;
        }));

        return owners;
    }

    async function approveERC20Spending() {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const erc20Contract = new ethers.Contract(process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS!, ABI.abi, signer);
        const erc721ContractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

        const amount = ethers.parseUnits("1000000", 18); // Ajustez le montant si nécessaire

        try {
            const approvalTx = await erc20Contract.approve(erc721ContractAddress, amount);
            console.log("Approval transaction sent:", approvalTx.hash);

            const receipt = await approvalTx.wait();
            console.log("Approval transaction confirmed:", receipt);
        } catch (error) {
            console.error("Error approving ERC20 spending:", error);
        }
    }

    async function rewardTopNFTs() {
        console.log("Starting rewardTopNFTs function");

        const topNFTs = await fetchTopNFTs();
        console.log("Fetched top NFTs:", topNFTs);

        if (topNFTs.length > 0) {
            const topNFTTokenIds = topNFTs.map(nft => nft.tokenId);
            console.log("Top NFT Token IDs:", topNFTTokenIds);

            const topOwners = await fetchNFTOwners(topNFTTokenIds);
            console.log("Top Owners to Reward: ", topOwners);

            const provider = new ethers.BrowserProvider(window.ethereum);
            console.log("Provider initialized");

            const signer = await provider.getSigner();
            console.log("Signer obtained:", signer);

            const nftContract = new ethers.Contract(process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!, NFT_ABI.abi, signer);
            console.log("NFT Contract initialized:", nftContract);

            const tokenContractAddress = process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS;
            console.log("Token Contract Address:", tokenContractAddress);

            try {
                // Vérifiez que l'appelant est le propriétaire
                const owner = await nftContract.owner();
                console.log("Contract owner:", owner);

                const callerAddress = await signer.getAddress();
                console.log("Caller Address:", callerAddress);

                if (callerAddress.toLowerCase() !== owner.toLowerCase()) {
                    throw new Error("Caller is not the owner");
                }

                console.log("Caller is the owner, proceeding with rewarding top NFTs");

                console.log("Calling rewardTopNFTs with:", topOwners);
                const tx = await nftContract.rewardTopNFTs(topOwners, {
                    gasLimit: 3000000
                });
                console.log("Top NFTs rewarded successfully, transaction:", tx);

                const receipt = await tx.wait();
                console.log("Transaction receipt:", receipt);
            } catch (error: any) {
                console.error("Error rewarding top NFTs:", error);
                if (error.code) {
                    console.error("Error code:", error.code);
                }
                if (error.message) {
                    console.error("Error message:", error.message);
                }
                if (error.data) {
                    console.error("Error data:", error.data);
                }
            }
        } else {
            console.log("No top NFTs to reward");
        }

        console.log("rewardTopNFTs function execution completed");
    }

    return (
        <main className="flex flex-col min-h-screen">
            <Navbar isConnected={isConnected} handleWalletConnection={handleWalletConnection}/>
            <div className="container mx-auto">
                {!isConnected && (
                    <div className="mt-4 text-center">
                        <p className="text-xl font-bold text-white-900">Connect your wallet</p>
                    </div>
                )}
                {userAddress && <p className="text-xl">Number of tokens: {tokenCount} CCH</p>}
                {isConnected && (
                    <div className="mt-4">
                        <div className="relative mb-4">
                            <div className="flex justify-center">
                                <h2 className="text-2xl font-bold border-b-4 border-yellow-500 shadow-lg p-4 rounded-lg">
                                    My NFTs
                                </h2>
                            </div>
                            <div className="absolute right-0 top-0 mt-4 mr-4">
                                <button onClick={mintNft}
                                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                                    Mint NFT
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {nfts.map((nft, index) => (
                                <NFTCard key={index} nft={nft} onClick={() => selectNFT(nft)}
                                         highlight={pendingBattles.some(battle => battle.nft === nft.tokenId)}/>
                            ))}
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-center mb-4">
                                <h2 className="text-2xl font-bold border-b-4 border-yellow-500 shadow-lg p-4 rounded-lg">
                                    Top NFTs
                                </h2>
                            </div>
                            <div className="flex flex-wrap justify-center gap-4">
                                {topNFTs.map((nft, index) => (
                                    <div key={index} className="relative">
                <span className="absolute bottom-0 right-0 bg-yellow-500 text-white font-bold py-2.5 px-2 rounded-br-lg">
                    N°{index + 1}
                </span>
                                        <NFTCard nft={nft} onClick={() => selectNFT(nft)}/>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex justify-center mt-4">
                            <button onClick={rewardTopNFTs}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Reward Top NFTs
                            </button>
                        </div>
                    </div>
                )}
                {selectedNFT && showModal && (
                    <NFTDetailsModal
                        nft={selectedNFT}
                        attack={attack}
                        setAttack={setAttack}
                        startBattle={startBattle}
                        closeModal={() => setShowModal(false)}
                        fetchNFTWins={fetchNFTWins}
                    />
                )}
                {isConnected && pendingBattles.length > 0 && (
                    <div className="mt-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4 border-b-4 border-yellow-500 shadow-lg p-4 rounded-lg inline-block">
                                Pending Battles
                            </h2>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {pendingBattles.map((battle, index) => {
                                const player1TokenId = battle.details[2].toString();
                                const player2TokenId = battle.details[3].toString();

                                const player1NFT = battleNFTs[player1TokenId];
                                const player2NFT = battleNFTs[player2TokenId];

                                const player1AttackImage = (userAddress.toLowerCase() === battle.event.args.player1.toLowerCase() && battle.details[6])
                                    ? `/images/${battle.details[4]}.webp`
                                    : '/images/question_mark.webp';

                                return (
                                    <div key={index}
                                         className="mt-2 p-4 rounded-lg shadow-2xl border-white-800 border-2 relative bg-white bg-opacity-20"
                                         style={{maxWidth: '600px'}}>

                                        <div className="text-center mb-4">
                                            <h2 className="text-4xl font-bold text-gray-900 relative">
                                                Battle n° {battle.event.args.battleId.toString()}
                                                <span
                                                    className="absolute inset-0 text-gray-400 transform translate-x-1 translate-y-0">Battle n° {battle.event.args.battleId.toString()}</span>
                                            </h2>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <p className="font-bold mb-2">Player 1</p>
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={userAddress.toLowerCase() === battle.event.args.player1.toLowerCase() ? styles.highlightNft : ""}>
                                                        {player1NFT && <NFTCard nft={player1NFT} onClick={() => {
                                                        }}
                                                                                highlight={userAddress.toLowerCase() === battle.event.args.player1.toLowerCase()}/>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-center">
                                                <p className="font-bold mb-2">Player 2</p>
                                                <div className="flex flex-col items-center">
                                                    <div
                                                        className={userAddress.toLowerCase() === battle.event.args.player2.toLowerCase() ? styles.highlightNft : ""}>
                                                        {player2NFT && <NFTCard nft={player2NFT} onClick={() => {
                                                        }}
                                                                                highlight={userAddress.toLowerCase() === battle.event.args.player2.toLowerCase()}/>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="text-center mt-1 mx-auto flex items-center justify-center">

                                                <img src={player1AttackImage} alt="Player 1 Attack"
                                                     className={styles.attackImage}/>
                                            </div>
                                            <div className="text-center mx-auto flex items-center justify-center">

                                                {userAddress.toLowerCase() === battle.event.args.player2.toLowerCase() && !battle.details[7] ? (
                                                    <div className={`${styles.attackSelection} flex justify-center space-x-4`}>
                                                        <img src="/images/rock.webp" alt="Rock"
                                                             className={`${styles.attackImage} ${attack === 'rock' ? styles.selected : ''}`}
                                                             onClick={() => setAttack(attack === 'rock' ? '' : 'rock')}/>
                                                        <img src="/images/paper.webp" alt="Paper"
                                                             className={`${styles.attackImage} ${attack === 'paper' ? styles.selected : ''}`}
                                                             onClick={() => setAttack(attack === 'paper' ? '' : 'paper')}/>
                                                        <img src="/images/scissors.webp" alt="Scissors"
                                                             className={`${styles.attackImage} ${attack === 'scissors' ? styles.selected : ''}`}
                                                             onClick={() => setAttack(attack === 'scissors' ? '' : 'scissors')}/>
                                                    </div>
                                                ) : (
                                                    <img src="/images/question_mark.webp" alt="Player 2 Attack"
                                                         className={styles.attackImage}/>
                                                )}

                                            </div>

                                        </div>
                                        {userAddress.toLowerCase() === battle.event.args.player2.toLowerCase() && !battle.details[7] && (
                                            <div className="mt-4 text-center">
                                                <button
                                                    onClick={() => submitAttack(battle.event.args.battleId.toString())}
                                                    className="mt-2 px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-300">
                                                    Submit
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                );
                            })}
                        </div>
                    </div>
                )}

                {isConnected && completedBattles.length > 0 && (
                    <div className="mt-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-4 border-b-4 border-yellow-500 shadow-lg p-4 rounded-lg inline-block">
                                Completed Battles
                            </h2>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200 bg-white bg-opacity-10">

                            <thead className="bg-gray-50 bg-opacity-10">
                            <tr>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Battle
                                    ID
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    1
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    1 NFT
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    2
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    2 NFT
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    1 Attack
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Player
                                    2 Attack
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-white-800 uppercase tracking-wider">Winner
                                    NFT
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white text-center divide-y divide-gray-200 bg-opacity-50">
                            {completedBattles
                                .filter(battle =>
                                    battle.event.args.player1.toLowerCase() === userAddress.toLowerCase() ||
                                    battle.event.args.player2.toLowerCase() === userAddress.toLowerCase()
                                )
                                .map((battle, index) => {
                                    const winner = getBattleWinner(battle);
                                    const isUserWinner = winner.toLowerCase() === userAddress.toLowerCase();
                                    const isDraw = winner === "Draw";
                                    const rowClass = isDraw ? "" : isUserWinner ? "bg-green-100 bg-opacity-70" : "bg-red-100 bg-opacity-70";
                                    const highlightStyle = {
                                        border: '2px solid black',
                                        padding: '2px 4px',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                    };
                                    const winningNFT = isDraw ? "Draw" : winner === battle.event.args.player1 ? battle.details[2].toString() : battle.details[3].toString();

                                    return (
                                        <tr key={index} className={rowClass}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{battle.event.args.battleId.toString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            <span
                                style={battle.event.args.player1.toLowerCase() === userAddress.toLowerCase() ? highlightStyle : {}}>
                                {truncateAddress(battle.event.args.player1)}
                            </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{battle.details[2].toString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            <span
                                style={battle.event.args.player2.toLowerCase() === userAddress.toLowerCase() ? highlightStyle : {}}>
                                {truncateAddress(battle.event.args.player2)}
                            </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{battle.details[3].toString()}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{battle.details[4]}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{battle.details[5]}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{winningNFT}</td>
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

}
