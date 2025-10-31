# Synthetic Data Market - Frontend

A beautiful, modern React frontend for the Synthetic Data Market decentralized application. Built with React, Vite, TailwindCSS, and ethers.js.

## Features

- 🎨 **Clean UI**: Beautiful white-themed interface with eye-soothing design
- 🔐 **Wallet Integration**: MetaMask connection with account management
- 📊 **Dashboard Views**: Separate buyer and seller dashboards
- 🎯 **Request Management**: Create and manage data requests
- 📤 **Dataset Submission**: Submit datasets with AI model integration
- 📝 **QA Report Viewer**: Fetch and display quality reports from IPFS
- 🎬 **Dataset Previews**: View datasets in multiple formats (audio, video, images, CSV, text)
- 💰 **Blockchain Integration**: Full smart contract interaction via ethers.js

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **ethers.js v6** - Ethereum library
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Toast notifications
- **Lucide React** - Beautiful icon set

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── UI.jsx                  # Reusable UI components
│   │   ├── Navbar.jsx              # Navigation bar
│   │   ├── WalletConnect.jsx       # Wallet connection component
│   │   ├── DatasetViewer.jsx       # Dataset preview component
│   │   └── QAReportViewer.jsx      # IPFS QA report viewer
│   ├── context/
│   │   └── WalletContext.jsx       # Wallet state management
│   ├── pages/
│   │   ├── Home.jsx                # Landing page
│   │   ├── BuyerDashboard.jsx      # Buyer dashboard
│   │   ├── SellerDashboard.jsx     # Seller dashboard
│   │   └── RequestDetails.jsx      # Request details & submissions
│   ├── services/
│   │   ├── blockchainService.js    # Smart contract interactions
│   │   ├── apiService.js           # Backend API client
│   │   └── ipfsService.js          # IPFS gateway client
│   ├── utils/
│   │   └── helpers.js              # Utility functions
│   ├── App.jsx                     # Main app component
│   ├── main.jsx                    # Entry point
│   └── index.css                   # Global styles
├── .env.example                    # Environment variables template
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Backend API URL (your Node.js backend)
VITE_API_URL=http://localhost:3000

# Smart Contract Address (after deployment)
VITE_CONTRACT_ADDRESS=0xYourContractAddress

# Network Configuration
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia

# IPFS Gateway for QA Reports
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 4. Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` folder.

## Usage Guide

### For Buyers

1. **Connect Wallet**: Click "Connect Wallet" to link your MetaMask
2. **Create Request**: Go to Buyer Dashboard → New Request
   - Enter description of data you need
   - Set budget in ETH
   - Select accepted formats
3. **View Submissions**: Click on any request to see seller submissions
4. **Review Quality**: View QA reports from IPFS for verified submissions

### For Sellers

1. **Connect Wallet**: Link your MetaMask wallet
2. **Browse Requests**: Navigate to Seller Dashboard
3. **Submit Dataset**: Click on any open request
   - Select data type
   - Enter sample count
   - Click "Generate & Submit" (calls AI model via backend)
4. **Track Status**: Monitor your submissions in the dashboard

## Key Features Explained

### Dataset Viewer

Displays datasets based on their format:
- **Audio**: Audio player with controls
- **CSV**: Interactive table view
- **Images**: Grid gallery
- **Text**: Formatted text viewer
- **Video**: Video player
- **Mixed**: Archive viewer

### QA Report Viewer

Fetches quality reports from IPFS and displays:
- Overall quality score
- Detailed metrics (completeness, accuracy, consistency)
- Issues found
- Recommendations
- Verification timestamp
- Direct link to view raw report on IPFS

### Smart Contract Integration

All blockchain operations via `blockchainService.js`:
- Create requests with escrow
- Submit datasets
- Query requests and submissions
- Listen to contract events
- Handle network switching

### Backend Integration

All AI/QA operations via `apiService.js`:
- Generate datasets using AI models
- Verify dataset quality
- Complete workflow (generate + verify)
- Fetch QA reports from IPFS

## Important Notes

### Storage Architecture

- ✅ **QA Reports**: Stored on IPFS, CID stored on blockchain
- ✅ **Dataset Metadata**: Stored on blockchain (format, size, samples)
- ❌ **Actual Datasets**: Stored OFF-CHAIN (S3, seller servers, etc.)
  - Only a reference/URL is stored on-chain in `datasetReference` field

### MetaMask Configuration

Make sure you have:
- MetaMask installed
- Sepolia testnet added
- Test ETH in your wallet

### Backend Dependency

The frontend requires the backend API to be running for:
- Dataset generation (AI model calls)
- Quality verification (QA service calls)
- IPFS QA report uploads

## Troubleshooting

### "Contract not initialized"
- Ensure `VITE_CONTRACT_ADDRESS` is set in `.env`
- Check contract is deployed to the correct network

### "MetaMask not installed"
- Install MetaMask browser extension
- Refresh the page after installation

### "Wrong network"
- Switch to Sepolia in MetaMask
- Or update `VITE_CHAIN_ID` to match your deployed network

### IPFS Reports Not Loading
- Check `VITE_IPFS_GATEWAY` is accessible
- Try alternative gateways:
  - `https://gateway.pinata.cloud/ipfs/`
  - `https://cloudflare-ipfs.com/ipfs/`

## Development

### Adding New Components

1. Create component in `src/components/`
2. Import and use in pages
3. Follow existing patterns for consistency

### Adding New Pages

1. Create page in `src/pages/`
2. Add route in `src/App.jsx`
3. Add navigation link in `src/components/Navbar.jsx`

### Styling Guidelines

- Use TailwindCSS utility classes
- Follow existing color scheme (primary-600, gray-900, etc.)
- Maintain consistent spacing and borders
- Use provided UI components for consistency

## License

MIT License - Part of the Synthetic Data Market project
