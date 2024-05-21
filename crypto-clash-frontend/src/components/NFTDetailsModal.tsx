import React from 'react';
import NFTCard from './NFTCard';

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
}

const NFTDetailsModal: React.FC<NFTDetailsModalProps> = ({ nft, attack, setAttack, startBattle, closeModal }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-button" onClick={closeModal}>X</button>
                <NFTCard nft={nft} onClick={() => {}} />
                <h2>NFT Details</h2>
                <p>Name: {nft.name}</p>
                <p>Description: {nft.description}</p>
                <div className="mt-2">
                    <label>
                        Choose Attack:
                        <select value={attack} onChange={(e) => setAttack(e.target.value)}>
                            <option value="">Select</option>
                            <option value="rock">Rock</option>
                            <option value="paper">Paper</option>
                            <option value="scissors">Scissors</option>
                        </select>
                    </label>
                </div>
                <button onClick={startBattle} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                    Start Battle
                </button>
            </div>
        </div>
    );
};

export default NFTDetailsModal;
