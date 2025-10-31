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
   * Generate a synthetic dataset
   */
  async generateDataset(requestId, dataType, sampleCount, description, additionalParams = {}) {
    try {
      const response = await this.client.post('/api/dataset/generate', {
        requestId,
        dataType,
        sampleCount,
        description,
        additionalParams,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Verify dataset quality
   */
  async verifyDataset(submissionId, datasetReference, requestDescription) {
    try {
      const response = await this.client.post('/api/dataset/verify', {
        submissionId,
        datasetReference,
        requestDescription,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Complete workflow: generate and verify
   */
  async generateAndVerify(requestId, dataType, sampleCount, description, autoVerify = true, additionalParams = {}) {
    try {
      const response = await this.client.post('/api/dataset/generate-and-verify', {
        requestId,
        dataType,
        sampleCount,
        description,
        autoVerify,
        additionalParams,
      });
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
