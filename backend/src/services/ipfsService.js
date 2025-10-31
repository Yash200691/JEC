import { create } from 'kubo-rpc-client';
import fs from 'fs';
import path from 'path';
import logger from '../utils/logger.js';

/**
 * IPFS Service
 * Handles uploading ONLY QA reports to IPFS
 * 
 * IMPORTANT: Datasets are NOT uploaded to IPFS. Only quality assurance reports
 * are stored on IPFS to ensure transparency and immutability of verification results.
 * Actual datasets should be stored off-chain (S3, seller servers, encrypted storage).
 */
class IPFSService {
  constructor() {
    this.client = null;
    this.initialize();
  }

  /**
   * Initialize IPFS client
   */
  initialize() {
    try {
      const ipfsHost = process.env.IPFS_HOST || '127.0.0.1';
      const ipfsPort = process.env.IPFS_PORT || '5001';
      const ipfsProtocol = process.env.IPFS_PROTOCOL || 'http';

      this.client = create({
        host: ipfsHost,
        port: ipfsPort,
        protocol: ipfsProtocol,
      });

      logger.info(`IPFS client initialized: ${ipfsProtocol}://${ipfsHost}:${ipfsPort}`);
    } catch (error) {
      logger.error('Failed to initialize IPFS client:', error);
      throw error;
    }
  }

  /**
   * Upload a file to IPFS
   * @param {Buffer|string} fileContent - File content or path to file
   * @param {string} fileName - Optional file name
   * @returns {Promise<string>} - IPFS CID
   */
  async uploadFile(fileContent, fileName = null) {
    try {
      let content;

      // If fileContent is a file path, read it
      if (typeof fileContent === 'string' && fs.existsSync(fileContent)) {
        content = fs.readFileSync(fileContent);
        fileName = fileName || path.basename(fileContent);
      } else {
        content = fileContent;
      }

      const result = await this.client.add(content, {
        pin: true,
        wrapWithDirectory: false,
      });

      const cid = result.cid.toString();
      logger.info(`File uploaded to IPFS: ${fileName || 'unnamed'} -> ${cid}`);
      
      return cid;
    } catch (error) {
      logger.error('Failed to upload file to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload JSON data to IPFS (commonly used for QA reports)
   * @param {Object} jsonData - JSON object to upload
   * @returns {Promise<string>} - IPFS CID
   */
  async uploadJSON(jsonData) {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2);
      const content = Buffer.from(jsonString);

      const result = await this.client.add(content, {
        pin: true,
        wrapWithDirectory: false,
      });

      const cid = result.cid.toString();
      logger.info(`JSON data uploaded to IPFS: ${cid}`);
      
      return cid;
    } catch (error) {
      logger.error('Failed to upload JSON to IPFS:', error);
      throw error;
    }
  }

  /**
   * Upload a Quality Assurance report to IPFS
   * This is the PRIMARY use case for IPFS in this application.
   * Datasets themselves are NOT uploaded to IPFS.
   * 
   * @param {Object} qaReport - QA report object
   * @returns {Promise<string>} - IPFS CID
   */
  async uploadQAReport(qaReport) {
    try {
      // Structure the QA report with metadata
      const reportData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        reportType: 'quality-assurance',
        note: 'This is a QA report only. The actual dataset is stored off-chain.',
        report: qaReport,
      };

      const cid = await this.uploadJSON(reportData);
      logger.info(`QA Report uploaded to IPFS: ${cid}`);
      
      return cid;
    } catch (error) {
      logger.error('Failed to upload QA report to IPFS:', error);
      throw error;
    }
  }

  /**
   * Retrieve content from IPFS by CID
   * @param {string} cid - IPFS CID
   * @returns {Promise<Buffer>} - File content
   */
  async getFile(cid) {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      
      const content = Buffer.concat(chunks);
      logger.info(`Retrieved file from IPFS: ${cid}`);
      
      return content;
    } catch (error) {
      logger.error(`Failed to retrieve file from IPFS (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Retrieve and parse JSON from IPFS
   * @param {string} cid - IPFS CID
   * @returns {Promise<Object>} - Parsed JSON object
   */
  async getJSON(cid) {
    try {
      const content = await this.getFile(cid);
      const jsonData = JSON.parse(content.toString());
      logger.info(`Retrieved JSON from IPFS: ${cid}`);
      
      return jsonData;
    } catch (error) {
      logger.error(`Failed to retrieve JSON from IPFS (${cid}):`, error);
      throw error;
    }
  }

  /**
   * Pin a CID to ensure it stays on IPFS
   * @param {string} cid - IPFS CID
   * @returns {Promise<void>}
   */
  async pin(cid) {
    try {
      await this.client.pin.add(cid);
      logger.info(`Pinned CID: ${cid}`);
    } catch (error) {
      logger.error(`Failed to pin CID (${cid}):`, error);
      throw error;
    }
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
