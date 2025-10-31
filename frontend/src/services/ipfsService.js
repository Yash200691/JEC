import axios from 'axios';

const IPFS_GATEWAY = import.meta.env.VITE_IPFS_GATEWAY || 'https://ipfs.io/ipfs/';

/**
 * IPFS Service
 * Handles fetching QA reports from IPFS
 */
class IPFSService {
  constructor() {
    this.gateway = IPFS_GATEWAY;
  }

  /**
   * Fetch QA report from IPFS using CID
   */
  async getQAReport(cid) {
    try {
      if (!cid || cid === '') {
        throw new Error('Invalid IPFS CID');
      }

      const url = `${this.gateway}${cid}`;
      const response = await axios.get(url, {
        timeout: 30000, // 30 seconds
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching QA report from IPFS:', error);
      throw new Error(`Failed to fetch QA report: ${error.message}`);
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayURL(cid) {
    return `${this.gateway}${cid}`;
  }

  /**
   * Check if CID is valid
   */
  isValidCID(cid) {
    // Basic CID validation (CIDv0 or CIDv1)
    const cidV0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
    const cidV1Regex = /^b[A-Za-z2-7]{58}$/;
    
    return cidV0Regex.test(cid) || cidV1Regex.test(cid);
  }
}

// Export singleton instance
const ipfsService = new IPFSService();
export default ipfsService;
