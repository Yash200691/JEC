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
    description: '',
    sampleData: '',
    dataType: '',
    sampleCount: '',
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
    if (!formData.description || !formData.dataType || !formData.sampleCount) {
      toast.error('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      // Step 1: Create blockchain request with minimal budget (0.001 ETH)
      const formatsMask = formatsArrayToMask([formData.dataType.toUpperCase()]);
      const budgetInEth = 0.001; // Minimal budget since it's AI-generated
      
      const { requestId } = await blockchainService.createRequest(
        formatsMask,
        formData.description,
        budgetInEth
      );

      toast.success(`Request created! ID: ${requestId}`);

      // Step 2: Immediately call backend to generate dataset
      toast.info('Generating dataset with AI...');
      
      const result = await apiService.generateAndVerify(
        requestId,
        formData.dataType.toLowerCase(),
        parseInt(formData.sampleCount),
        formData.description,
        true, // Auto-verify
        { sampleData: formData.sampleData } // Optional sample data
      );

      if (result.success) {
        toast.success('Dataset generated and verified!');
        setIsCreateModalOpen(false);
        setFormData({ description: '', sampleData: '', dataType: '', sampleCount: '' });
        await loadRequests();
        
        // Navigate to the request details to show the dataset
        navigate(`/request/${requestId}`);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert type="warning">
          Please connect your wallet to view your dashboard
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <Alert type="info">
            Describe what data you need. The AI will generate it instantly and provide a quality report.
          </Alert>

          <TextArea
            label="Description *"
            placeholder="e.g., Generate 100 speech audio samples for voice recognition training"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <TextArea
            label="Sample Data (Optional)"
            placeholder="Provide sample data or examples to guide the AI generation..."
            value={formData.sampleData}
            onChange={(e) => setFormData({ ...formData, sampleData: e.target.value })}
            rows={4}
            helper="Optional: Provide sample data to help the AI understand your requirements better"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type *
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                value={formData.dataType}
                onChange={(e) => setFormData({ ...formData, dataType: e.target.value })}
              >
                <option value="">Select type...</option>
                {availableFormats.map(format => (
                  <option key={format} value={format.toLowerCase()}>
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <Input
              type="number"
              label="Sample Count *"
              placeholder="100"
              value={formData.sampleCount}
              onChange={(e) => setFormData({ ...formData, sampleCount: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAndGenerate} loading={creating}>
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
