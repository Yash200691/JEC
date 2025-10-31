import { ethers } from 'ethers';

/**
 * Blockchain Service
 * Handles all Web3 interactions with MetaMask and smart contract
 */
class BlockchainService {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
    this.chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '11155111');
  }

  /**
   * Check if MetaMask is installed
   */
  isMetaMaskInstalled() {
    return typeof window.ethereum !== 'undefined';
  }

  /**
   * Connect wallet and initialize contract
   */
  async connectWallet() {
    if (!this.isMetaMaskInstalled()) {
      throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Initialize provider and signer
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      // Check network
      const network = await this.provider.getNetwork();
      if (Number(network.chainId) !== this.chainId) {
        await this.switchNetwork();
      }

      // Initialize contract
      await this.initializeContract();

      return {
        address: accounts[0],
        chainId: Number(network.chainId),
      };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Switch to correct network
   */
  async switchNetwork() {
    const chainIdHex = '0x' + this.chainId.toString(16);
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (error) {
      // If network doesn't exist, this error will be thrown
      if (error.code === 4902) {
        throw new Error('Please add Sepolia network to MetaMask manually');
      }
      throw error;
    }
  }

  /**
   * Initialize contract instance
   */
  async initializeContract() {
    if (!this.signer) {
      throw new Error('Wallet not connected');
    }

    // Contract ABI - add minimal ABI needed for frontend
    const abi = [
      'function requests(uint256) view returns (uint256 id, address buyer, uint256 budget, uint8 formatsMask, string description, uint8 status, uint8 qualityScore, string qualityReportCid, uint256 finalizedSubmissionId, uint256 createdAt)',
      'function submissions(uint256) view returns (uint256 id, uint256 requestId, address seller, address model, uint8 format, uint256 fileSize, uint256 sampleCount, string fileExtensions, string datasetReference, uint8 status, bool qualityChecked, uint256 createdAt)',
      'function createRequest(uint8 formatsMask, string description) payable returns (uint256)',
      'function submitDataset(uint256 requestId, uint8 format, uint256 fileSize, uint256 sampleCount, string fileExtensions, string datasetReference, address model) returns (uint256)',
      'function getBuyerRequests(address buyer) view returns (uint256[])',
      'function getSellerSubmissions(address seller) view returns (uint256[])',
      'function requestCounter() view returns (uint256)',
      'function submissionCounter() view returns (uint256)',
      'event RequestCreated(uint256 indexed requestId, address indexed buyer, uint256 budget, uint8 formatsMask, string description)',
      'event SubmissionSubmitted(uint256 indexed submissionId, uint256 indexed requestId, address indexed seller, address indexed model, uint8 format, uint256 fileSize, uint256 sampleCount, string fileExtensions, string datasetReference)',
      'event SubmissionVerified(uint256 indexed submissionId, uint256 indexed requestId, bool approved, uint8 qualityScore, string qualityReportCid)',
      'event PaymentReleased(uint256 indexed submissionId, address indexed seller, uint256 amount)',
      'event RefundIssued(uint256 indexed requestId, address indexed buyer, uint256 amount)',
    ];

    this.contract = new ethers.Contract(this.contractAddress, abi, this.signer);
  }

  /**
   * Get current connected address
   */
  async getCurrentAddress() {
    if (!this.signer) {
      return null;
    }
    return await this.signer.getAddress();
  }

  /**
   * Get account balance
   */
  async getBalance(address) {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }
    const balance = await this.provider.getBalance(address);
    return ethers.formatEther(balance);
  }

  /**
   * Create a new data request
   */
  async createRequest(formatsMask, description, budgetInEth) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.createRequest(formatsMask, description, {
      value: ethers.parseEther(budgetInEth.toString()),
    });

    const receipt = await tx.wait();
    
    // Parse event to get request ID
    const event = receipt.logs
      .map(log => {
        try {
          return this.contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e && e.name === 'RequestCreated');

    return {
      requestId: event ? event.args.requestId.toString() : null,
      transactionHash: receipt.hash,
    };
  }

  /**
   * Get request details
   */
  async getRequest(requestId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const request = await this.contract.requests(requestId);
    
    return {
      id: request.id.toString(),
      buyer: request.buyer,
      budget: ethers.formatEther(request.budget),
      formatsMask: request.formatsMask,
      description: request.description,
      status: Number(request.status), // 0 = OPEN, 1 = CLOSED
      qualityScore: Number(request.qualityScore),
      qualityReportCid: request.qualityReportCid,
      finalizedSubmissionId: request.finalizedSubmissionId.toString(),
      createdAt: new Date(Number(request.createdAt) * 1000).toISOString(),
    };
  }

  /**
   * Get submission details
   */
  async getSubmission(submissionId) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const submission = await this.contract.submissions(submissionId);
    
    return {
      id: submission.id.toString(),
      requestId: submission.requestId.toString(),
      seller: submission.seller,
      model: submission.model,
      format: Number(submission.format),
      fileSize: submission.fileSize.toString(),
      sampleCount: submission.sampleCount.toString(),
      fileExtensions: submission.fileExtensions,
      datasetReference: submission.datasetReference,
      status: Number(submission.status), // 0 = PENDING, 1 = APPROVED, 2 = REJECTED, 3 = PAID, 4 = REFUNDED
      qualityChecked: submission.qualityChecked,
      createdAt: new Date(Number(submission.createdAt) * 1000).toISOString(),
    };
  }

  /**
   * Get all requests for a buyer
   */
  async getBuyerRequests(buyerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const requestIds = await this.contract.getBuyerRequests(buyerAddress);
    return requestIds.map(id => id.toString());
  }

  /**
   * Get all submissions for a seller
   */
  async getSellerSubmissions(sellerAddress) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const submissionIds = await this.contract.getSellerSubmissions(sellerAddress);
    return submissionIds.map(id => id.toString());
  }

  /**
   * Listen to contract events
   */
  listenToEvent(eventName, callback) {
    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    this.contract.on(eventName, (...args) => {
      callback(...args);
    });
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventName) {
    if (this.contract) {
      this.contract.off(eventName);
    }
  }

  /**
   * Format data format enum to string
   */
  formatToString(format) {
    const formats = ['AUDIO', 'CSV', 'IMAGE', 'TEXT', 'VIDEO', 'MIXED'];
    return formats[format] || 'UNKNOWN';
  }

  /**
   * Format status enum to string
   */
  requestStatusToString(status) {
    const statuses = ['OPEN', 'CLOSED'];
    return statuses[status] || 'UNKNOWN';
  }

  /**
   * Format submission status enum to string
   */
  submissionStatusToString(status) {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'REFUNDED'];
    return statuses[status] || 'UNKNOWN';
  }
}

// Export singleton instance
const blockchainService = new BlockchainService();
export default blockchainService;
