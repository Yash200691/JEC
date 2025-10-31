import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Blockchain Service
 * Handles all interactions with the SyntheticDataMarket smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.contractAddress = null;
    this.initialize();
  }

  /**
   * Initialize blockchain connection and contract instance
   */
  async initialize() {
    try {
      // Initialize provider
      const rpcUrl = process.env.ETHEREUM_RPC_URL;
      if (!rpcUrl) {
        throw new Error('ETHEREUM_RPC_URL not set in environment');
      }
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Initialize wallet
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY not set in environment');
      }
      this.wallet = new ethers.Wallet(privateKey, this.provider);

      // Load contract ABI
      const abiPath = process.env.CONTRACT_ABI_PATH || './contracts/SyntheticDataMarket.json';
      const contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      const abi = contractData.abi || contractData;

      // Initialize contract
      this.contractAddress = process.env.CONTRACT_ADDRESS;
      if (!this.contractAddress || this.contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('CONTRACT_ADDRESS not properly set in environment');
      }
      
      this.contract = new ethers.Contract(this.contractAddress, abi, this.wallet);

      logger.info(`Blockchain service initialized`);
      logger.info(`Wallet address: ${this.wallet.address}`);
      logger.info(`Contract address: ${this.contractAddress}`);

      // Check wallet balance
      const balance = await this.provider.getBalance(this.wallet.address);
      logger.info(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
      logger.error('Failed to initialize blockchain service:', error);
      throw error;
    }
  }

  /**
   * Submit a dataset to the smart contract
   * @param {number} requestId - Request ID
   * @param {number} format - DataFormat enum value (0-5)
   * @param {number} fileSize - File size in bytes
   * @param {number} sampleCount - Number of samples
   * @param {string} fileExtensions - Comma-separated file extensions
   * @param {string} datasetReference - Optional dataset reference
   * @param {string} modelAddress - Model address (optional, defaults to wallet address)
   * @returns {Promise<Object>} - Transaction receipt and submission ID
   */
  async submitDataset(requestId, format, fileSize, sampleCount, fileExtensions, datasetReference, modelAddress = null) {
    try {
      logger.info(`Submitting dataset for request ${requestId}`);

      const model = modelAddress || this.wallet.address;

      const tx = await this.contract.submitDataset(
        requestId,
        format,
        fileSize,
        sampleCount,
        fileExtensions,
        datasetReference,
        model
      );

      logger.info(`Transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      logger.info(`Transaction confirmed: ${receipt.hash}`);

      // Parse events to get submission ID
      const event = receipt.logs
        .map(log => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find(e => e && e.name === 'SubmissionSubmitted');

      const submissionId = event ? event.args.submissionId.toString() : null;

      return {
        success: true,
        transactionHash: receipt.hash,
        submissionId,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Failed to submit dataset:', error);
      throw error;
    }
  }

  /**
   * Verify a submission and upload QA report CID
   * @param {number} submissionId - Submission ID
   * @param {boolean} approved - Whether to approve or reject
   * @param {number} qualityScore - Quality score (0-100)
   * @param {string} qualityReportCid - IPFS CID of the QA report
   * @returns {Promise<Object>} - Transaction receipt
   */
  async verifySubmission(submissionId, approved, qualityScore, qualityReportCid) {
    try {
      logger.info(`Verifying submission ${submissionId}: ${approved ? 'APPROVED' : 'REJECTED'}, score: ${qualityScore}`);

      const tx = await this.contract.verifySubmission(
        submissionId,
        approved,
        qualityScore,
        qualityReportCid
      );

      logger.info(`Verification transaction sent: ${tx.hash}`);
      const receipt = await tx.wait();
      logger.info(`Verification transaction confirmed: ${receipt.hash}`);

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Failed to verify submission:', error);
      throw error;
    }
  }

  /**
   * Get request details
   * @param {number} requestId - Request ID
   * @returns {Promise<Object>} - Request details
   */
  async getRequest(requestId) {
    try {
      const request = await this.contract.requests(requestId);
      
      return {
        id: request.id.toString(),
        buyer: request.buyer,
        budget: ethers.formatEther(request.budget),
        formatsMask: request.formatsMask,
        description: request.description,
        status: request.status, // 0 = OPEN, 1 = CLOSED
        qualityScore: request.qualityScore,
        qualityReportCid: request.qualityReportCid,
        finalizedSubmissionId: request.finalizedSubmissionId.toString(),
        createdAt: new Date(Number(request.createdAt) * 1000).toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get request ${requestId}:`, error);
      throw error;
    }
  }

  /**
   * Get submission details
   * @param {number} submissionId - Submission ID
   * @returns {Promise<Object>} - Submission details
   */
  async getSubmission(submissionId) {
    try {
      const submission = await this.contract.submissions(submissionId);
      
      return {
        id: submission.id.toString(),
        requestId: submission.requestId.toString(),
        seller: submission.seller,
        model: submission.model,
        format: submission.format,
        fileSize: submission.fileSize.toString(),
        sampleCount: submission.sampleCount.toString(),
        fileExtensions: submission.fileExtensions,
        datasetReference: submission.datasetReference,
        status: submission.status, // 0 = PENDING, 1 = APPROVED, 2 = REJECTED, 3 = PAID, 4 = REFUNDED
        qualityChecked: submission.qualityChecked,
        createdAt: new Date(Number(submission.createdAt) * 1000).toISOString(),
      };
    } catch (error) {
      logger.error(`Failed to get submission ${submissionId}:`, error);
      throw error;
    }
  }

  /**
   * Get buyer's requests
   * @param {string} buyerAddress - Buyer address
   * @returns {Promise<Array>} - Array of request IDs
   */
  async getBuyerRequests(buyerAddress) {
    try {
      const requestIds = await this.contract.getBuyerRequests(buyerAddress);
      return requestIds.map(id => id.toString());
    } catch (error) {
      logger.error(`Failed to get buyer requests for ${buyerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Get seller's submissions
   * @param {string} sellerAddress - Seller address
   * @returns {Promise<Array>} - Array of submission IDs
   */
  async getSellerSubmissions(sellerAddress) {
    try {
      const submissionIds = await this.contract.getSellerSubmissions(sellerAddress);
      return submissionIds.map(id => id.toString());
    } catch (error) {
      logger.error(`Failed to get seller submissions for ${sellerAddress}:`, error);
      throw error;
    }
  }

  /**
   * Listen to contract events
   * @param {string} eventName - Event name to listen to
   * @param {Function} callback - Callback function
   */
  listenToEvent(eventName, callback) {
    this.contract.on(eventName, (...args) => {
      logger.info(`Event ${eventName} received`);
      callback(...args);
    });
  }

  /**
   * Stop listening to an event
   * @param {string} eventName - Event name
   */
  removeEventListener(eventName) {
    this.contract.off(eventName);
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
