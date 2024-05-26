
# CryptoClash

This project demonstrates a comprehensive use case of Hardhat, including an ERC20 token contract (`CryptoClash`), an upgradable ERC721 NFT contract (`CryptoClashCat`), IPFS integration, and a frontend application built with Next.js. The project showcases minting, token approval, and a simple battle game mechanic using NFTs.

## Prerequisites

- Node.js
- npm or yarn
- Hardhat
- Alchemy (for Ethereum node)
- Metamask (for interacting with the deployed contracts)
- IPFS (for decentralized storage)

## Installation

1. **Clone the repository:**
    ```sh
    git clone https://github.com/Leroux63/CryptoClash.git
    cd CryptoClash
    ```

2. **Install the dependencies:**
    ```sh
    npm install
    # or
    yarn install
    ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add the following:
    ```plaintext
    SEPOLIA_URL=https://eth-sepolia.alchemyapi.io/v2/your-alchemy-key
    SEPOLIA_URL_2=https://eth-sepolia.alchemyapi.io/v2/your-second-alchemy-key
    PRIVATE_KEY=your-wallet-private-key
    TOKEN_CONTRACT_ADDRESS=your-deployed-token-contract-address
    CONTRACT_NFT_ADDRESS=your-deployed-nft-contract-address
    ```

4. **Set up frontend environment variables:**
   Create a `.env.local` file in the `crypto-clash-frontend` directory and add the following:
    ```plaintext
    NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=your-deployed-token-contract-address
    NEXT_PUBLIC_NFT_CONTRACT_ADDRESS=your-deployed-nft-contract-address
    NEXT_PUBLIC_RPC_URL=https://eth-sepolia.alchemyapi.io/v2/your-alchemy-key
    NEXT_PUBLIC_SEPOLIA_URL_2=https://eth-sepolia.alchemyapi.io/v2/your-second-alchemy-key
    ```

## Usage

### Compile the contracts

```sh
npx hardhat compile
```

### Deploy the contracts

To deploy the `CryptoClash` contract:
```sh
npx hardhat run scripts/deploy.js --network sepolia
```

To deploy the `CryptoClashCat` contract:
```sh
npx hardhat run scripts/deployNFTContract.js --network sepolia2
```

Make sure to update the deployment scripts to reflect the correct initialization parameters and contract addresses.

### Run tests

To run the tests, ensure that your contracts are compiled and then run:
```sh
npx hardhat test
```

### Start the frontend

1. Navigate to the frontend directory:
    ```sh
    cd crypto-clash-frontend
    ```

2. Install frontend dependencies:
    ```sh
    npm install
    # or
    yarn install
    ```

3. Start the frontend application:
    ```sh
    npm run dev
    ```

### Copy artifacts to frontend

Copy the generated artifacts from the artifacts directory to the public directory in the frontend:
```sh
cp -r artifacts/contracts/* crypto-clash-frontend/public/
```

## Project Structure

- `contracts/`: Contains the Solidity smart contracts.
- `scripts/`: Contains the deployment scripts.
- `test/`: Contains the test scripts.
- `artifacts/`: Generated files from compiling the smart contracts.
- `crypto-clash-frontend/`: Contains the frontend application built with Next.js.
- `hardhat.config.js`: Hardhat configuration file.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Contact

For any inquiries or support, please contact us at dleroux63160@gmail.com.


## Support
If you like this project, consider buying me a coffee!

[Buy me a coffee](https://buymeacoffee.com/leroux63)