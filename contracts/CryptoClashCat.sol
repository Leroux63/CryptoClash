// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./CryptoClash.sol";

contract CryptoClashCat is Initializable, ERC721URIStorageUpgradeable {
    struct NFTData {
        string attack; // The attack chosen by the player (paper, rock, scissors)
        uint256 wins; // The number of wins for this NFT
    }

    mapping(uint256 => NFTData) private _nftData; // Associates the NFT ID with its data

    address private _owner;
    uint256 private _totalSupply;
    uint256 private _maxNFTs; // Maximum number of NFTs

    event FundsWithdrawn(address owner, uint amount);

    // Declaration of reward amounts for the top three places
    uint256 public firstPlaceReward;
    uint256 public secondPlaceReward;
    uint256 public thirdPlaceReward;

    // Function to initialize
    function initialize(uint256 maxNFTs) public initializer {
        __ERC721_init("CryptoClashCat", "CCC");
        __ERC721URIStorage_init();
        _owner = msg.sender;

        _maxNFTs = maxNFTs; // Set the maximum number of NFTs
        _totalSupply = 0; // Initialize total supply to zero

        // Set reward amounts (adjust as needed)
        firstPlaceReward = 1000;
        secondPlaceReward = 500;
        thirdPlaceReward = 250;
    }

    function getNextTokenId() public view returns (uint256) {
        return _totalSupply + 1;
    }

    // Secure mint function
    function safeMint(address to, string memory uri) public payable {
        require(_totalSupply < _maxNFTs, "Maximum number of NFTs minted");
        require(msg.value == 0.05 ether, "You must send 0.05 ETH to mint");

        uint256 tokenId = _getNextTokenId(); // Using _getNextTokenId() as the new NFT ID
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        _incrementTokenId(); // Increment the token ID after minting
    }


    // Function to choose attack
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

    // Function to fight
    function fight(uint256 tokenId1, uint256 tokenId2) public {
        require(ownerOf(tokenId1) != address(0) && ownerOf(tokenId2) != address(0), "One of the tokens does not exist");

        string memory attack1 = _nftData[tokenId1].attack;
        string memory attack2 = _nftData[tokenId2].attack;

        if (
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("paper")) &&
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("rock")) ||
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("rock")) &&
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("scissors")) ||
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("scissors")) &&
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("paper"))
        ) {
            _nftData[tokenId1].wins++;
        } else if (
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("paper")) &&
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("rock")) ||
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("rock")) &&
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("scissors")) ||
            keccak256(abi.encodePacked(attack2)) == keccak256(abi.encodePacked("scissors")) &&
            keccak256(abi.encodePacked(attack1)) == keccak256(abi.encodePacked("paper"))
        ) {
            _nftData[tokenId2].wins++;
        }
    }

    // Function to get the number of wins
    function getWins(uint256 tokenId) public view returns (uint256) {
        return _nftData[tokenId].wins;
    }

    // Function to reward the top 3 NFTs
    function rewardTopNFTs(address[] memory topNFTs, address cryptoClashContract) external {
        require(msg.sender == _owner, "Only the owner can allocate rewards");
        require(topNFTs.length <= 3, "Cannot reward more than 3 NFTs");

        // Approve spending for each address
        CryptoClash cryptoClash = CryptoClash(cryptoClashContract);
        uint256[] memory rewardAmounts = new uint256[](3);
        rewardAmounts[0] = firstPlaceReward;
        rewardAmounts[1] = secondPlaceReward;
        rewardAmounts[2] = thirdPlaceReward;

        for (uint256 i = 0; i < topNFTs.length; i++) {
            require(topNFTs[i] != address(0), "Invalid address");
            cryptoClash.approveSpending(topNFTs[i], rewardAmounts[i]);
        }

        // Transfer rewards to the top 3 NFTs
        for (uint256 i = 0; i < topNFTs.length; i++) {
            require(topNFTs[i] != address(0), "Invalid address");
            CryptoClash cryptoClashInstance = CryptoClash(topNFTs[i]);
            cryptoClashInstance.mint(topNFTs[i], rewardAmounts[i]); // Awarding rewards to each NFT
        }
    }

    // Function to increment the token ID
    function _incrementTokenId() internal {
        _totalSupply++;
    }

    // Function to get the next token ID
    function _getNextTokenId() internal view returns (uint256) {
        return _totalSupply + 1; // Increment total supply to get the next token ID
    }

    // Withdraw function
    function withdraw() public {
        require(msg.sender == _owner, "Only the owner can withdraw funds");
        uint256 amount = address(this).balance;
        (bool success,) = _owner.call{value: amount}("");
        require(success, "Failed to withdraw funds");
        emit FundsWithdrawn(_owner, amount);
    }

    // Fallback function to receive Ether
    receive() external payable {}
}
