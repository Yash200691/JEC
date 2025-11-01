# Synthetic Data Market - Backend Service

Node.js backend service for the SyntheticDataMarket decentralized application. This service handles AI model interactions, IPFS uploads, and blockchain contract interactions.

## Features

- **AI Model Integration**: Calls AI endpoints to generate synthetic datasets
- **IPFS Storage**: Uploads ONLY QA reports to IPFS (datasets stored off-chain)
- **Blockchain Integration**: Interacts with SyntheticDataMarket smart contract
- **Quality Verification**: Automated quality assessment and reporting
- **RESTful API**: Clean API endpoints for frontend integration

## Architecture

```
Frontend → Backend API → AI Model Endpoint (generates dataset off-chain)
                       → IPFS (Quality Reports ONLY)
                       → Blockchain (Smart Contract - stores report CID)
                       
Dataset Storage: External (S3, seller server, encrypted storage - NOT IPFS)
```

## Prerequisites

- Node.js 18+ and npm
- IPFS node (local or service like Infura/Pinata)
- Ethereum wallet with private key
- Access to Ethereum RPC provider (Infura, Alchemy, etc.)

## Installation

1. **Clone and navigate to backend directory**:
```bash
cd backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

4. **Edit `.env` file with your configuration**:
   - Add your Ethereum RPC URL
   - Add your private key (without 0x prefix)
   - Set contract address (you'll get this after deployment)
   - Configure IPFS settings
   - Add AI model endpoint URL (to be provided later)

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `ETHEREUM_RPC_URL` | Ethereum RPC endpoint | `https://sepolia.infura.io/v3/YOUR_KEY` |
| `PRIVATE_KEY` | Wallet private key (no 0x) | `abc123...` |
| `CONTRACT_ADDRESS` | Deployed contract address | `0x123...` |
| `IPFS_HOST` | IPFS node host | `127.0.0.1` or `ipfs.infura.io` |
| `IPFS_PORT` | IPFS node port | `5001` |
| `SAMPLE_SUBMISSION_ENDPOINT` | AI sample submission endpoint (receives buyer sample data) | `http://localhost:8000/submit` |
| `AI_GENERATION_ENDPOINT` | AI dataset generation endpoint | `http://localhost:8001/generate` |
| `QA_REPORT_ENDPOINT` | QA report / verification endpoint | `http://localhost:8002/verify` |
| `PORT` | Server port | `3000` |

### Contract ABI Setup

1. After deploying the smart contract, copy the ABI to:
```bash
mkdir -p contracts
# Copy your compiled contract JSON to contracts/SyntheticDataMarket.json
```

The file should contain either:
- Just the ABI array, or
- Full compilation output with an `abi` field

## Running the Service

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

## API Endpoints

### Health Check
```
GET /health
```
Returns server status and uptime.

### Generate Dataset
```
POST /api/dataset/generate
Content-Type: application/json

{
  "requestId": 1,
  "dataType": "audio",
  "sampleCount": 100,
  "description": "Generate audio samples for speech recognition",
  "additionalParams": {}
}
```

**Response**:
```json
{
  "success": true,
  "message": "Dataset generated and submitted to blockchain",
  "data": {
    "submissionId": "1",
    "transactionHash": "0x...",
    "datasetReference": "dataset_1_1234567890",
    "metadata": {
      "format": 0,
      "fileSize": 102400,
      "sampleCount": 100,
      "fileExtensions": "wav,mp3"
    }
  }
}
```

### Verify Dataset Quality
```
POST /api/dataset/verify
Content-Type: application/json

{
  "submissionId": 1,
  "datasetReference": "dataset_1_1234567890",
  "requestDescription": "Original request description"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Quality verification completed and submitted to blockchain",
  "data": {
    "approved": true,
    "qualityScore": 85,
    "qaReportCid": "QmXxx...",
    "transactionHash": "0x..."
  }
}
```

### Complete Workflow (Generate + Verify)
```
POST /api/dataset/generate-and-verify
Content-Type: application/json

{
  "requestId": 1,
  "dataType": "audio",
  "sampleCount": 100,
  "description": "Generate audio samples",
  "autoVerify": true
}
```

### Get Request Details
```
GET /api/dataset/request/:requestId
```

### Get Submission Details
```
GET /api/dataset/submission/:submissionId
```

### Get QA Report from IPFS
```
GET /api/dataset/qa-report/:cid
```

## Service Architecture

### Services

1. **AIModelService** (`src/services/aiModelService.js`)
   - Calls AI model endpoint for dataset generation
   - Calls QA verifier endpoint for quality assessment
   - Provides mock implementations for testing

2. **IPFSService** (`src/services/ipfsService.js`)
   - Uploads files and JSON to IPFS
   - Retrieves content from IPFS by CID
   - Manages pinning

3. **BlockchainService** (`src/services/blockchainService.js`)
   - Interacts with SyntheticDataMarket contract
   - Submits datasets
   - Verifies submissions
   - Queries contract state

### Workflow

1. **Dataset Generation Flow**:
   ```
   Client Request → AI Model → Extract Metadata → Submit to Blockchain → Return Submission ID
   ```

2. **Quality Verification Flow**:
   ```
   Client Request → Get Submission → QA Verifier → Upload Report to IPFS → Submit Verification to Blockchain
   ```

3. **Complete Flow**:
   ```
   Request → Generate → Submit → Verify → Upload QA to IPFS → Finalize on Chain
   ```

## Integration with AI Model

When you receive your AI model endpoints, update the following:

1. Set the AI endpoint variables in `.env`:
  - `SAMPLE_SUBMISSION_ENDPOINT` (receives buyer sample data)
  - `AI_GENERATION_ENDPOINT` (generates synthetic dataset)
  - `QA_REPORT_ENDPOINT` (verifies dataset and returns QA report)
2. Update `aiModelService.js` if needed to match the model's API format
3. The generation service is expected to return a structure like:
```json
{
  "files": [...],
  "metadata": {
    "format": "AUDIO",
    "fileSize": 1024000,
    "sampleCount": 100,
    "fileExtensions": "wav,mp3"
  }
}
```

## Integration with Contract

After deploying the SyntheticDataMarket contract:

1. Copy contract address to `CONTRACT_ADDRESS` in `.env`
2. Copy ABI to `contracts/SyntheticDataMarket.json`
3. Ensure your wallet has enough ETH for gas fees

## Logging

Logs are written to:
- Console (with colors)
- `logs/combined.log` (all logs)
- `logs/error.log` (errors only)

Set `LOG_LEVEL` in `.env` to control verbosity: `error`, `warn`, `info`, `debug`

## Testing

For testing without AI model and QA endpoints, the service includes mock implementations:

```javascript
// In aiModelService.js
await aiModelService.mockGenerateDataset(requestParams);
await aiModelService.mockVerifyQuality(datasetInfo);
```

## Security Notes

- **Never commit `.env` file** - it contains private keys
- Use environment-specific `.env` files for dev/staging/prod
- Rotate private keys regularly
- Use separate wallets for testing and production
- Enable CORS only for trusted domains in production

## Troubleshooting

### IPFS Connection Issues
```bash
# Check if IPFS daemon is running
ipfs swarm peers

# Start IPFS daemon
ipfs daemon
```

### Blockchain Connection Issues
- Verify RPC URL is accessible
- Check wallet has sufficient ETH
- Confirm contract address is correct

### Transaction Failures
- Check gas settings in blockchainService.js
- Verify contract permissions (is wallet registered as model/verifier?)
- Review contract events for revert reasons

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Configure `.env` file
3. ⏳ Add contract ABI (after deployment)
4. ⏳ Update `SAMPLE_SUBMISSION_ENDPOINT`, `AI_GENERATION_ENDPOINT` and `QA_REPORT_ENDPOINT` (when provided)
6. ✅ Start server: `npm start`
7. ⏳ Test endpoints with Postman or curl

## Support

For issues or questions, check:
- Smart contract logs on blockchain explorer
- Backend logs in `logs/` directory
- IPFS gateway for uploaded reports

---

Built for the SyntheticDataMarket decentralized application.
