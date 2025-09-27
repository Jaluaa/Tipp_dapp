// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract TipJar is ReentrancyGuard, Ownable {
    struct Creator {
        address payable wallet;
        string ensName;
        uint256 totalTips;
        uint256 tipCount;
        bool isRegistered;
    }

    mapping(string => Creator) public creators;
    mapping(address => string) public addressToEns;

    event CreatorRegistered(string indexed ensName, address indexed wallet);
    event TipSent(string indexed ensName, address indexed tipper, uint256 amount);

    constructor() {} // v4 syntax - no parameters needed

    function registerCreator(string memory _ensName) external {
        require(bytes(_ensName).length > 0, "ENS name cannot be empty");
        require(!creators[_ensName].isRegistered, "ENS already registered");
        require(bytes(addressToEns[msg.sender]).length == 0, "Address already has ENS");

        creators[_ensName] = Creator({
            wallet: payable(msg.sender),
            ensName: _ensName,
            totalTips: 0,
            tipCount: 0,
            isRegistered: true
        });

        addressToEns[msg.sender] = _ensName;

        emit CreatorRegistered(_ensName, msg.sender);
    }

    function tip(string memory _ensName) external payable nonReentrant {
        require(msg.value > 0, "Tip amount must be greater than 0");
        require(creators[_ensName].isRegistered, "Creator not registered");

        Creator storage creator = creators[_ensName];
        creator.totalTips += msg.value;
        creator.tipCount += 1;

        // Send tip directly to creator
        creator.wallet.transfer(msg.value);

        emit TipSent(_ensName, msg.sender, msg.value);
    }

    function getCreator(string memory _ensName) external view returns (Creator memory) {
        require(creators[_ensName].isRegistered, "Creator not found");
        return creators[_ensName];
    }

    function isCreatorRegistered(string memory _ensName) external view returns (bool) {
        return creators[_ensName].isRegistered;
    }
}
