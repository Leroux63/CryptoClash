// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./CryptoClash.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

contract CryptoClashCat is Initializable, ERC721URIStorageUpgradeable, ERC721EnumerableUpgradeable {
    struct NFTData {
        string attack;
        uint256 wins;
    }

    struct Battle {
        address player1;
        address player2;
        uint256 tokenId1;
        uint256 tokenId2;
        string attack1;
        string attack2;
        bool player1Played;
        bool player2Played;
    }

    mapping(uint256 => NFTData) private _nftData;
    mapping(uint256 => Battle) private _battles;
    uint256 private _battleCounter;

    address private _owner;
    uint256 private _totalSupply;
    uint256 private _maxNFTs;

    event FundsWithdrawn(address owner, uint amount);
    event BattleStarted(uint256 indexed battleId, address indexed player1, address indexed player2, uint256 tokenId1, uint256 tokenId2);
    event AttackSubmitted(uint256 indexed battleId, address indexed player, string attack);
    event BattleResolved(uint256 indexed battleId, address winner, uint256 winnerTokenId, address loser, uint256 loserTokenId);

    uint256 public firstPlaceReward;
    uint256 public secondPlaceReward;
    uint256 public thirdPlaceReward;

    function initialize(uint256 maxNFTs) public initializer {
        __ERC721_init("CryptoClashCat", "CCC");
        __ERC721URIStorage_init();
        __ERC721Enumerable_init();
        _owner = msg.sender;

        _maxNFTs = maxNFTs;
        _totalSupply = 0;

        firstPlaceReward = 1000;
        secondPlaceReward = 500;
        thirdPlaceReward = 250;
    }

    function getNextTokenId() public view returns (uint256) {
        return _totalSupply + 1;
    }

    function safeMint(address to, string memory uri) public payable {
        require(_totalSupply < _maxNFTs, "Maximum number of NFTs minted");
        require(msg.value == 0.05 ether, "You must send 0.05 ETH to mint");

        uint256 tokenId = _getNextTokenId();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _incrementTokenId();
    }

    function chooseAttack(uint256 tokenId, string memory attack) public {
        require(ownerOf(tokenId) == msg.sender, "You are not the owner of this NFT");
        require(
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("paper")) ||
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("rock")) ||
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("scissors")),
            "Invalid attack, must be 'paper', 'rock', or 'scissors'"
        );
        _nftData[tokenId].attack = attack;
    }

    function startBattle(uint256 tokenId1, uint256 tokenId2) public {
        require(ownerOf(tokenId1) == msg.sender, "You are not the owner of this NFT");
        address owner2 = ownerOf(tokenId2);
        require(owner2 != address(0), "Opponent NFT does not exist");

        _battleCounter++;
        _battles[_battleCounter] = Battle({
            player1: msg.sender,
            player2: owner2,
            tokenId1: tokenId1,
            tokenId2: tokenId2,
            attack1: "",
            attack2: "",
            player1Played: false,
            player2Played: false
        });

        emit BattleStarted(_battleCounter, msg.sender, owner2, tokenId1, tokenId2);
    }

    function submitAttack(uint256 battleId, uint256 tokenId, string memory attack) public {
        Battle storage battle = _battles[battleId];
        require(battle.player1 == msg.sender || battle.player2 == msg.sender, "You are not a player in this battle");
        require(
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("paper")) ||
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("rock")) ||
            keccak256(abi.encodePacked(attack)) == keccak256(abi.encodePacked("scissors")),
            "Invalid attack"
        );

        if (battle.player1 == msg.sender && battle.tokenId1 == tokenId) {
            battle.attack1 = attack;
            battle.player1Played = true;
        } else if (battle.player2 == msg.sender && battle.tokenId2 == tokenId) {
            battle.attack2 = attack;
            battle.player2Played = true;
        } else {
            revert("You are not a player in this battle or wrong tokenId");
        }

        emit AttackSubmitted(battleId, msg.sender, attack);

        if (battle.player1Played && battle.player2Played) {
            resolveBattle(battleId);
        }
    }



    function resolveBattle(uint256 battleId) internal {
        Battle storage battle = _battles[battleId];
        address winner;
        uint256 winnerTokenId;
        address loser;
        uint256 loserTokenId;

        if (
            (keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("paper")) &&
                keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("rock"))) ||
            (keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("rock")) &&
                keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("scissors"))) ||
            (keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("scissors")) &&
                keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("paper")))
        ) {
            winner = battle.player1;
            winnerTokenId = battle.tokenId1;
            loser = battle.player2;
            loserTokenId = battle.tokenId2;
            _nftData[battle.tokenId1].wins++;
        } else if (
            (keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("paper")) &&
                keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("rock"))) ||
            (keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("rock")) &&
                keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("scissors"))) ||
            (keccak256(abi.encodePacked(battle.attack2)) == keccak256(abi.encodePacked("scissors")) &&
                keccak256(abi.encodePacked(battle.attack1)) == keccak256(abi.encodePacked("paper")))
        ) {
            winner = battle.player2;
            winnerTokenId = battle.tokenId2;
            loser = battle.player1;
            loserTokenId = battle.tokenId1;
            _nftData[battle.tokenId2].wins++;
        } else {
            winner = address(0);
            winnerTokenId = 0;
            loser = address(0);
            loserTokenId = 0;
        }

        emit BattleResolved(battleId, winner, winnerTokenId, loser, loserTokenId);
    }


    function getBattle(uint256 battleId) public view returns (Battle memory) {
        return _battles[battleId];
    }

    function getWins(uint256 tokenId) public view returns (uint256) {
        return _nftData[tokenId].wins;
    }

    function getBattleCounter() public view returns (uint256) {
        return _battleCounter;
    }

    function rewardTopNFTs(address[] memory topNFTs, address cryptoClashContract) external {
        require(msg.sender == _owner, "Only the owner can allocate rewards");
        require(topNFTs.length <= 3, "Cannot reward more than 3 NFTs");

        CryptoClash cryptoClash = CryptoClash(cryptoClashContract);
        uint256[] memory rewardAmounts = new uint256[](3);
        rewardAmounts[0] = firstPlaceReward;
        rewardAmounts[1] = secondPlaceReward;
        rewardAmounts[2] = thirdPlaceReward;

        for (uint256 i = 0; i < topNFTs.length; i++) {
            require(topNFTs[i] != address(0), "Invalid address");
            cryptoClash.approveSpending(topNFTs[i], rewardAmounts[i]);
        }

        for (uint256 i = 0; i < topNFTs.length; i++) {
            require(topNFTs[i] != address(0), "Invalid address");
            CryptoClash cryptoClashInstance = CryptoClash(topNFTs[i]);
            cryptoClashInstance.mint(topNFTs[i], rewardAmounts[i]);
        }
    }

    function _incrementTokenId() internal {
        _totalSupply++;
    }

    function _getNextTokenId() internal view returns (uint256) {
        return _totalSupply + 1;
    }

    function withdraw() public {
        require(msg.sender == _owner, "Only the owner can withdraw funds");
        uint256 amount = address(this).balance;
        (bool success,) = _owner.call{value: amount}("");
        require(success, "Failed to withdraw funds");
        emit FundsWithdrawn(_owner, amount);
    }

    receive() external payable {}

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721URIStorageUpgradeable, ERC721EnumerableUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721URIStorageUpgradeable, ERC721Upgradeable) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function _increaseBalance(address account, uint128 amount) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) {
        super._increaseBalance(account, amount);
    }

    function _update(address to, uint256 tokenId, address auth) internal virtual override(ERC721Upgradeable, ERC721EnumerableUpgradeable) returns (address) {
        return super._update(to, tokenId, auth);
    }
}
