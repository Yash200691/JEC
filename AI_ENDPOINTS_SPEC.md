# 🤖 AI Model Endpoints Specification

This document outlines the **3 AI endpoints** required for the Synthetic Data Marketplace.

---

## 📋 Overview

The marketplace needs **3 separate endpoint URLs** from the AI engineering team:

1. **ENDPOINT 1**: Sample Submission - Receives buyer's sample data
2. **ENDPOINT 2**: Dataset Generation - Generates synthetic dataset
3. **ENDPOINT 3**: QA Report - Verifies quality and creates report

---

## 🔗 ENDPOINT 1: Sample Submission

### Purpose
Receives and processes buyer's sample data to understand requirements.

### Request
**Method**: `POST`  
**Headers**: 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <API_KEY>" // Optional, only if required
}
```

**Body**:
```json
{
  "requestId": 1,
  "sampleData": "buyer's sample data (text, base64, JSON, etc.)",
  "dataType": "audio|csv|image|text|video|mixed",
  "sampleCount": 100,
  "description": "What kind of synthetic data buyer needs"
}
```

### Response
```json
{
  "success": true,
  "message": "Sample data received and processed",
  "requestId": 1
}
```

### Notes
- This endpoint receives the buyer's sample data for analysis
- AI model should store/process this data for the generation step
- No dataset generation happens here - just acknowledgment

---

## 🎨 ENDPOINT 2: Dataset Generation

### Purpose
Generates synthetic dataset based on buyer's sample data.

### Request
**Method**: `POST`  
**Headers**: 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <API_KEY>" // Optional, only if required
}
```

**Body**:
```json
{
  "dataType": "audio|csv|image|text|video|mixed",
  "sampleCount": 100,
  "description": "Generate audio samples for speech recognition",
  "sampleData": "buyer's sample data to guide generation"
}
```

### Response
```json
{
  "dataset": [
    // Actual generated data samples
    // For CSV: Array of objects/rows
    // For images: Array of base64 encoded images
    // For audio: Array of base64 encoded audio files
    // For text: Array of text strings
  ],
  "metadata": {
    "format": 0,  // DataFormat enum: 0=CSV, 1=Image, 2=Audio, 3=Text, 4=Video, 5=Mixed
    "fileSize": 102400,  // Total size in bytes
    "sampleCount": 100,  // Number of samples generated
    "fileExtensions": "wav,mp3"  // Comma-separated file extensions
  }
}
```

### Data Format Enum
```
0 = CSV
1 = Image
2 = Audio
3 = Text
4 = Video
5 = Mixed
```

### Notes
- This is where the actual AI generation happens
- **Dataset is NOT uploaded to IPFS** - it's returned directly to frontend
- Response should include both the dataset and metadata
- Timeout: 5 minutes (300,000ms)

---

## ✅ ENDPOINT 3: QA Report Generation

### Purpose
Verifies dataset quality by comparing original sample with generated synthetic data.

### Request
**Method**: `POST`  
**Headers**: 
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <API_KEY>" // Optional, only if required
}
```

**Body**:
```json
{
  "datasetReference": "dataset_1_1234567890",
  "originalSampleData": "buyer's original sample data",
  "syntheticData": {
    // The generated dataset from ENDPOINT 2
  },
  "metadata": {
    "format": 0,
    "fileSize": 102400,
    "sampleCount": 100
  },
  "requestDescription": "Original request description"
}
```

### Response
```json
{
  "approved": true,  // Boolean: true if quality meets standards
  "qualityScore": 92,  // Integer 0-100: Overall quality score
  "report": {
    "summary": "Synthetic data quality verified: Score 92/100",
    "comparisonMetrics": {
      "similarity": 0.92,     // 0-1: How similar to original
      "consistency": 0.90,    // 0-1: Internal consistency
      "accuracy": 0.88,       // 0-1: Accuracy of generation
      "diversity": 0.85       // 0-1: Diversity of samples
    },
    "issues": [
      // Array of any quality issues found
    ],
    "recommendations": [
      "Synthetic data approved for use",
      "High similarity to original sample"
    ],
    "detailedAnalysis": {
      // Any additional analysis data
    }
  }
}
```

### Notes
- This endpoint performs AI-based quality verification
- Compares buyer's original sample with AI-generated synthetic data
- **Report is uploaded to IPFS** by backend (not by AI model)
- `approved` and `qualityScore` trigger smart contract escrow logic:
  - If `approved: true` AND `qualityScore >= 70` → Payment released
  - Otherwise → Funds held / dispute initiated
- Timeout: 3 minutes (180,000ms)

---

## 🔒 Authentication

API keys are **optional**. If your endpoints are public:
- Leave the `_API_KEY` environment variables empty
- No `Authorization` header will be sent

If your endpoints require authentication:
- Provide API keys to be added to `.env` file
- `Authorization: Bearer <API_KEY>` header will be included

---

## 🌐 Environment Variables to Configure

Once you provide the 3 endpoint URLs, they will be added to `backend/.env`:

```env
# ENDPOINT 1: Sample Submission
SAMPLE_SUBMISSION_ENDPOINT=https://your-ai-server.com/submit
SAMPLE_SUBMISSION_API_KEY=optional_key_here

# ENDPOINT 2: Dataset Generation  
AI_GENERATION_ENDPOINT=https://your-ai-server.com/generate
AI_GENERATION_API_KEY=optional_key_here

# ENDPOINT 3: QA Report
QA_REPORT_ENDPOINT=https://your-ai-server.com/verify
QA_REPORT_API_KEY=optional_key_here
```

---

## 📊 Complete Flow

```
1. Buyer creates request on blockchain
   ↓
2. Buyer submits sample data → ENDPOINT 1
   ↓
3. Backend calls ENDPOINT 2 → AI generates dataset
   ↓
4. Dataset displayed on frontend (NOT on IPFS)
   ↓
5. Backend calls ENDPOINT 3 → AI creates QA report
   ↓
6. QA report uploaded to IPFS
   ↓
7. Smart contract executes escrow logic based on quality
```

---

## 🧪 Testing Endpoints

You can test each endpoint individually:

### Test ENDPOINT 1
```bash
curl -X POST https://your-ai-server.com/submit \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": 1,
    "sampleData": "test sample",
    "dataType": "text",
    "sampleCount": 10,
    "description": "Test request"
  }'
```

### Test ENDPOINT 2
```bash
curl -X POST https://your-ai-server.com/generate \
  -H "Content-Type: application/json" \
  -d '{
    "dataType": "text",
    "sampleCount": 10,
    "description": "Generate test data",
    "sampleData": "test sample"
  }'
```

### Test ENDPOINT 3
```bash
curl -X POST https://your-ai-server.com/verify \
  -H "Content-Type: application/json" \
  -d '{
    "datasetReference": "dataset_1_123",
    "originalSampleData": "test sample",
    "syntheticData": ["generated", "samples"],
    "metadata": {
      "format": 3,
      "fileSize": 1024,
      "sampleCount": 10
    },
    "requestDescription": "Test"
  }'
```

---

## ✅ Checklist for AI Team

- [ ] Provide URL for ENDPOINT 1 (Sample Submission)
- [ ] Provide URL for ENDPOINT 2 (Dataset Generation)
- [ ] Provide URL for ENDPOINT 3 (QA Report)
- [ ] Specify if API keys are required (optional)
- [ ] Confirm response format matches specification
- [ ] Test endpoints are accessible
- [ ] Confirm timeout limits (5 min for generation, 3 min for QA)

---

**Once you provide these 3 URLs, the marketplace will be fully operational!** 🚀
