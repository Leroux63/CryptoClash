// PlayerInfo.tsx
import React from 'react';
import NFTCard from './NFTCard';

interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

interface PlayerInfoProps {
    nfts: NFT[];
    onSelectNFT: (nft: NFT) => void;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ nfts, onSelectNFT }) => {
    return (
        <div className="player-info">
            {nfts.map((nft, index) => (
                <NFTCard key={index} nft={nft} onClick={() => onSelectNFT(nft)} />
            ))}
        </div>
    );
};

export default PlayerInfo;
