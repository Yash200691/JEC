import express from 'express';
import aiModelService from '../services/aiModelService.js';
import ipfsService from '../services/ipfsService.js';
import blockchainService from '../services/blockchainService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * POST /api/dataset/generate
 * Generate a synthetic dataset based on request parameters
 * 
 * Body:
 * {
 *   "requestId": 1,
 *   "dataType": "audio",
 *   "sampleCount": 100,
 *   "description": "Generate audio samples for speech recognition",
 *   "additionalParams": {}
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { requestId, dataType, sampleCount, description, additionalParams } = req.body;

    // Validate input
    if (!requestId || !dataType || !sampleCount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: requestId, dataType, sampleCount',
      });
    }

    logger.info(`Received dataset generation request for requestId: ${requestId}`);

    // Step 1: Call AI model endpoint to generate dataset
    const generationResult = await aiModelService.generateDataset({
      dataType,
      sampleCount,
      description,
      additionalParams,
    });

    if (!generationResult.success) {
      throw new Error('Dataset generation failed');
    }

    // Step 2: Extract metadata from generated dataset
    const { metadata } = generationResult.data;

    // Step 3: Generate dataset reference
    // IMPORTANT: We do NOT upload the dataset to IPFS. The dataset should be stored
    // off-chain (S3, seller's server, encrypted storage, etc.) and only the reference
    // (URL, encrypted ID, or access key) is stored on-chain.
    const datasetReference = `dataset_${requestId}_${Date.now()}`;
    // In production, this should be a real download URL or encrypted reference

    // Step 4: Submit dataset metadata to blockchain (NOT the dataset itself)
    const submitResult = await blockchainService.submitDataset(
      requestId,
      metadata.format,
      metadata.fileSize,
      metadata.sampleCount,
      metadata.fileExtensions,
      datasetReference,
      null // modelAddress defaults to wallet address
    );

    res.json({
      success: true,
      message: 'Dataset generated and submitted to blockchain',
      data: {
        submissionId: submitResult.submissionId,
        transactionHash: submitResult.transactionHash,
        datasetReference,
        metadata,
      },
    });
  } catch (error) {
    logger.error('Error in dataset generation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dataset/verify
 * Verify dataset quality and submit QA report to blockchain
 * 
 * Body:
 * {
 *   "submissionId": 1,
 *   "datasetReference": "dataset_123_456",
 *   "requestDescription": "Original request description"
 * }
 */
router.post('/verify', async (req, res) => {
  try {
    const { submissionId, datasetReference, requestDescription } = req.body;

    // Validate input
    if (!submissionId || !datasetReference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: submissionId, datasetReference',
      });
    }

    logger.info(`Received quality verification request for submissionId: ${submissionId}`);

    // Step 1: Get submission details from blockchain
    const submission = await blockchainService.getSubmission(submissionId);

    // Step 2: Verify dataset quality using QA service
    const qaResult = await aiModelService.verifyQuality({
      datasetReference,
      metadata: {
        format: submission.format,
        fileSize: submission.fileSize,
        sampleCount: submission.sampleCount,
      },
      requestDescription,
    });

    // Step 3: Upload ONLY the QA report to IPFS (NOT the dataset)
    // The QA report contains quality scores, metrics, and verification results
    const qaReportCid = await ipfsService.uploadQAReport(qaResult.report);

    logger.info(`QA report uploaded to IPFS: ${qaReportCid}`);

    // Step 4: Submit verification result to blockchain
    const verifyResult = await blockchainService.verifySubmission(
      submissionId,
      qaResult.approved,
      qaResult.qualityScore,
      qaReportCid
    );

    res.json({
      success: true,
      message: 'Quality verification completed and submitted to blockchain',
      data: {
        approved: qaResult.approved,
        qualityScore: qaResult.qualityScore,
        qaReportCid,
        transactionHash: verifyResult.transactionHash,
      },
    });
  } catch (error) {
    logger.error('Error in dataset verification:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/dataset/generate-and-verify
 * Complete workflow: Generate dataset, submit to blockchain, verify quality, and finalize
 * 
 * Body:
 * {
 *   "requestId": 1,
 *   "dataType": "audio",
 *   "sampleCount": 100,
 *   "description": "Generate audio samples",
 *   "autoVerify": true
 * }
 */
router.post('/generate-and-verify', async (req, res) => {
  try {
    const { requestId, dataType, sampleCount, description, additionalParams, autoVerify } = req.body;

    // Validate input
    if (!requestId || !dataType || !sampleCount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: requestId, dataType, sampleCount',
      });
    }

    logger.info(`Starting complete workflow for requestId: ${requestId}`);

    // Step 1: Generate dataset
    logger.info('Step 1: Generating dataset...');
    const generationResult = await aiModelService.generateDataset({
      dataType,
      sampleCount,
      description,
      additionalParams,
    });

    const { metadata } = generationResult.data;
    // Dataset reference is NOT uploaded to IPFS - it's stored off-chain
    const datasetReference = `dataset_${requestId}_${Date.now()}`;

    // Step 2: Submit metadata to blockchain (NOT dataset files)
    logger.info('Step 2: Submitting to blockchain...');
    const submitResult = await blockchainService.submitDataset(
      requestId,
      metadata.format,
      metadata.fileSize,
      metadata.sampleCount,
      metadata.fileExtensions,
      datasetReference,
      null
    );

    const submissionId = submitResult.submissionId;

    // Step 3: Verify quality (if autoVerify is true)
    let qaReportCid = null;
    let verifyResult = null;
    let qaResult = null;

    if (autoVerify) {
      logger.info('Step 3: Verifying quality...');
      qaResult = await aiModelService.verifyQuality({
        datasetReference,
        metadata,
        requestDescription: description,
      });

      // Step 4: Upload QA report to IPFS
      logger.info('Step 4: Uploading QA report to IPFS (NOT the dataset)...');
      qaReportCid = await ipfsService.uploadQAReport(qaResult.report);

      // Step 5: Submit verification to blockchain
      logger.info('Step 5: Submitting verification to blockchain...');
      verifyResult = await blockchainService.verifySubmission(
        submissionId,
        qaResult.approved,
        qaResult.qualityScore,
        qaReportCid
      );
    }

    res.json({
      success: true,
      message: autoVerify ? 'Dataset generated, verified, and finalized' : 'Dataset generated and submitted',
      data: {
        submissionId,
        submitTransactionHash: submitResult.transactionHash,
        datasetReference,
        metadata,
        verification: autoVerify ? {
          approved: qaResult.approved,
          qualityScore: qaResult.qualityScore,
          qaReportCid,
          verifyTransactionHash: verifyResult.transactionHash,
        } : null,
      },
    });
  } catch (error) {
    logger.error('Error in complete workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dataset/request/:requestId
 * Get request details from blockchain
 */
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await blockchainService.getRequest(requestId);
    
    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    logger.error('Error getting request:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dataset/submission/:submissionId
 * Get submission details from blockchain
 */
router.get('/submission/:submissionId', async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await blockchainService.getSubmission(submissionId);
    
    res.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    logger.error('Error getting submission:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dataset/qa-report/:cid
 * Retrieve QA report from IPFS
 */
router.get('/qa-report/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    const qaReport = await ipfsService.getJSON(cid);
    
    res.json({
      success: true,
      data: qaReport,
    });
  } catch (error) {
    logger.error('Error retrieving QA report:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
