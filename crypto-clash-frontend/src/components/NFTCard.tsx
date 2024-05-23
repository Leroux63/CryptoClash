import React from 'react';
import styles from '../styles/NFTCard.module.css';

interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

interface NFTCardProps {
    nft: NFT;
    onClick: () => void;
    highlight?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick, highlight = false }) => {
    return (
        <div className={`${styles.card} ${highlight ? styles.highlight : ''}`} onClick={onClick}>
            <div className="card mx-2 my-2">
                <div className="img_card" style={{ position: 'relative' }}>
                    <img
                        src={nft.image}
                        alt={nft.name}
                        style={{
                            width: '160px',
                            height: '210px',
                            borderRadius: '50px',
                            opacity: '0.8',
                            objectFit: 'cover',
                        }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textShadow: '1px 1px 2px black'
                    }}>
                        {nft.name}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NFTCard;
