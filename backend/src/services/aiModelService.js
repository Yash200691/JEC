import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * AI Model Service
 * Handles communication with the AI model endpoints for dataset generation and QA
 */
class AIModelService {
  constructor() {
    // ENDPOINT 1: Sample submission
    this.sampleEndpoint = process.env.SAMPLE_SUBMISSION_ENDPOINT;
    this.sampleApiKey = process.env.SAMPLE_SUBMISSION_API_KEY;
    
    // ENDPOINT 2: Dataset generation
    this.generationEndpoint = process.env.AI_GENERATION_ENDPOINT;
    this.generationApiKey = process.env.AI_GENERATION_API_KEY;
    
    // ENDPOINT 3: QA verification
    this.qaEndpoint = process.env.QA_REPORT_ENDPOINT;
    this.qaApiKey = process.env.QA_REPORT_API_KEY;
  }

  /**
   * Submit sample data to AI model for processing (ENDPOINT 1)
   * @param {Object} requestData - Request data with sample information
   * @returns {Promise<Object>} - Acknowledgment from AI model
   */
  async submitSampleData(requestData) {
    // Use mock if endpoint not configured
    if (!this.sampleEndpoint || this.sampleEndpoint === 'http://localhost:8000/submit') {
      logger.warn('SAMPLE_SUBMISSION_ENDPOINT not configured, using mock implementation');
      return {
        success: true,
        message: 'Mock: Sample data received and ready for generation',
      };
    }

    try {
      logger.info(`Submitting sample data to AI model for requestId: ${requestData.requestId}`);

      // Prepare headers - only add Authorization if API key exists
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.sampleApiKey && this.sampleApiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.sampleApiKey}`;
      }

      const response = await axios.post(
        this.sampleEndpoint,
        {
          requestId: requestData.requestId,
          sampleData: requestData.sampleData,
          dataType: requestData.dataType,
          sampleCount: requestData.sampleCount,
          description: requestData.description,
        },
        {
          headers,
          timeout: 60000, // 1 minute timeout
        }
      );

      logger.info(`AI model acknowledged sample data for requestId: ${requestData.requestId}`);

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      logger.error('AI Model failed to process sample data:', error.message);
      throw new Error(`Sample submission failed: ${error.message}`);
    }
  }

  /**
   * Generate synthetic dataset using AI model (ENDPOINT 2)
   * AI Model analyzes buyer's sample data and creates synthetic dataset
   * @param {Object} requestParams - Parameters for dataset generation
   * @param {string} requestParams.dataType - Type of data to generate (audio, image, csv, text, video)
   * @param {number} requestParams.sampleCount - Number of samples to generate
   * @param {string} requestParams.description - Description/prompt for generation
   * @param {any} requestParams.sampleData - Buyer's sample data to guide AI generation
   * @returns {Promise<Object>} - Generated dataset with actual data
   */
  async generateDataset(requestParams) {
    // Use mock if endpoint not configured
    if (!this.generationEndpoint || this.generationEndpoint === 'http://localhost:8001/generate') {
      logger.warn('AI_GENERATION_ENDPOINT not configured, using mock implementation');
      return this.mockGenerateDataset(requestParams);
    }

    try {
      logger.info(`AI Model analyzing sample data and generating: ${requestParams.dataType}, ${requestParams.sampleCount} samples`);

      // Prepare headers - only add Authorization if API key exists
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.generationApiKey && this.generationApiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.generationApiKey}`;
      }

      const response = await axios.post(
        this.generationEndpoint,
        {
          dataType: requestParams.dataType,
          sampleCount: requestParams.sampleCount,
          description: requestParams.description,
          sampleData: requestParams.sampleData, // Buyer's sample data
        },
        {
          headers,
          timeout: 300000, // 5 minutes timeout for long-running generation
        }
      );

      logger.info(`AI Model successfully generated synthetic dataset`);

      return {
        success: true,
        data: response.data,
        // Expected structure from AI model:
        // {
        //   dataset: [...], // Actual generated data (array of samples)
        //   metadata: {
        //     format: 0-5, // DataFormat enum value
        //     fileSize: 1024000, // Total size in bytes
        //     sampleCount: 100,
        //     fileExtensions: 'wav,mp3',
        //   }
        // }
      };
    } catch (error) {
      logger.error('AI Model failed to generate dataset:', error.message);
      throw new Error(`AI model generation failed: ${error.message}`);
    }
  }

  /**
   * AI Model verifies dataset quality by comparing original sample data with synthetic data (ENDPOINT 3)
   * This is where the REAL AI MODEL QA happens - comparing buyer's data with generated data
   * @param {Object} datasetInfo - Dataset information to verify
   * @param {string} datasetInfo.datasetReference - Reference to the generated dataset
   * @param {any} datasetInfo.originalSampleData - Buyer's original sample data
   * @param {any} datasetInfo.syntheticData - AI-generated synthetic data
   * @param {Object} datasetInfo.metadata - Dataset metadata
   * @param {string} datasetInfo.requestDescription - Original request description
   * @returns {Promise<Object>} - QA report with quality scores and comparison results
   */
  async verifyQuality(datasetInfo) {
    // Use mock if endpoint not configured
    if (!this.qaEndpoint || this.qaEndpoint === 'http://localhost:8002/verify') {
      logger.warn('QA_REPORT_ENDPOINT not configured, using mock implementation');
      return this.mockVerifyQuality(datasetInfo);
    }

    try {
      logger.info(`AI Model comparing original sample data with synthetic data for QA verification`);

      // Prepare headers - only add Authorization if API key exists
      const headers = {
        'Content-Type': 'application/json',
      };
      if (this.qaApiKey && this.qaApiKey.trim() !== '') {
        headers['Authorization'] = `Bearer ${this.qaApiKey}`;
      }

      const response = await axios.post(
        this.qaEndpoint,
        {
          datasetReference: datasetInfo.datasetReference,
          originalSampleData: datasetInfo.originalSampleData, // Buyer's original data
          syntheticData: datasetInfo.syntheticData, // AI-generated data
          metadata: datasetInfo.metadata,
          requestDescription: datasetInfo.requestDescription,
        },
        {
          headers,
          timeout: 180000, // 3 minutes timeout
        }
      );

      logger.info(`AI Model QA verification completed - Quality Score: ${response.data.qualityScore}`);

      return {
        success: true,
        approved: response.data.approved || false,
        qualityScore: response.data.qualityScore || 0,
        report: response.data.report || {},
        // Expected QA report structure:
        // {
        //   approved: true/false, // Determines if escrow releases payment
        //   qualityScore: 85, // Score out of 100
        //   report: {
        //     summary: "Synthetic data matches sample quality",
        //     comparisonMetrics: {
        //       similarity: 0.92, // How similar synthetic is to original
        //       consistency: 0.88, // Data consistency
        //       accuracy: 0.90, // Quality accuracy
        //     },
        //     issues: ["Minor deviation in 2 samples"],
        //     recommendations: ["Data ready for use"],
        //     verifiedAt: "2025-11-01T10:00:00Z"
        //   }
        // }
      };
    } catch (error) {
      logger.error('AI Model QA verification failed:', error.message);
      throw new Error(`Quality verification failed: ${error.message}`);
    }
  }

  /**
   * Mock dataset generation (for testing without AI endpoint)
   * Simulates AI model generating synthetic data based on sample data
   * @param {Object} requestParams - Request parameters
   * @returns {Promise<Object>} - Mock dataset with actual data samples
   */
  async mockGenerateDataset(requestParams) {
    logger.info(`[MOCK AI MODEL] Analyzing sample data and generating: ${requestParams.dataType}`);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock dataset based on type
    const dataset = this.generateMockData(requestParams.dataType, requestParams.sampleCount);

    return {
      success: true,
      data: {
        dataset, // Actual generated data to show on frontend
        metadata: {
          format: this.mapDataTypeToFormat(requestParams.dataType),
          fileSize: 1024 * requestParams.sampleCount,
          sampleCount: requestParams.sampleCount,
          fileExtensions: this.getFileExtensions(requestParams.dataType),
        },
      },
    };
  }

  /**
   * Mock quality verification (for testing without QA endpoint)
   * Simulates AI model comparing original vs synthetic data
   * @param {Object} datasetInfo - Dataset info
   * @returns {Promise<Object>} - Mock QA report
   */
  async mockVerifyQuality(datasetInfo) {
    logger.info(`[MOCK AI MODEL] Comparing original sample with synthetic data for QA`);

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const qualityScore = Math.floor(Math.random() * 20) + 75; // 75-95

    return {
      success: true,
      approved: qualityScore >= 70, // Determines if escrow releases payment
      qualityScore,
      report: {
        summary: `AI Model verified synthetic data quality: Score ${qualityScore}/100`,
        comparisonMetrics: {
          similarity: (qualityScore / 100).toFixed(2), // How similar to original
          consistency: 0.90,
          accuracy: 0.88,
        },
        issues: qualityScore < 85 ? ['Minor deviation in 2 samples'] : [],
        recommendations: qualityScore >= 70 ? ['Synthetic data approved for use'] : ['Needs improvement'],
        verifiedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Generate mock synthetic data based on data type
   * @param {string} dataType - Type of data
   * @param {number} count - Number of samples
   * @returns {Array} - Mock dataset
   */
  generateMockData(dataType, count) {
    const data = [];
    
    switch (dataType.toLowerCase()) {
      case 'csv':
        // Generate mock CSV data
        for (let i = 0; i < count; i++) {
          data.push({
            id: i + 1,
            name: `Sample_${i + 1}`,
            value: Math.floor(Math.random() * 1000),
            category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
          });
        }
        break;
      
      case 'text':
        // Generate mock text samples
        for (let i = 0; i < count; i++) {
          data.push({
            id: i + 1,
            text: `This is AI-generated synthetic text sample ${i + 1}. Lorem ipsum dolor sit amet.`,
          });
        }
        break;
      
      case 'audio':
      case 'image':
      case 'video':
        // Generate mock file references
        for (let i = 0; i < count; i++) {
          data.push({
            id: i + 1,
            filename: `${dataType}_sample_${i + 1}.${this.getFileExtensions(dataType).split(',')[0]}`,
            url: `/mock-data/${dataType}/${i + 1}`,
            size: Math.floor(Math.random() * 10000),
          });
        }
        break;
      
      default:
        for (let i = 0; i < count; i++) {
          data.push({ id: i + 1, data: `Sample ${i + 1}` });
        }
    }
    
    return data;
  }

  /**
   * Helper: Map data type string to DataFormat enum
   * @param {string} dataType - Data type string
   * @returns {number} - DataFormat enum value
   */
  mapDataTypeToFormat(dataType) {
    const formatMap = {
      'audio': 0,    // AUDIO
      'csv': 1,      // CSV
      'image': 2,    // IMAGE
      'text': 3,     // TEXT
      'video': 4,    // VIDEO
      'mixed': 5,    // MIXED
    };
    return formatMap[dataType.toLowerCase()] || 3; // Default to TEXT
  }

  /**
   * Helper: Get file extensions for data type
   * @param {string} dataType - Data type string
   * @returns {string} - Comma-separated file extensions
   */
  getFileExtensions(dataType) {
    const extensionMap = {
      'audio': 'wav,mp3',
      'csv': 'csv',
      'image': 'png,jpg',
      'text': 'txt,json',
      'video': 'mp4,avi',
      'mixed': 'zip',
    };
    return extensionMap[dataType.toLowerCase()] || 'txt';
  }
}

// Export singleton instance
const aiModelService = new AIModelService();
export default aiModelService;
