# 🔄 Synthetic Data Marketplace - Complete Workflow

## 📊 System Architecture

### Three Core Endpoints

#### 1️⃣ **ENDPOINT 1: Submit Request** (`POST /api/dataset/submit-request`)
**Purpose**: Buyer submits sample data for AI model to understand requirements

**Input:**
```json
{
  "requestId": 1,
  "sampleData": "buyer's sample data (text, base64, JSON, etc.)",
  "dataType": "audio|csv|image|text|video|mixed",
  "sampleCount": 100,
  "description": "What kind of data buyer needs"
}
```

**Output:**
```json
{
  "success": true,
  "message": "Sample data received. AI model will now generate synthetic dataset.",
  "data": {
    "requestId": 1,
    "status": "pending_generation"
  }
}
```

---

#### 2️⃣ **ENDPOINT 2: Generate Dataset** (`POST /api/dataset/generate`)
**Purpose**: AI Model generates synthetic dataset based on buyer's sample data

**Input:**
```json
{
  "requestId": 1,
  "dataType": "audio",
  "sampleCount": 100,
  "description": "Generate audio samples",
  "sampleData": "buyer's sample data"
}
```

**What Happens:**
1. AI Model analyzes buyer's sample data
2. AI Model generates synthetic dataset (NOT uploaded to IPFS)
3. Dataset metadata submitted to blockchain
4. **Dataset shown directly on frontend**

**Output:**
```json
{
  "success": true,
  "message": "AI Model successfully generated synthetic dataset",
  "data": {
    "submissionId": 1,
    "transactionHash": "0x...",
    "dataset": [...], // ACTUAL generated data to display
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

---

#### 3️⃣ **ENDPOINT 3: Get QA Report** (`POST /api/dataset/get-report`)
**Purpose**: AI Model verifies quality, generates report, uploads to IPFS, triggers escrow

**Input:**
```json
{
  "submissionId": 1,
  "requestId": 1,
  "datasetReference": "dataset_1_1234567890",
  "originalSampleData": "buyer's original sample"
}
```

**What Happens:**
1. AI Model compares original sample with generated synthetic data
2. AI Model generates QA report with quality scores
3. **QA report uploaded to IPFS** (NOT the dataset!)
4. CID stored on blockchain
5. **Smart contract executes escrow logic**:
   - If `approved: true` → Release payment
   - If `qualityScore >= 70` → Complete request
   - Otherwise → Dispute or rejection

**Output:**
```json
{
  "success": true,
  "message": "QA report generated, uploaded to IPFS, stored on blockchain. Escrow executed.",
  "data": {
    "approved": true,
    "qualityScore": 92,
    "qaReportCid": "QmXyz123...",
    "qaReport": {
      "summary": "AI Model verified synthetic data quality: Score 92/100",
      "comparisonMetrics": {
        "similarity": 0.92,
        "consistency": 0.90,
        "accuracy": 0.88
      },
      "issues": [],
      "recommendations": ["Synthetic data approved for use"]
    },
    "transactionHash": "0x...",
    "escrowStatus": "Payment Released"
  }
}
```

---

## 🔄 Complete User Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Buyer Creates Request                              │
├─────────────────────────────────────────────────────────────┤
│ Frontend → Blockchain → Create Request (#1)                 │
│ Buyer provides:                                              │
│  - Description                                               │
│  - Data type (audio/csv/image/text/video)                   │
│  - Sample count                                              │
│  - Optional: Sample data                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Submit Sample Data (Optional)                       │
├─────────────────────────────────────────────────────────────┤
│ Frontend → Backend → ENDPOINT 1                             │
│ Sample data sent to AI model for analysis                   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: AI Model Generates Synthetic Dataset               │
├─────────────────────────────────────────────────────────────┤
│ Frontend → Backend → ENDPOINT 2 → AI Model                  │
│ AI Model:                                                    │
│  1. Analyzes buyer's sample data                            │
│  2. Generates synthetic dataset                             │
│  3. Returns actual dataset (NOT uploaded to IPFS)           │
│                                                              │
│ Backend:                                                     │
│  1. Submits metadata to blockchain                          │
│  2. Returns dataset to frontend                             │
│                                                              │
│ Frontend:                                                    │
│  ✅ Dataset displayed directly to user                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: AI Model QA Verification                           │
├─────────────────────────────────────────────────────────────┤
│ Frontend → Backend → ENDPOINT 3 → AI Model                  │
│ AI Model:                                                    │
│  1. Compares original sample vs synthetic data              │
│  2. Generates QA report with metrics:                       │
│     - Similarity score                                       │
│     - Consistency score                                      │
│     - Accuracy score                                         │
│     - Quality score (0-100)                                  │
│  3. Determines if approved (true/false)                     │
│                                                              │
│ Backend:                                                     │
│  1. Uploads QA report to IPFS                               │
│  2. Gets CID from IPFS                                      │
│  3. Submits verification to blockchain (with CID)           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Smart Contract Escrow Logic                        │
├─────────────────────────────────────────────────────────────┤
│ Smart Contract receives:                                    │
│  - submissionId                                             │
│  - approved (true/false)                                    │
│  - qualityScore (0-100)                                     │
│  - qaReportCid (IPFS CID)                                   │
│                                                              │
│ Contract Logic:                                             │
│  IF approved == true AND qualityScore >= 70:                │
│    → Release escrow payment                                 │
│    → Mark request as Completed                              │
│    → Store QA report CID on-chain                           │
│  ELSE:                                                       │
│    → Mark as Disputed                                       │
│    → Hold escrow funds                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Buyer Views Results                                │
├─────────────────────────────────────────────────────────────┤
│ Frontend displays:                                           │
│  ✅ Generated dataset (from Step 3)                         │
│  ✅ QA report (fetched from IPFS using CID)                 │
│  ✅ Quality score and metrics                               │
│  ✅ Escrow status                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Key Points

### What Goes to IPFS?
- ✅ **ONLY QA Reports** (JSON with quality metrics)
- ❌ **NOT Datasets** (shown directly on frontend)

### What's Stored on Blockchain?
- ✅ Request metadata (description, formats, budget)
- ✅ Submission metadata (format, size, sample count, reference)
- ✅ **QA Report CID** (IPFS pointer)
- ✅ Quality score
- ✅ Approval status
- ❌ **NOT actual datasets or QA report content**

### AI Model Responsibilities
1. **Generate synthetic data** based on buyer's sample
2. **Compare original vs synthetic** for quality verification
3. **Generate QA report** with detailed metrics
4. **Determine approval status** for escrow logic

### Smart Contract Escrow Logic
- Triggered by `verifySubmission()` function
- Based on `approved` boolean and `qualityScore`
- Releases payment if quality meets threshold
- Stores QA report CID for transparency
- Provides dispute mechanism if quality is poor

---

## 📱 Frontend Pages

### 1. **Dashboard** (`/dashboard`)
- Create new requests
- View all requests
- Statistics (total, pending, completed)
- One-click workflow: Create → Generate → Verify

### 2. **Request Details** (`/request/:id`)
- View generated dataset
- Display QA report from IPFS
- Show quality metrics
- Display escrow status

### 3. **History** (`/history`)
- List all past requests
- Show QA scores
- Display completion status
- Quick access to details

---

## 🔐 Security & Transparency

### IPFS Benefits
- **Immutable**: QA reports can't be changed
- **Permanent**: Reports always available via CID
- **Verifiable**: Anyone can verify using CID
- **Decentralized**: No single point of failure

### Blockchain Benefits
- **Transparent**: All transactions public
- **Secure**: Escrow logic enforced by code
- **Trustless**: No need to trust intermediaries
- **Auditable**: Complete history on-chain

---

## 🚀 Testing the Workflow

### Manual Test Flow:

1. **Connect Wallet** to Sepolia testnet
2. **Create Request**:
   - Description: "Generate 50 CSV rows of customer data"
   - Data Type: CSV
   - Sample Count: 50
   - Sample Data: (optional)
3. **Wait for Generation** (~2-3 seconds with mock)
4. **View Dataset** on request details page
5. **Check QA Report** fetched from IPFS
6. **Verify Escrow** status updated

### Expected Results:
- ✅ Dataset displayed on frontend
- ✅ QA report shows quality score 75-95
- ✅ Escrow status: "Payment Released"
- ✅ Request marked as Completed

---

**Built with precision for transparent, AI-powered synthetic data generation!** 🎉
