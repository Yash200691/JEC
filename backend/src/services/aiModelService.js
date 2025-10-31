import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * AI Model Service
 * Handles communication with the AI model endpoint for dataset generation
 */
class AIModelService {
  constructor() {
    this.endpoint = process.env.AI_MODEL_ENDPOINT;
    this.apiKey = process.env.AI_MODEL_API_KEY;
    this.qaEndpoint = process.env.QA_VERIFIER_ENDPOINT;
    this.qaApiKey = process.env.QA_VERIFIER_API_KEY;
  }

  /**
   * Generate synthetic dataset using AI model
   * @param {Object} requestParams - Parameters for dataset generation
   * @param {string} requestParams.dataType - Type of data to generate (audio, image, csv, text, video)
   * @param {number} requestParams.sampleCount - Number of samples to generate
   * @param {string} requestParams.description - Description/prompt for generation
   * @param {Object} requestParams.additionalParams - Additional model-specific parameters
   * @returns {Promise<Object>} - Generated dataset info
   */
  async generateDataset(requestParams) {
    // Use mock if endpoint not configured
    if (!this.endpoint || this.endpoint === 'http://localhost:8000/generate') {
      logger.warn('AI_MODEL_ENDPOINT not configured, using mock implementation');
      return this.mockGenerateDataset(requestParams);
    }

    try {
      logger.info(`Generating dataset: ${requestParams.dataType}, ${requestParams.sampleCount} samples`);

      const response = await axios.post(
        this.endpoint,
        {
          dataType: requestParams.dataType,
          sampleCount: requestParams.sampleCount,
          description: requestParams.description,
          ...requestParams.additionalParams,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: 300000, // 5 minutes timeout for long-running generation
        }
      );

      logger.info(`Dataset generated successfully`);

      return {
        success: true,
        data: response.data,
        // Expected structure from AI model:
        // {
        //   files: [...], // Array of generated file buffers or URLs
        //   metadata: {
        //     format: 0-5, // DataFormat enum value
        //     fileSize: 1024000, // Total size in bytes
        //     sampleCount: 100,
        //     fileExtensions: 'wav,mp3',
        //   }
        // }
      };
    } catch (error) {
      logger.error('Failed to generate dataset:', error.message);
      throw new Error(`AI model generation failed: ${error.message}`);
    }
  }

  /**
   * Verify dataset quality using QA service
   * @param {Object} datasetInfo - Dataset information to verify
   * @param {string} datasetInfo.datasetReference - Reference to the dataset
   * @param {Object} datasetInfo.metadata - Dataset metadata
   * @param {string} datasetInfo.requestDescription - Original request description
   * @returns {Promise<Object>} - QA report
   */
  async verifyQuality(datasetInfo) {
    // Use mock if endpoint not configured
    if (!this.qaEndpoint || this.qaEndpoint === 'http://localhost:8001/verify') {
      logger.warn('QA_VERIFIER_ENDPOINT not configured, using mock implementation');
      return this.mockVerifyQuality(datasetInfo);
    }

    try {
      logger.info(`Verifying dataset quality`);

      const response = await axios.post(
        this.qaEndpoint,
        {
          datasetReference: datasetInfo.datasetReference,
          metadata: datasetInfo.metadata,
          requestDescription: datasetInfo.requestDescription,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.qaApiKey}`,
          },
          timeout: 180000, // 3 minutes timeout
        }
      );

      logger.info(`Quality verification completed`);

      return {
        success: true,
        approved: response.data.approved || false,
        qualityScore: response.data.qualityScore || 0,
        report: response.data.report || {},
        // Expected QA report structure:
        // {
        //   approved: true,
        //   qualityScore: 85,
        //   report: {
        //     summary: "Dataset meets requirements",
        //     metrics: {
        //       completeness: 0.95,
        //       accuracy: 0.88,
        //       consistency: 0.92,
        //     },
        //     issues: [],
        //     recommendations: [],
        //   }
        // }
      };
    } catch (error) {
      logger.error('Failed to verify quality:', error.message);
      throw new Error(`Quality verification failed: ${error.message}`);
    }
  }

  /**
   * Mock dataset generation (for testing without AI endpoint)
   * @param {Object} requestParams - Request parameters
   * @returns {Promise<Object>} - Mock dataset
   */
  async mockGenerateDataset(requestParams) {
    logger.info(`[MOCK] Generating dataset: ${requestParams.dataType}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      success: true,
      data: {
        files: ['mock_file_1.txt', 'mock_file_2.txt'],
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
   * @param {Object} datasetInfo - Dataset info
   * @returns {Promise<Object>} - Mock QA report
   */
  async mockVerifyQuality(datasetInfo) {
    logger.info(`[MOCK] Verifying dataset quality`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const qualityScore = Math.floor(Math.random() * 20) + 75; // 75-95

    return {
      success: true,
      approved: qualityScore >= 70,
      qualityScore,
      report: {
        summary: `Mock quality verification completed with score ${qualityScore}`,
        metrics: {
          completeness: 0.92,
          accuracy: 0.88,
          consistency: 0.90,
        },
        issues: qualityScore < 85 ? ['Minor formatting inconsistencies'] : [],
        recommendations: ['Dataset is ready for delivery'],
        verifiedAt: new Date().toISOString(),
      },
    };
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
