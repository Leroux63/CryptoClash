// Battle.tsx
import React from 'react';

interface NFT {
    tokenId: string;
    image: string;
    name: string;
    description: string;
}

interface BattleProps {
    selectedNFT: NFT;
    opponentNFT: NFT;
    attack: string;
    setAttack: (attack: string) => void;
    startBattle: () => void;
    checkBattleStatus: () => void;
    result: string | null;
    battleId: number | null;
}

const Battle: React.FC<BattleProps> = ({
                                           selectedNFT, opponentNFT, attack, setAttack, startBattle, checkBattleStatus, result, battleId
                                       }) => {
    return (
        <div className="battle">
            <h2>Battle</h2>
            <div className="battle-nfts">
                <div>
                    <h3>Your NFT</h3>
                    <img src={selectedNFT.image} alt={selectedNFT.name} />
                    <p>{selectedNFT.name}</p>
                </div>
                <div>
                    <h3>Opponent's NFT</h3>
                    <img src={opponentNFT.image} alt={opponentNFT.name} />
                    <p>{opponentNFT.name}</p>
                </div>
            </div>
            <div className="attack-selection">
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
            <button onClick={startBattle} className="start-battle-button">
                Start Battle
            </button>
            {result && <p>{result}</p>}
            {battleId && (
                <button onClick={checkBattleStatus} className="check-status-button">
                    Check Battle Status
                </button>
            )}
        </div>
    );
};

export default Battle;
