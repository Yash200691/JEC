import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import blockchainService from '../services/blockchainService';
import apiService from '../services/apiService';
import { Button, Card, Badge, Loader, EmptyState, Modal, Input, TextArea, Alert } from '../components/UI';
import { formatAddress, formatDate, getStatusColor, formatsArrayToMask } from '../utils/helpers';
import { Plus, Database, Eye, RefreshCw, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { account, isConnected } = useWallet();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    dataType: '',
    sampleCount: '',
    description: '',
    // Image-specific fields
    prompt: '',
    referenceImage: null,
    numberOfImages: 1,
    resolution: '512x512',
    // Text-specific fields
    inputDataJson: '',
    outputSchemaJson: '',
    toneOfVoice: 'neutral',
    maxLength: 1024,
    // CSV/Tabular-specific fields
    schemaDefinitionMethod: 'manual',
    manualSchema: [{ columnName: '', dataType: 'string' }],
    schemaFile: null,
    numberOfRows: 100,
    sampleDataFile: null,
    // Audio-specific fields
    textToSynthesize: '',
    voiceSpeaker: 'male-deep',
    emotionStyle: 'neutral',
    speechRate: 1.0,
  });

  const availableFormats = ['AUDIO', 'CSV', 'IMAGE', 'TEXT', 'VIDEO', 'MIXED'];

  useEffect(() => {
    if (isConnected && account) {
      loadRequests();
    }
  }, [isConnected, account]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const requestIds = await blockchainService.getBuyerRequests(account);
      
      const requestsData = await Promise.all(
        requestIds.map(id => blockchainService.getRequest(id))
      );
      
      setRequests(requestsData.reverse());
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndGenerate = async () => {
    // Validate based on data type
    if (!formData.dataType) {
      toast.error('Please select a data type');
      return;
    }

    // Prepare sample data based on data type
    let sampleData = {};
    let description = '';
    let sampleCount = 1;

    switch (formData.dataType) {
      case 'image':
        if (!formData.prompt) {
          toast.error('Please enter a prompt for image generation');
          return;
        }
        description = formData.prompt;
        sampleCount = formData.numberOfImages;
        sampleData = {
          prompt: formData.prompt,
          referenceImage: formData.referenceImage ? await fileToBase64(formData.referenceImage) : null,
          numberOfImages: formData.numberOfImages,
          resolution: formData.resolution,
        };
        break;

      case 'text':
        if (!formData.prompt || !formData.outputSchemaJson || !formData.sampleCount) {
          toast.error('Please fill in all required fields (Prompt, Output Schema, Number of Samples)');
          return;
        }
        description = formData.prompt;
        sampleCount = formData.sampleCount;
        sampleData = {
          prompt: formData.prompt,
          inputDataJson: formData.inputDataJson,
          outputSchemaJson: formData.outputSchemaJson,
          toneOfVoice: formData.toneOfVoice,
          maxLength: formData.maxLength,
        };
        break;

      case 'csv':
        if (formData.schemaDefinitionMethod === 'manual') {
          if (formData.manualSchema.some(col => !col.columnName)) {
            toast.error('Please fill in all column names');
            return;
          }
        } else if (!formData.schemaFile) {
          toast.error('Please upload a schema file');
          return;
        }
        if (!formData.numberOfRows) {
          toast.error('Please specify number of rows to generate');
          return;
        }
        description = `Generate ${formData.numberOfRows} rows of tabular data`;
        sampleCount = formData.numberOfRows;
        sampleData = {
          schemaDefinitionMethod: formData.schemaDefinitionMethod,
          manualSchema: formData.manualSchema,
          schemaFile: formData.schemaFile ? await fileToBase64(formData.schemaFile) : null,
          numberOfRows: formData.numberOfRows,
          sampleDataFile: formData.sampleDataFile ? await fileToBase64(formData.sampleDataFile) : null,
        };
        break;

      case 'audio':
        if (!formData.textToSynthesize) {
          toast.error('Please enter text to synthesize');
          return;
        }
        description = formData.textToSynthesize;
        sampleCount = 1;
        sampleData = {
          textToSynthesize: formData.textToSynthesize,
          voiceSpeaker: formData.voiceSpeaker,
          emotionStyle: formData.emotionStyle,
          speechRate: formData.speechRate,
        };
        break;

      default:
        toast.error('Invalid data type');
        return;
    }

    setCreating(true);

    try {
      // Step 1: Create blockchain request with minimal budget (0.001 ETH)
      const formatsMask = formatsArrayToMask([formData.dataType.toUpperCase()]);
      const budgetInEth = 0.001; // Minimal budget since it's AI-generated
      
      const { requestId } = await blockchainService.createRequest(
        formatsMask,
        description,
        budgetInEth
      );

      toast.success(`Request created! ID: ${requestId}`);

      // Step 2: Submit sample data
      toast.info('Submitting your data to AI model...');
      await apiService.submitRequest(
        requestId,
        sampleData,
        formData.dataType.toLowerCase(),
        parseInt(sampleCount),
        description
      );

      // Step 3: AI Model generates synthetic dataset
      toast.info('AI Model generating synthetic dataset...');
      
      const result = await apiService.generateDataset(
        requestId,
        formData.dataType.toLowerCase(),
        parseInt(sampleCount),
        description,
        sampleData // Buyer's sample data to guide generation
      );

      if (result.success) {
        const { submissionId, dataset, datasetReference } = result.data;
        toast.success('AI Model generated dataset successfully!');
        
        // Step 4: AI Model verifies quality and creates QA report
        toast.info('AI Model verifying quality and generating QA report...');
        
        const qaResult = await apiService.getReport(
          submissionId,
          requestId,
          datasetReference,
          sampleData // Original sample for comparison
        );
        
        if (qaResult.success) {
          toast.success(`QA Report ready! Score: ${qaResult.data.qualityScore}/100`);
          toast.info(`Escrow Status: ${qaResult.data.escrowStatus}`);
        }
        
        setIsCreateModalOpen(false);
        // Reset form
        setFormData({
          dataType: '',
          sampleCount: '',
          description: '',
          prompt: '',
          referenceImage: null,
          numberOfImages: 1,
          resolution: '512x512',
          inputDataJson: '',
          outputSchemaJson: '',
          toneOfVoice: 'neutral',
          maxLength: 1024,
          schemaDefinitionMethod: 'manual',
          manualSchema: [{ columnName: '', dataType: 'string' }],
          schemaFile: null,
          numberOfRows: 100,
          sampleDataFile: null,
          textToSynthesize: '',
          voiceSpeaker: 'male-deep',
          emotionStyle: 'neutral',
          speechRate: 1.0,
        });
        await loadRequests();
        
        // Navigate to the request details to show the dataset
        navigate(`/request/${requestId}`);
      }
    } catch (error) {
      console.error('Error in workflow:', error);
      toast.error(error.message || 'Failed to complete workflow');
    } finally {
      setCreating(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  if (!isConnected) {
    return (
      // add top padding so the fixed navbar doesn't overlap the alert
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
        <Alert type="warning">
          Please connect your wallet to view your dashboard
        </Alert>
      </div>
    );
  }

  return (
    // Add top padding to avoid being overlapped by the fixed navbar
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Request AI-generated datasets and view quality reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadRequests}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{requests.length}</p>
            </div>
            <Database className="h-10 w-10 text-primary-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => r.status === 0 && r.qualityReportCid === '').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-yellow-600 rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => r.qualityReportCid !== '').length}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-green-600 rounded-full" />
            </div>
          </div>
        </Card>
      </div>

      {/* Requests List */}
      {loading ? (
        <Card className="p-12">
          <Loader size="lg" className="mx-auto" />
        </Card>
      ) : requests.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No requests yet"
            description="Create your first data request to get AI-generated datasets"
            icon={<Database className="h-12 w-12" />}
            action={
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <Card key={request.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Request #{request.id}
                    </h3>
                    <Badge variant={getStatusColor(blockchainService.requestStatusToString(request.status))}>
                      {blockchainService.requestStatusToString(request.status)}
                    </Badge>
                    {request.qualityReportCid && request.qualityReportCid !== '' && (
                      <Badge variant="bg-blue-100 text-blue-800 border-blue-200">
                        <FileText className="h-3 w-3 mr-1" />
                        QA Report Available
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{request.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {formatDate(request.createdAt)}
                      </span>
                    </div>
                    {request.qualityScore > 0 && (
                      <div>
                        <span className="text-gray-600">QA Score:</span>
                        <span className="font-semibold text-gray-900 ml-2">{request.qualityScore}/100</span>
                      </div>
                    )}
                    {request.finalizedSubmissionId !== '0' && (
                      <div>
                        <span className="text-gray-600">Submission ID:</span>
                        <span className="font-semibold text-gray-900 ml-2">#{request.finalizedSubmissionId}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/request/${request.id}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Request AI-Generated Dataset"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <Alert type="info">
            Select your data type and fill in the required fields. The AI will generate synthetic data based on your specifications.
          </Alert>

          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type *
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={formData.dataType}
              onChange={(e) => {
                setFormData({ ...formData, dataType: e.target.value });
              }}
            >
              <option value="">Select data type...</option>
              <option value="image">Image</option>
              <option value="text">Text / JSON</option>
              <option value="csv">Tabular / CSV</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          {/* IMAGE FIELDS */}
          {formData.dataType === 'image' && (
            <>
              <TextArea
                label="Prompt *"
                placeholder="A photorealistic, wide-angle shot of an astronaut riding a horse on Mars, synthwave style."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                rows={3}
                helper="Be as descriptive as possible about the image you want to generate"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  onChange={(e) => setFormData({ ...formData, referenceImage: e.target.files[0] })}
                />
                <p className="text-sm text-gray-500 mt-1">Upload an existing image as a visual reference or base for generation</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Images *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.numberOfImages}
                    onChange={(e) => setFormData({ ...formData, numberOfImages: parseInt(e.target.value), sampleCount: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resolution *
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.resolution}
                    onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                  >
                    <option value="512x512">512x512 (Fast)</option>
                    <option value="1024x1024">1024x1024 (HD)</option>
                    <option value="1920x1080">1920x1080 (Full HD)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* TEXT/JSON FIELDS */}
          {formData.dataType === 'text' && (
            <>
              <TextArea
                label="Prompt / Instruction *"
                placeholder="Generate realistic user profiles for a new social media app."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value, description: e.target.value })}
                rows={2}
                helper="Clear instruction telling the AI model what to generate"
              />

              <TextArea
                label="Input Data (JSON) - Optional"
                placeholder='{"industries": ["technology", "fashion", "gaming"], "regions": ["India", "USA"]}'
                value={formData.inputDataJson}
                onChange={(e) => setFormData({ ...formData, inputDataJson: e.target.value })}
                rows={4}
                helper="Provide optional structured input data in JSON format"
              />

              <TextArea
                label="Output Schema (JSON) *"
                placeholder='{"user": {"name": "str", "age": "int", "city": "str", "interests": ["str"]}}'
                value={formData.outputSchemaJson}
                onChange={(e) => setFormData({ ...formData, outputSchemaJson: e.target.value })}
                rows={4}
                helper="Define the exact JSON structure for each generated item"
              />

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Samples *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.sampleCount}
                    onChange={(e) => setFormData({ ...formData, sampleCount: e.target.value })}
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tone of Voice
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.toneOfVoice}
                    onChange={(e) => setFormData({ ...formData, toneOfVoice: e.target.value })}
                  >
                    <option value="neutral">Neutral</option>
                    <option value="formal">Formal</option>
                    <option value="creative">Creative</option>
                    <option value="technical">Technical</option>
                    <option value="casual">Casual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Length (Tokens)
                  </label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.maxLength}
                    onChange={(e) => setFormData({ ...formData, maxLength: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </>
          )}

          {/* CSV/TABULAR FIELDS */}
          {formData.dataType === 'csv' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Schema Definition Method *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="schemaMethod"
                      value="manual"
                      checked={formData.schemaDefinitionMethod === 'manual'}
                      onChange={(e) => setFormData({ ...formData, schemaDefinitionMethod: e.target.value })}
                      className="mr-2"
                    />
                    Define Schema Manually
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="schemaMethod"
                      value="upload"
                      checked={formData.schemaDefinitionMethod === 'upload'}
                      onChange={(e) => setFormData({ ...formData, schemaDefinitionMethod: e.target.value })}
                      className="mr-2"
                    />
                    Upload File with Headers
                  </label>
                </div>
              </div>

              {formData.schemaDefinitionMethod === 'manual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Manual Schema Builder *
                  </label>
                  <div className="space-y-2">
                    {formData.manualSchema.map((col, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Column Name"
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          value={col.columnName}
                          onChange={(e) => {
                            const newSchema = [...formData.manualSchema];
                            newSchema[index].columnName = e.target.value;
                            setFormData({ ...formData, manualSchema: newSchema });
                          }}
                        />
                        <select
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                          value={col.dataType}
                          onChange={(e) => {
                            const newSchema = [...formData.manualSchema];
                            newSchema[index].dataType = e.target.value;
                            setFormData({ ...formData, manualSchema: newSchema });
                          }}
                        >
                          <option value="string">String</option>
                          <option value="integer">Integer</option>
                          <option value="float">Float</option>
                          <option value="boolean">Boolean</option>
                          <option value="date">Date</option>
                        </select>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            const newSchema = formData.manualSchema.filter((_, i) => i !== index);
                            setFormData({ ...formData, manualSchema: newSchema });
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...formData,
                          manualSchema: [...formData.manualSchema, { columnName: '', dataType: 'string' }]
                        });
                      }}
                    >
                      + Add Column
                    </Button>
                  </div>
                </div>
              )}

              {formData.schemaDefinitionMethod === 'upload' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Schema File *
                  </label>
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    onChange={(e) => setFormData({ ...formData, schemaFile: e.target.files[0] })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload a CSV or JSON file with headers to define the schema</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Rows to Generate *
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.numberOfRows}
                    onChange={(e) => setFormData({ ...formData, numberOfRows: parseInt(e.target.value), sampleCount: e.target.value })}
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Sample Data (Optional but Recommended)
                  </label>
                  <input
                    type="file"
                    accept=".csv"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    onChange={(e) => setFormData({ ...formData, sampleDataFile: e.target.files[0] })}
                  />
                  <p className="text-sm text-gray-500 mt-1">Upload a small sample for realistic data generation</p>
                </div>
              </div>
            </>
          )}

          {/* AUDIO FIELDS */}
          {formData.dataType === 'audio' && (
            <>
              <TextArea
                label="Text to Synthesize *"
                placeholder="Welcome to the decentralized data marketplace. Your request is now being processed."
                value={formData.textToSynthesize}
                onChange={(e) => setFormData({ ...formData, textToSynthesize: e.target.value, description: e.target.value, sampleCount: '1' })}
                rows={3}
                helper="The exact text you want the AI to speak"
              />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice / Speaker *
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.voiceSpeaker}
                    onChange={(e) => setFormData({ ...formData, voiceSpeaker: e.target.value })}
                  >
                    <option value="male-deep">Male - Deep</option>
                    <option value="female-professional">Female - Professional</option>
                    <option value="narrator-calm">Narrator - Calm</option>
                    <option value="male-energetic">Male - Energetic</option>
                    <option value="female-friendly">Female - Friendly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emotion / Style
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    value={formData.emotionStyle}
                    onChange={(e) => setFormData({ ...formData, emotionStyle: e.target.value })}
                  >
                    <option value="neutral">Neutral</option>
                    <option value="happy">Happy</option>
                    <option value="sad">Sad</option>
                    <option value="angry">Angry</option>
                    <option value="excited">Excited</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speech Rate: {formData.speechRate}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  className="w-full"
                  value={formData.speechRate}
                  onChange={(e) => setFormData({ ...formData, speechRate: parseFloat(e.target.value) })}
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>0.5x (Slower)</span>
                  <span>1.0x (Normal)</span>
                  <span>2.0x (Faster)</span>
                </div>
              </div>
            </>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAndGenerate} loading={creating} disabled={!formData.dataType}>
              <Database className="h-4 w-4 mr-2" />
              Generate Dataset
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;
