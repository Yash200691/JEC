# 🚀 Synthetic Data Market - Complete Project Setup

A complete decentralized marketplace for AI-generated synthetic datasets with built-in quality verification, smart contract escrow, and IPFS transparency.

## 📋 Project Overview

This project consists of three main components:

1. **Smart Contract** (`contracts/`) - Solidity smart contract for escrow and marketplace logic
2. **Backend API** (`backend/`) - Node.js/Express server for AI model integration and IPFS operations
3. **Frontend** (`frontend/`) - React web application for user interface

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React + ethers.js + TailwindCSS
│  (User Interface)│  - Wallet connection
└────────┬────────┘  - Create requests
         │            - Submit datasets
         │            - View QA reports
         ↓
┌─────────────────┐
│   Backend API   │  Node.js + Express
│   (Orchestrator)│  - AI model integration
└────────┬────────┘  - QA verification
         │            - IPFS uploads (QA reports only)
         │
    ┌────┴────┬──────────────┬─────────────┐
    ↓         ↓              ↓             ↓
┌───────┐ ┌──────┐  ┌──────────────┐  ┌─────────┐
│ Smart │ │ IPFS │  │  AI Model    │  │   QA    │
│Contract│ │ (QA) │  │   Service    │  │Verifier │
└───────┘ └──────┘  └──────────────┘  └─────────┘
```

### Storage Strategy

- ✅ **Blockchain**: Stores metadata + QA report CID + escrow
- ✅ **IPFS**: Stores ONLY quality assurance reports
- ❌ **Datasets**: Stored OFF-CHAIN (S3, seller servers, encrypted storage)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Test ETH on Sepolia testnet
- Local IPFS node or Infura/Pinata account (optional for testing)

### 1. Install Dependencies

```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Deploy Smart Contract

```powershell
# Compile contract
npx hardhat compile

# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address!

### 3. Configure Backend

```powershell
cd backend
cp .env.example .env
```

Edit `.env` and fill in:
- `ETHEREUM_RPC_URL` - Your Infura/Alchemy RPC URL
- `PRIVATE_KEY` - Your wallet private key (for backend operations)
- `CONTRACT_ADDRESS` - Deployed contract address from step 2
- `IPFS_HOST` and `IPFS_PORT` - Your IPFS node (or use defaults for testing)

Copy contract ABI:
```powershell
# Create contracts folder in backend
mkdir contracts
# Copy ABI from artifacts (after you get it from hardhat)
```

### 4. Configure Frontend

```powershell
cd frontend
cp .env.example .env
```

Edit `.env` and fill in:
- `VITE_API_URL` - Backend URL (http://localhost:3000)
- `VITE_CONTRACT_ADDRESS` - Deployed contract address
- `VITE_CHAIN_ID` - 11155111 (Sepolia)
- `VITE_IPFS_GATEWAY` - https://ipfs.io/ipfs/

### 5. Start Services

```powershell
# Terminal 1 - Start backend
cd backend
npm start

# Terminal 2 - Start frontend
cd frontend
npm run dev
```

## 📖 Complete Workflow

### As a Buyer

1. **Connect Wallet**
   - Open http://localhost:5173
   - Click "Connect Wallet"
   - Approve MetaMask connection

2. **Create Request**
   - Go to Buyer Dashboard
   - Click "New Request"
   - Fill in:
     - Description: "Need 1000 audio samples for speech recognition"
     - Budget: 0.1 ETH
     - Formats: Select AUDIO
   - Submit transaction in MetaMask
   - Wait for confirmation

3. **View Submissions**
   - Click on your request
   - Sellers will submit datasets
   - Review dataset previews
   - Check QA reports from IPFS

4. **Automatic Payment**
   - When QA verification completes
   - If approved: Payment released to seller
   - If rejected: Refund issued to you

### As a Seller

1. **Connect Wallet**
   - Connect MetaMask

2. **Browse Requests**
   - Go to Seller Dashboard
   - View open requests

3. **Submit Dataset**
   - Click on any open request
   - Click "Submit Dataset"
   - Select format and sample count
   - Click "Generate & Submit"
   - Backend calls AI model → generates dataset → submits to blockchain

4. **QA Verification**
   - Backend automatically calls QA verifier
   - QA report uploaded to IPFS
   - Report CID submitted to blockchain
   - If approved: Receive payment!

## 🛠️ Configuration Details

### Smart Contract

The contract (`contracts/SyntheticDataMarket.sol`) handles:
- Escrow management (holds buyer's ETH)
- Request/submission tracking
- QA verification results
- Automatic payments/refunds
- Model registry and self-verification controls

Key functions:
- `createRequest(formatsMask, description)` - Buyer creates request
- `submitDataset(requestId, format, fileSize, ...)` - Seller submits
- `verifySubmission(submissionId, approved, score, reportCid)` - QA verification

### Backend API

The backend (`backend/src/`) provides:

**Endpoints:**
- `POST /api/dataset/generate` - Generate dataset via AI
- `POST /api/dataset/verify` - Verify quality and upload report
- `POST /api/dataset/generate-and-verify` - Complete workflow
- `GET /api/dataset/request/:id` - Get request details
- `GET /api/dataset/submission/:id` - Get submission details
- `GET /api/dataset/qa-report/:cid` - Fetch QA report from IPFS

**Services:**
- `blockchainService.js` - Contract interactions
- `ipfsService.js` - IPFS uploads (QA reports only!)
- `aiModelService.js` - AI model + QA verifier integration

### Frontend

The frontend (`frontend/src/`) includes:

**Pages:**
- `/` - Home/landing page
- `/buyer` - Buyer dashboard
- `/seller` - Seller dashboard
- `/request/:id` - Request details with submissions

**Components:**
- `DatasetViewer` - Preview datasets (audio, video, images, CSV, text)
- `QAReportViewer` - Fetch and display QA reports from IPFS
- `WalletConnect` - MetaMask integration
- `UI.jsx` - Reusable components (Button, Card, Modal, etc.)

## 🔑 Key Features

### ✅ What the System Does

1. **Decentralized Marketplace**
   - No intermediaries
   - Smart contract escrow
   - Transparent on-chain records

2. **AI Integration**
   - Automated dataset generation
   - Quality verification
   - Mock implementations for testing

3. **IPFS Transparency**
   - QA reports stored on IPFS
   - Immutable verification records
   - Public accessibility

4. **Multi-Format Support**
   - Audio (wav, mp3)
   - CSV (data tables)
   - Images (png, jpg)
   - Text (txt, json)
   - Video (mp4, avi)
   - Mixed (zip archives)

### ⚠️ Important Clarifications

1. **Datasets are NOT stored on blockchain or IPFS**
   - Too expensive and slow
   - Stored off-chain (S3, seller servers, etc.)
   - Only metadata + reference stored on-chain

2. **Only QA reports go to IPFS**
   - Lightweight (JSON reports)
   - Transparent verification
   - Anyone can verify quality claims

3. **Backend is required for**
   - AI model integration
   - QA verification
   - IPFS uploads
   - (Frontend can read from blockchain directly, but not write without backend)

## 🧪 Testing

### With Mock Services (No AI/QA endpoints needed)

The backend automatically uses mock implementations if endpoints aren't configured:

1. Start backend with default .env
2. Create request in frontend
3. Submit dataset - backend will use mock AI generation
4. Verification will use mock QA service
5. Full workflow completes successfully!

### With Real Services

When you have actual AI model and QA verifier endpoints:

1. Update backend `.env`:
   ```env
   AI_MODEL_ENDPOINT=https://your-ai-model.com/generate
   QA_VERIFIER_ENDPOINT=https://your-qa-service.com/verify
   ```

2. Expected AI model response format:
   ```json
   {
     "files": [...],
     "metadata": {
       "format": 0,
       "fileSize": 1024000,
       "sampleCount": 100,
       "fileExtensions": "wav,mp3"
     }
   }
   ```

3. Expected QA verifier response format:
   ```json
   {
     "approved": true,
     "qualityScore": 85,
     "report": {
       "summary": "Dataset meets requirements",
       "metrics": { ... },
       "issues": [],
       "recommendations": []
     }
   }
   ```

## 📦 Project Structure

```
JEC/
├── contracts/
│   ├── SyntheticDataMarket.sol    # Main smart contract
│   └── Lock.sol                    # Example contract
├── backend/
│   ├── src/
│   │   ├── services/              # Blockchain, IPFS, AI services
│   │   ├── routes/                # API endpoints
│   │   └── utils/                 # Logger
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/            # UI components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API clients
│   │   ├── context/               # React context
│   │   └── utils/                 # Helper functions
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── hardhat.config.js
└── package.json
```

## 🐛 Troubleshooting

### Contract Deployment Issues
- Ensure you have test ETH
- Check RPC URL is correct
- Verify network in hardhat.config.js

### Backend Won't Start
- Check all .env variables are set
- Ensure contract ABI file exists
- Verify IPFS node is accessible

### Frontend Can't Connect
- MetaMask installed and unlocked?
- Correct network selected in MetaMask?
- Backend API running on correct port?
- Contract address in .env correct?

### Transactions Failing
- Enough ETH for gas fees?
- Contract address correct?
- Correct network (Sepolia)?
- Check MetaMask for error details

## 📝 Next Steps

1. **Deploy to Testnet**
   - Deploy contract to Sepolia
   - Configure backend with contract address
   - Test complete workflow

2. **Add Real AI Services**
   - Integrate your AI model endpoint
   - Add QA verification service
   - Update backend configuration

3. **Production Deployment**
   - Deploy contract to mainnet
   - Deploy backend to cloud (AWS, Heroku, etc.)
   - Deploy frontend to Vercel/Netlify
   - Use production IPFS service (Pinata, Infura)

## 📄 License

MIT License

## 🙋 Support

For issues or questions:
1. Check the individual README files in each folder
2. Review the code comments (extensively documented)
3. Check console logs for error details

---

**Built with ❤️ for the decentralized future of data marketplaces**
