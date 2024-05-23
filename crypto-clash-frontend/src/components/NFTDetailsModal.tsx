import React, { useState, useEffect } from 'react';
import NFTCard from './NFTCard';
import styles from '../styles/Modal.module.css';

interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

interface NFTDetailsModalProps {
    nft: NFT;
    attack: string;
    setAttack: (attack: string) => void;
    startBattle: () => void;
    closeModal: () => void;
    fetchNFTWins: (tokenId: string) => Promise<number>;
}

const NFTDetailsModal: React.FC<NFTDetailsModalProps> = ({ nft, attack, setAttack, startBattle, closeModal, fetchNFTWins }) => {
    const [wins, setWins] = useState<number>(0);
    const [selectedAttack, setSelectedAttack] = useState<string>("");

    useEffect(() => {
        async function getWins() {
            const wins = await fetchNFTWins(nft.tokenId);
            setWins(wins);
        }

        getWins();
    }, [nft.tokenId, fetchNFTWins]);

    const handleAttackSelection = (attack: string) => {
        setSelectedAttack(attack);
        setAttack(attack);
    };

    const handleStartBattle = () => {
        if (!selectedAttack) {
            alert("Please select an attack before starting the battle.");
            return;
        }
        startBattle();
    };

    return (
        <div className={styles.modalOverlay} onClick={closeModal}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>NFT Details</h2>
                    <button className={styles.closeButton} onClick={closeModal}>×</button>
                </div>
                <div className={styles.centeredContent}>
                    <NFTCard nft={nft} onClick={() => {}} />
                </div>
                <div className={styles.nftAttributes}>
                    <p><strong>Name:</strong> {nft.name}</p>
                    <p><strong>Description:</strong> {nft.description}</p>
                    <p><strong>Wins:</strong> <span className={styles.winsBadge}>{wins}</span></p>
                </div>
                <div className={styles.attackSelection}>
                    <img
                        src="/images/rock.webp"
                        alt="Rock"
                        className={`${styles.attackImage} ${selectedAttack === 'rock' ? styles.selected : ''}`}
                        onClick={() => handleAttackSelection('rock')}
                    />
                    <img
                        src="/images/paper.webp"
                        alt="Paper"
                        className={`${styles.attackImage} ${selectedAttack === 'paper' ? styles.selected : ''}`}
                        onClick={() => handleAttackSelection('paper')}
                    />
                    <img
                        src="/images/scissors.webp"
                        alt="Scissors"
                        className={`${styles.attackImage} ${selectedAttack === 'scissors' ? styles.selected : ''}`}
                        onClick={() => handleAttackSelection('scissors')}
                    />
                </div>
                <div className={styles.centeredContent}>
                    <button onClick={handleStartBattle} className={`mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${styles.startBattleButton}`}>
                        Start Battle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NFTDetailsModal;
