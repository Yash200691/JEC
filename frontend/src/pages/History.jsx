import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import apiService from '../services/apiService';
import { Button, Card, Badge, Loader, EmptyState, Alert } from '../components/UI';
import { formatDate, getStatusColor } from '../utils/helpers';
import { History as HistoryIcon, Eye, FileText, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const History = () => {
  const { account, isConnected } = useWallet();
  const navigate = useNavigate();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    avgScore: 0,
  });

  useEffect(() => {
    if (isConnected && account) {
      loadHistory();
    }
  }, [isConnected, account]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBuyerHistory(account);
      
      if (response.success) {
        const { requests, totalRequests } = response.data;
        setHistory(requests);
        
        // Calculate stats
        const completed = requests.filter(r => r.qaReport).length;
        const pending = totalRequests - completed;
        const avgScore = completed > 0 
          ? Math.round(requests.reduce((sum, r) => sum + (r.qualityScore || 0), 0) / completed)
          : 0;
        
        setStats({
          total: totalRequests,
          completed,
          pending,
          avgScore,
        });
      }
    } catch (error) {
      console.error('Error loading history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      0: 'Open',
      1: 'In Progress',
      2: 'Completed',
      3: 'Disputed',
      4: 'Cancelled',
    };
    return statusMap[status] || 'Unknown';
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert type="warning">
          Please connect your wallet to view your history
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <HistoryIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Request History</h1>
        </div>
        <p className="text-gray-600">View all your past requests and their results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Requests</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <HistoryIcon className="h-10 w-10 text-primary-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <Calendar className="h-10 w-10 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg QA Score</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.avgScore}/100</p>
            </div>
            <TrendingUp className="h-10 w-10 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* History List */}
      {loading ? (
        <Card className="p-12">
          <Loader size="lg" className="mx-auto" />
        </Card>
      ) : history.length === 0 ? (
        <Card className="p-6">
          <EmptyState
            title="No history yet"
            description="Your request history will appear here"
            icon={<HistoryIcon className="h-12 w-12" />}
            action={
              <Button onClick={() => navigate('/dashboard')}>
                Create First Request
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.requestId} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Request #{item.requestId}
                    </h3>
                    <Badge variant={getStatusColor(getStatusText(item.status))}>
                      {getStatusText(item.status)}
                    </Badge>
                    {item.qaReport && (
                      <Badge variant="bg-blue-100 text-blue-800 border-blue-200">
                        <FileText className="h-3 w-3 mr-1" />
                        QA Report Available
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-700 mb-4">{item.description}</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    
                    {item.qualityScore > 0 && (
                      <div>
                        <span className="text-gray-600">QA Score:</span>
                        <span className={`font-semibold ml-2 ${
                          item.qualityScore >= 85 ? 'text-green-600' :
                          item.qualityScore >= 70 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {item.qualityScore}/100
                        </span>
                      </div>
                    )}
                    
                    {item.submission && (
                      <div>
                        <span className="text-gray-600">Samples:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {item.submission.sampleCount}
                        </span>
                      </div>
                    )}
                    
                    {item.submission && (
                      <div>
                        <span className="text-gray-600">Size:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {(item.submission.fileSize / 1024).toFixed(2)} KB
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {item.qaReport && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">QA Summary:</h4>
                      <p className="text-sm text-blue-800">{item.qaReport.summary}</p>
                      
                      {item.qaReport.comparisonMetrics && (
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-700">Similarity:</span>
                            <span className="font-semibold text-blue-900 ml-2">
                              {(item.qaReport.comparisonMetrics.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700">Consistency:</span>
                            <span className="font-semibold text-blue-900 ml-2">
                              {(item.qaReport.comparisonMetrics.consistency * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700">Accuracy:</span>
                            <span className="font-semibold text-blue-900 ml-2">
                              {(item.qaReport.comparisonMetrics.accuracy * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate(`/request/${item.requestId}`)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
