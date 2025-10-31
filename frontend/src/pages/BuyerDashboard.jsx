import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import blockchainService from '../services/blockchainService';
import { Button, Card, Badge, Loader, EmptyState, Modal, Input, TextArea, Alert } from '../components/UI';
import { formatAddress, formatDate, getStatusColor, formatsArrayToMask } from '../utils/helpers';
import { Plus, ShoppingBag, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const BuyerDashboard = () => {
  const { account, isConnected } = useWallet();
  const navigate = useNavigate();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: '',
    budget: '',
    formats: [],
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

  const handleCreateRequest = async () => {
    if (!formData.description || !formData.budget || formData.formats.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }

    setCreating(true);

    try {
      const formatsMask = formatsArrayToMask(formData.formats);
      const result = await blockchainService.createRequest(
        formatsMask,
        formData.description,
        formData.budget
      );

      toast.success(`Request created! ID: ${result.requestId}`);
      setIsCreateModalOpen(false);
      setFormData({ description: '', budget: '', formats: [] });
      await loadRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Failed to create request');
    } finally {
      setCreating(false);
    }
  };

  const toggleFormat = (format) => {
    setFormData(prev => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format]
    }));
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert type="warning">
          Please connect your wallet to view your buyer dashboard
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your data requests and submissions</p>
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
            <ShoppingBag className="h-10 w-10 text-primary-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => r.status === 0).length}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-green-600 rounded-full" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Closed Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {requests.filter(r => r.status === 1).length}
              </p>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-gray-600 rounded-full" />
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
            description="Create your first data request to get started"
            icon={<ShoppingBag className="h-12 w-12" />}
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
                  </div>
                  
                  <p className="text-gray-700 mb-3">{request.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-semibold text-gray-900 ml-2">{request.budget} ETH</span>
                    </div>
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
        title="Create New Request"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          <TextArea
            label="Description"
            placeholder="Describe the data you need..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />

          <Input
            type="number"
            label="Budget (ETH)"
            placeholder="0.1"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Accepted Formats
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableFormats.map(format => (
                <button
                  key={format}
                  onClick={() => toggleFormat(format)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    formData.formats.includes(format)
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRequest} loading={creating}>
              Create Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default BuyerDashboard;
