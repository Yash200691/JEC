import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import blockchainService from '../services/blockchainService';
import apiService from '../services/apiService';
import { Button, Card, Badge, Loader, EmptyState, Alert } from '../components/UI';
import { formatAddress, formatDate, getStatusColor } from '../utils/helpers';
import { Package, RefreshCw, Eye, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const SellerDashboard = () => {
  const { account, isConnected } = useWallet();
  const navigate = useNavigate();
  
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isConnected && account) {
      loadSubmissions();
    }
  }, [isConnected, account]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const submissionIds = await blockchainService.getSellerSubmissions(account);
      
      const submissionsData = await Promise.all(
        submissionIds.map(id => blockchainService.getSubmission(id))
      );
      
      setSubmissions(submissionsData.reverse());
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const calculateEarnings = () => {
    // In a real app, you would calculate actual earnings from paid submissions
    return submissions.filter(s => s.status === 3).length;
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert type="warning">
          Please connect your wallet to view your seller dashboard
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your submissions and earnings</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={loadSubmissions}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/marketplace')}>
            <Package className="h-4 w-4 mr-2" />
            Browse Requests
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{submissions.length}</p>
            </div>
            <Package className="h-10 w-10 text-primary-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {submissions.filter(s => s.status === 0).length}
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
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {submissions.filter(s => s.status === 1 || s.status === 3).length}
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
              <p className="text-sm text-gray-600">Paid</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {calculateEarnings()}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Submissions List */}
      {loading ? (
        <Card className="p-12">
          <Loader size="lg" className="mx-auto" />
        </Card>
      ) : submissions.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No submissions yet"
            description="Browse open requests and submit your first dataset"
            icon={<Package className="h-12 w-12" />}
            action={
              <Button onClick={() => navigate('/marketplace')}>
                <Package className="h-4 w-4 mr-2" />
                Browse Requests
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Submission #{submission.id}
                    </h3>
                    <Badge variant={getStatusColor(blockchainService.submissionStatusToString(submission.status))}>
                      {blockchainService.submissionStatusToString(submission.status)}
                    </Badge>
                    <Badge variant="bg-gray-100 text-gray-800 border-gray-200">
                      {blockchainService.formatToString(submission.format)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Request ID:</span>
                      <span className="font-semibold text-gray-900 ml-2">#{submission.requestId}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Samples:</span>
                      <span className="font-semibold text-gray-900 ml-2">{submission.sampleCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {formatDate(submission.createdAt)}
                      </span>
                    </div>
                    {submission.qualityChecked && (
                      <div>
                        <span className="text-gray-600">QA:</span>
                        <span className="font-semibold text-green-600 ml-2">✓ Verified</span>
                      </div>
                    )}
                  </div>

                  {submission.datasetReference && (
                    <p className="text-xs text-gray-500">
                      Reference: {submission.datasetReference}
                    </p>
                  )}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/request/${submission.requestId}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Request
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
