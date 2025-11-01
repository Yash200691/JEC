# Synthetic Data Market - Testing Guide

## ✅ Connection Verification

All project connections have been verified:
- ✅ Backend .env configured with Sepolia RPC and contract address
- ✅ Frontend .env configured with contract address and API URL
- ✅ Contract ABI available (42 functions/events)
- ✅ Contract addresses match across backend and frontend
- ✅ Deployment info found (deployed to Sepolia)

**Contract Address:** `0xBaa43904BaBEde633760DCdf4e186c0a2C3FB304`
**Network:** Sepolia Testnet (Chain ID: 11155111)

---

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd backend
npm start
```
**Expected Output:**
- ✅ Server running on port 3000
- ✅ Blockchain service initialized
- ✅ Connected to Sepolia network
- ✅ Contract loaded at 0xBaa43904...

### 2. Start Frontend Application
```bash
cd frontend
npm run dev
```
**Expected Output:**
- ✅ Vite dev server running
- ✅ Local: http://localhost:5173
- ✅ Ready in [time]ms

### 3. Open Application
Navigate to: `http://localhost:5173`

---

## 🔐 Wallet Connection Workflow (Primary Focus)

### Step 1: Connect MetaMask Wallet

1. **Click "Connect Wallet" button** on the navbar
2. **MetaMask popup appears**
   - Select account
   - Click "Next" → "Connect"
3. **Verify Network**
   - Should be on **Sepolia Testnet**
   - If not, MetaMask will prompt to switch
   - Chain ID must be **11155111**

**Expected Result:**
- ✅ Wallet address displayed in navbar (0xAbC...1234)
- ✅ Green "Connected" status
- ✅ Account balance shown (if available)

### Step 2: Get Sepolia Test ETH (if needed)

If you don't have Sepolia ETH:
1. Visit: https://sepoliafaucet.com/
2. Or: https://www.alchemy.com/faucets/ethereum-sepolia
3. Enter your wallet address
4. Request test ETH

**Minimum Required:** ~0.05 ETH for testing requests

---

## 📝 Request Creation Workflow (Secondary Focus)

### Step 1: Navigate to Buyer Dashboard

1. After wallet connected, click **"Buyer Dashboard"** in navbar
2. You'll see:
   - Your active requests
   - "Create New Request" button

### Step 2: Create a Data Request

1. Click **"Create New Request"**
2. Fill in the form:

   **Required Fields:**
   - **Description:** "Need synthetic customer data for ML model"
   - **Budget:** 0.1 (in ETH)
   - **Sample Count:** 10000
   
   **Data Formats (select one or more):**
   - [ ] CSV
   - [ ] JSON
   - [ ] Parquet
   - [ ] XML
   
   **Quality Criteria:**
   - **Min Accuracy:** 85 (%)
   - **Min Completeness:** 90 (%)
   - **Min Consistency:** 80 (%)

3. Click **"Submit Request"**

### Step 3: Confirm Transaction

1. **MetaMask popup appears**
   - Review transaction details
   - Gas fee estimate shown
   - Click **"Confirm"**

2. **Wait for confirmation**
   - Transaction submitted
   - Waiting for blockchain confirmation (5 blocks)
   - "Processing..." toast notification

3. **Success!**
   - ✅ Request created
   - ✅ Funds escrowed in smart contract
   - ✅ Request appears in your dashboard

**Expected Result:**
- Request ID: #1 (or next number)
- Status: "Open"
- Budget locked in escrow
- Visible to sellers in Seller Dashboard

---

## 🔍 Verification Checklist

### Frontend → Wallet Connection
- [ ] MetaMask extension installed
- [ ] Connected to Sepolia testnet
- [ ] Wallet address displayed in navbar
- [ ] Can disconnect and reconnect wallet
- [ ] Network switch prompt works correctly

### Frontend → Smart Contract
- [ ] Contract address matches: `0xBaa43904BaBEde633760DCdf4e186c0a2C3FB304`
- [ ] Can read contract data (request count)
- [ ] Can send transactions (create request)
- [ ] Transaction confirmations received
- [ ] Events emitted and detected

### Frontend → Backend API
- [ ] Backend running on http://localhost:3000
- [ ] Frontend can call `/api/dataset/generate`
- [ ] Frontend can call `/api/dataset/verify-quality`
- [ ] API responses received correctly
- [ ] Error handling works

### Backend → Blockchain
- [ ] Connected to Alchemy RPC (Sepolia)
- [ ] Can read contract state
- [ ] Can listen for events
- [ ] Transaction signing works
- [ ] Gas estimation working

### Backend → IPFS
- [ ] IPFS daemon running (127.0.0.1:5001)
- [ ] Can upload QA reports
- [ ] Receives CID after upload
- [ ] Can retrieve uploaded files

### Complete Workflow Test
- [ ] Connect wallet to Sepolia
- [ ] Create data request with 0.1 ETH budget
- [ ] Request appears in blockchain (check Etherscan)
- [ ] Seller can see request in Seller Dashboard
- [ ] Backend can generate dataset (AI endpoint)
- [ ] Backend uploads QA report to IPFS
- [ ] Seller submits dataset with IPFS CID
- [ ] Buyer can view QA report from IPFS
- [ ] Buyer can approve submission
- [ ] Funds released to seller

---

## 🔧 Troubleshooting

### MetaMask Not Detecting

**Problem:** "Connect Wallet" doesn't trigger MetaMask

**Solutions:**
1. Check MetaMask is installed: chrome://extensions
2. Refresh the page (F5)
3. Check browser console for errors (F12)
4. Try disconnecting from all sites in MetaMask settings

### Wrong Network

**Problem:** Connected to wrong network (Mainnet, Goerli, etc.)

**Solutions:**
1. Click network dropdown in MetaMask
2. Select "Sepolia Test Network"
3. If not visible, enable "Show test networks" in MetaMask settings

### Transaction Fails

**Problem:** Transaction reverts or fails

**Possible Causes:**
- Insufficient ETH for gas fees
- Invalid input data (budget too low, sample count = 0)
- Contract requirements not met
- Network congestion

**Solutions:**
1. Check wallet balance (need > 0.01 ETH for gas)
2. Verify all required fields filled correctly
3. Check gas price settings in MetaMask
4. Try again after a few minutes

### Backend Connection Error

**Problem:** "Cannot connect to backend API"

**Solutions:**
1. Verify backend is running: `npm start` in backend folder
2. Check port 3000 is available: `netstat -ano | findstr :3000`
3. Verify CORS enabled in backend
4. Check `.env` file has correct configuration

### IPFS Upload Fails

**Problem:** "Failed to upload QA report"

**Solutions:**
1. Check IPFS daemon running: `ipfs daemon` or Kubo Desktop
2. Verify IPFS_HOST and IPFS_PORT in backend `.env`
3. Test IPFS connection: `curl http://127.0.0.1:5001/api/v0/version`
4. Check firewall not blocking port 5001

---

## 📊 Testing Scenarios

### Scenario 1: Happy Path (End-to-End)
1. Buyer connects wallet
2. Buyer creates request (0.1 ETH, CSV format, 10k samples)
3. Backend generates synthetic dataset
4. Backend runs QA verification
5. Backend uploads QA report to IPFS
6. Seller submits dataset with CID
7. Buyer reviews QA report
8. Buyer approves submission
9. Funds released to seller
10. Buyer downloads dataset

**Expected Time:** ~5-10 minutes

### Scenario 2: Multiple Requests
1. Create 3 different requests with different formats
2. Verify all appear in dashboard
3. Check request IDs increment correctly
4. Verify escrow for each

### Scenario 3: Rejection Flow
1. Create request
2. Seller submits poor quality dataset
3. QA score < minimum threshold
4. Buyer rejects submission
5. Seller tries again
6. Better quality dataset
7. Buyer approves

### Scenario 4: Concurrent Users
1. Connect two different wallets
2. One as buyer, one as seller
3. Buyer creates request
4. Seller sees request immediately
5. Seller submits dataset
6. Buyer sees submission

---

## 📈 Success Metrics

### Wallet Connection
- ✅ Connection time < 3 seconds
- ✅ Network detection automatic
- ✅ Account changes detected
- ✅ Disconnect/reconnect seamless

### Request Creation
- ✅ Form validation works
- ✅ Transaction confirmation < 2 minutes
- ✅ Request visible in dashboard immediately
- ✅ Escrow confirmed on blockchain

### Data Submission
- ✅ AI generation < 30 seconds
- ✅ QA verification < 10 seconds
- ✅ IPFS upload < 5 seconds
- ✅ Blockchain submission < 2 minutes

### Overall UX
- ✅ No errors in console
- ✅ Loading states shown
- ✅ Error messages clear and helpful
- ✅ Transactions transparent (Etherscan links)

---

## 🎯 Core Focus Areas (User Priority)

### 1. Wallet Connection (MUST WORK)
- This is the entry point for all users
- Without wallet connection, nothing else works
- Test thoroughly with different scenarios

### 2. Request Creation (MUST WORK)
- Primary user action for buyers
- Funds must be escrowed correctly
- Form validation critical

### 3. Everything Else (SECONDARY)
- Dashboard views
- QA report display
- Dataset downloads
- Seller submissions

---

## 📝 Test Checklist Summary

**Before Testing:**
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] MetaMask installed with Sepolia ETH
- [ ] IPFS daemon running
- [ ] Backend server started
- [ ] Frontend dev server started

**Core Tests (Priority 1):**
- [ ] Wallet connects to Sepolia
- [ ] Create request transaction succeeds
- [ ] Request appears in dashboard
- [ ] Escrow funds locked in contract

**Extended Tests (Priority 2):**
- [ ] Backend generates dataset
- [ ] QA verification runs
- [ ] IPFS upload works
- [ ] Seller can submit
- [ ] Buyer can approve/reject

**Integration Tests (Priority 3):**
- [ ] Multiple concurrent users
- [ ] Network switching
- [ ] Transaction failure recovery
- [ ] IPFS gateway failover

---

## 🚨 Known Limitations

1. **Local IPFS Required:** Backend needs local IPFS node
2. **Sepolia Only:** Contract deployed only to Sepolia testnet
3. **MetaMask Required:** No support for other wallets yet
4. **Gas Costs:** Test ETH needed for all transactions
5. **AI Endpoint:** Mock endpoint - replace with real AI service

---

## 📞 Support

**Contract on Etherscan:**
https://sepolia.etherscan.io/address/0xBaa43904BaBEde633760DCdf4e186c0a2C3FB304

**Get Sepolia ETH:**
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia

**IPFS Documentation:**
https://docs.ipfs.tech/

**MetaMask Support:**
https://support.metamask.io/

---

*Last Updated: January 11, 2025*
*Contract Version: 1.0.0*
*Network: Sepolia Testnet*
