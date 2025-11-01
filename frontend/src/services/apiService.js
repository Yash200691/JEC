import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * API Service
 * Handles all communication with the backend API
 */
class APIService {
  constructor() {
    this.baseURL = API_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 300000, // 5 minutes for long operations
    });
  }

  /**
   * Submit buyer's sample data for AI model generation
   * ENDPOINT 1: Buyer submits sample data
   */
  async submitRequest(requestId, sampleData, dataType, sampleCount, description) {
    try {
      const response = await this.client.post('/api/dataset/submit-request', {
        requestId,
        sampleData,
        dataType,
        sampleCount,
        description,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate a synthetic dataset using AI model
   * ENDPOINT 2: AI model generates dataset
   */
  async generateDataset(requestId, dataType, sampleCount, description, sampleData = null) {
    try {
      const response = await this.client.post('/api/dataset/generate', {
        requestId,
        dataType,
        sampleCount,
        description,
        sampleData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get QA report from AI model verification
   * ENDPOINT 3: AI model generates QA report, uploads to IPFS, triggers escrow
   */
  async getReport(submissionId, requestId, datasetReference, originalSampleData = null) {
    try {
      const response = await this.client.post('/api/dataset/get-report', {
        submissionId,
        requestId,
        datasetReference,
        originalSampleData,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get buyer's request history with results
   */
  async getBuyerHistory(buyerAddress) {
    try {
      const response = await this.client.get(`/api/dataset/history/${buyerAddress}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get request details from blockchain via backend
   */
  async getRequest(requestId) {
    try {
      const response = await this.client.get(`/api/dataset/request/${requestId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get submission details from blockchain via backend
   */
  async getSubmission(submissionId) {
    try {
      const response = await this.client.get(`/api/dataset/submission/${submissionId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get QA report from IPFS via backend
   */
  async getQAReport(cid) {
    try {
      const response = await this.client.get(`/api/dataset/qa-report/${cid}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.error || error.response.data?.message || 'Server error';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

// Export singleton instance
const apiService = new APIService();
export default apiService;
