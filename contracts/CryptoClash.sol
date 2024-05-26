// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CryptoClash is ERC20 {
    address public owner;

    uint constant private _initial_supply = 1000000 * (10 ** 18); // 1 million tokens with 18 decimals

    constructor() ERC20("CryptoClash", "CCH") {
        _mint(msg.sender, _initial_supply);
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function approveSpending(address spender, uint256 amount) external onlyOwner {
        _approve(owner, spender, amount);
    }

    function getAllowance(address _owner, address spender) external view returns (uint256) {
        return allowance(_owner, spender);
    }
}

