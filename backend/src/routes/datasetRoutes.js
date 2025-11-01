import express from 'express';
import aiModelService from '../services/aiModelService.js';
import ipfsService from '../services/ipfsService.js';
import blockchainService from '../services/blockchainService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * ENDPOINT 1: POST /api/dataset/submit-request
 * Buyer submits their sample data to AI model for processing
 * AI model receives and acknowledges the sample data
 * 
 * Body:
 * {
 *   "requestId": 1,
 *   "sampleData": "base64_encoded_data or text or JSON",
 *   "dataType": "audio",
 *   "sampleCount": 100,
 *   "description": "Generate audio samples for speech recognition"
 * }
 */
router.post('/submit-request', async (req, res) => {
  try {
    const { requestId, sampleData, dataType, sampleCount, description } = req.body;

    // Validate input
    if (!requestId || !dataType || !sampleCount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: requestId, dataType, sampleCount',
      });
    }

    logger.info(`Buyer submitted request data for requestId: ${requestId}`);

      // Forward the sample data to the AI team's sample submission endpoint (if configured)
      try {
        const aiAck = await aiModelService.submitSampleData({
          requestId,
          sampleData,
          dataType,
          sampleCount,
          description,
        });
        res.json({
          success: true,
          message: 'Sample data received and forwarded to AI model.',
          data: {
            requestId,
            status: 'pending_generation',
            submittedAt: new Date().toISOString(),
            aiAcknowledgement: aiAck.data || aiAck,
          },
        });
      } catch (err) {
        logger.error('Failed to forward sample to AI model:', err.message);
        // Still respond success for submission receipt but include AI forwarding failure
        res.status(502).json({
          success: false,
          error: 'Failed to forward sample data to AI model',
          details: err.message,
        });
      }
  } catch (error) {
    logger.error('Error submitting request data:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ENDPOINT 2: POST /api/dataset/generate
 * AI Model generates synthetic dataset based on buyer's sample data
 * Returns the generated dataset output
 * 
 * Body:
 * {
 *   "requestId": 1,
 *   "dataType": "audio",
 *   "sampleCount": 100,
 *   "description": "Generate audio samples",
 *   "sampleData": "buyer's sample data"
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { requestId, dataType, sampleCount, description, sampleData } = req.body;

    // Validate input
    if (!requestId || !dataType || !sampleCount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: requestId, dataType, sampleCount',
      });
    }

    logger.info(`AI Model generating dataset for requestId: ${requestId}`);

    // Step 1: AI Model analyzes buyer's sample data and generates synthetic dataset
    const generationResult = await aiModelService.generateDataset({
      dataType,
      sampleCount,
      description,
      sampleData, // Buyer's sample data to guide generation
    });

    if (!generationResult.success) {
      throw new Error('AI Model failed to generate dataset');
    }

    // Step 2: Extract generated dataset and metadata
    const { dataset, metadata } = generationResult.data;

    // Step 3: Create dataset reference (NOT uploaded to IPFS)
    // Dataset is shown directly on frontend or stored off-chain
    const datasetReference = `dataset_${requestId}_${Date.now()}`;

    // Step 4: Submit metadata to blockchain
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
      message: 'AI Model successfully generated synthetic dataset',
      data: {
        submissionId: submitResult.submissionId,
        transactionHash: submitResult.transactionHash,
        dataset, // The actual generated dataset to display on frontend
        datasetReference,
        metadata,
      },
    });
  } catch (error) {
    logger.error('Error in AI dataset generation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * ENDPOINT 3: POST /api/dataset/get-report
 * AI Model verifies dataset quality and generates QA report
 * QA report is uploaded to IPFS and CID is stored on blockchain
 * Based on the report, escrow logic of the contract works
 * 
 * Body:
 * {
 *   "submissionId": 1,
 *   "requestId": 1,
 *   "datasetReference": "dataset_123_456",
 *   "originalSampleData": "buyer's original sample data"
 * }
 */
router.post('/get-report', async (req, res) => {
  try {
    const { submissionId, requestId, datasetReference, originalSampleData } = req.body;

    // Validate input
    if (!submissionId || !requestId || !datasetReference) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: submissionId, requestId, datasetReference',
      });
    }

    logger.info(`AI Model generating QA report for submissionId: ${submissionId}`);

    // Step 1: Get submission details from blockchain
    const submission = await blockchainService.getSubmission(submissionId);
    const request = await blockchainService.getRequest(requestId);

    // Step 2: AI Model compares original sample data with generated synthetic data
    // This is where the ACTUAL AI MODEL quality verification happens
    const qaResult = await aiModelService.verifyQuality({
      datasetReference,
      originalSampleData, // Buyer's original sample data
      syntheticData: submission, // Generated synthetic data
      metadata: {
        format: submission.format,
        fileSize: submission.fileSize,
        sampleCount: submission.sampleCount,
      },
      requestDescription: request.description,
    });

    // Step 3: Upload QA report to IPFS (ONLY the report, NOT the dataset)
    // This report contains quality metrics, comparison results, recommendations
    logger.info('Uploading QA report to IPFS...');
    const qaReportCid = await ipfsService.uploadQAReport(qaResult.report);
    logger.info(`QA report uploaded to IPFS with CID: ${qaReportCid}`);

    // Step 4: Submit verification to blockchain with QA report CID
    // IMPORTANT: Based on qualityScore and approved status, the smart contract
    // will execute escrow logic (release funds, dispute, etc.)
    logger.info('Submitting verification to blockchain (triggers escrow logic)...');
    const verifyResult = await blockchainService.verifySubmission(
      submissionId,
      qaResult.approved, // If true, escrow releases payment
      qaResult.qualityScore, // Quality threshold for escrow
      qaReportCid // Stored on-chain for transparency
    );

    res.json({
      success: true,
      message: 'QA report generated, uploaded to IPFS, and stored on blockchain. Escrow logic executed.',
      data: {
        approved: qaResult.approved,
        qualityScore: qaResult.qualityScore,
        qaReportCid, // Use this to fetch report from IPFS
        qaReport: qaResult.report, // Full report details
        transactionHash: verifyResult.transactionHash,
        escrowStatus: qaResult.approved ? 'Payment Released' : 'Pending Review',
      },
    });
  } catch (error) {
    logger.error('Error generating QA report:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/dataset/history/:buyerAddress
 * Get buyer's request history with results
 */
router.get('/history/:buyerAddress', async (req, res) => {
  try {
    const { buyerAddress } = req.params;
    
    logger.info(`Fetching history for buyer: ${buyerAddress}`);

    // Get all requests by buyer
    const requestIds = await blockchainService.getBuyerRequests(buyerAddress);
    
    // Fetch details for each request including submissions and QA reports
    const history = await Promise.all(
      requestIds.map(async (requestId) => {
        const request = await blockchainService.getRequest(requestId);
        
        // Get submission if finalized
        let submission = null;
        let qaReport = null;
        
        if (request.finalizedSubmissionId && request.finalizedSubmissionId !== '0') {
          try {
            submission = await blockchainService.getSubmission(request.finalizedSubmissionId);
            
            // Fetch QA report from IPFS if CID exists
            if (request.qualityReportCid && request.qualityReportCid !== '') {
              try {
                qaReport = await ipfsService.getJSON(request.qualityReportCid);
              } catch (error) {
                logger.warn(`Could not fetch QA report for request ${requestId}:`, error.message);
              }
            }
          } catch (error) {
            logger.warn(`Could not fetch submission for request ${requestId}:`, error.message);
          }
        }
        
        return {
          requestId: request.id,
          description: request.description,
          status: request.status,
          createdAt: request.createdAt,
          qualityScore: request.qualityScore,
          submission: submission ? {
            submissionId: submission.id,
            datasetReference: submission.datasetReference,
            format: submission.format,
            fileSize: submission.fileSize,
            sampleCount: submission.sampleCount,
          } : null,
          qaReport,
          qaReportCid: request.qualityReportCid,
        };
      })
    );

    res.json({
      success: true,
      data: {
        buyerAddress,
        totalRequests: history.length,
        requests: history,
      },
    });
  } catch (error) {
    logger.error('Error fetching buyer history:', error);
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
