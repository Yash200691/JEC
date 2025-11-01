# 🌐 Synthetic Data Marketplace

A decentralized marketplace for AI-generated synthetic datasets with automated quality verification powered by blockchain and IPFS.

## 📋 Project Overview

This platform enables users to:
- **Request AI-Generated Datasets**: Specify data requirements (type, count, description)
- **Instant Generation**: AI generates datasets immediately upon request
- **Quality Assurance**: Automated QA verification with detailed reports stored on IPFS
- **Blockchain Verification**: All requests and QA report CIDs stored on-chain
- **Direct Dataset Viewing**: Generated datasets displayed directly on the frontend

## 🏗️ Architecture

### Smart Contract (`contracts/SyntheticDataMarket.sol`)
- Manages data requests with escrow functionality
- Stores submission metadata and QA report CIDs
- Handles request lifecycle (Open → In Progress → Completed/Disputed)
- Built with Solidity ^0.8.20

### Backend (`backend/`)
- **Express.js API** for dataset generation and verification
- **AI Model Integration** for synthetic data generation (mock implementation)
- **IPFS Integration** via kubo-rpc-client for QA report storage
- **Blockchain Service** using ethers.js v6 for smart contract interactions

### Frontend (`frontend/`)
- **React 18 + Vite** for fast development
- **TailwindCSS** for clean, white-themed UI
- **ethers.js v6** for Web3 wallet connectivity
- **Dataset Viewer** supporting multiple formats (audio, CSV, images, text, video, mixed)
- **QA Report Viewer** fetching reports from IPFS via CID

## 🚀 Quick Start

### Prerequisites
- Node.js v18+ and npm
- MetaMask wallet
- Alchemy account (for Sepolia RPC)

### 1. Install Dependencies

```bash
# Root project (Hardhat)
npm install

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Root `.env` (for deployment):**
```bash
cp .env.example .env
# Edit .env and add:
# - SEPOLIA_RPC_URL (Alchemy Sepolia endpoint)
# - PRIVATE_KEY (your deployer wallet private key)
```

**Backend `.env`:**
```bash
cd backend
cp .env.example .env
# Edit backend/.env and add:
# - SEPOLIA_RPC_URL
# - PRIVATE_KEY
# - CONTRACT_ADDRESS (will be filled after deployment)
```

**Frontend `.env`:**
```bash
cd frontend
cp .env.example .env
# Edit frontend/.env and add:
# - VITE_CONTRACT_ADDRESS (will be filled after deployment)
```

### 3. Deploy Smart Contract

```bash
# From root directory
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
```

After deployment:
1. Copy the contract address from the console
2. Add it to `backend/.env` as `CONTRACT_ADDRESS`
3. Add it to `frontend/.env` as `VITE_CONTRACT_ADDRESS`

### 4. Start Backend

```bash
cd backend
npm start
# Server runs on http://localhost:3000
```

### 5. Start Frontend

```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

## 📖 User Workflow

### For Buyers (Simplified Flow)

1. **Connect Wallet** - Connect MetaMask to Sepolia testnet
2. **Create Request**:
   - Navigate to Dashboard
   - Click "New Request"
   - Enter:
     - Description (e.g., "100 speech audio samples for voice recognition")
     - Data Type (AUDIO, CSV, IMAGE, TEXT, VIDEO, or MIXED)
     - Sample Count
     - Optional: Sample data to guide AI generation
3. **AI Generation** - Dataset generated instantly by backend AI service
4. **View Dataset** - Generated dataset displayed directly on frontend
5. **QA Report** - Quality report automatically generated, stored on IPFS, CID saved on blockchain
6. **Download** - Access dataset and QA report from Request Details page

## 🛠️ Technology Stack

### Blockchain Layer
- **Solidity** ^0.8.20
- **Hardhat** v2.26.0 with ES modules
- **ethers.js** v6
- **Network**: Sepolia Testnet
- **RPC Provider**: Alchemy

### Backend Stack
- **Node.js** + Express.js
- **IPFS**: kubo-rpc-client v3.0.2
- **Logging**: Winston
- **Environment**: dotenv with ESM support

### Frontend Stack
- **React** 18.3.1
- **Vite** 6.0.1
- **Styling**: TailwindCSS 3.4.17
- **Routing**: react-router-dom v6
- **Notifications**: react-hot-toast
- **Icons**: lucide-react

## 📁 Project Structure

```
JEC/
├── contracts/
│   ├── SyntheticDataMarket.sol    # Main marketplace contract
│   └── Lock.sol                    # Sample Hardhat contract
├── scripts/
│   └── deploy.js                   # Deployment script for Sepolia
├── backend/
│   ├── src/
│   │   ├── server.js              # Express server
│   │   ├── routes/                # API routes
│   │   ├── services/              # Blockchain, IPFS, AI services
│   │   └── utils/                 # Logger and helpers
│   ├── contracts/                 # ABI files (auto-generated)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Dashboard, RequestDetails, Home
│   │   ├── context/               # WalletContext
│   │   ├── services/              # API and blockchain services
│   │   └── utils/                 # Helper functions
│   ├── public/
│   └── package.json
├── hardhat.config.js
└── package.json
```

## 🔧 Development Commands

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy to Sepolia
```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Backend Development
```bash
cd backend
npm run dev  # Development mode with auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

## 🌐 IPFS Integration

- **QA Reports**: Uploaded to IPFS via kubo-rpc-client
- **CID Storage**: Stored on blockchain for verification
- **Gateway**: Fetched via IPFS gateway (https://ipfs.io/ipfs/) on frontend

## 🔐 Security Notes

1. **Never commit** `.env` files with real private keys
2. **Use testnet** (Sepolia) for development
3. **Limit budget** - Frontend uses minimal budget (0.001 ETH) for AI-generated requests
4. **Verify contracts** on Etherscan after deployment

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open issues or submit PRs.

---

**Built with ❤️ using Hardhat, React, and IPFS**
