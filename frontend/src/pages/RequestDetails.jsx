import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import blockchainService from '../services/blockchainService';
import apiService from '../services/apiService';
import { Button, Card, Badge, Loader, Alert, Modal, Input, TextArea } from '../components/UI';
import DatasetViewer from '../components/DatasetViewer';
import QAReportViewer from '../components/QAReportViewer';
import { formatAddress, formatDate, formatFileSize, getStatusColor, getFormatColor, formatsMaskToArray } from '../utils/helpers';
import { ArrowLeft, Send, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const RequestDetails = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();
  
  const [request, setRequest] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Submit form data
  const [submitData, setSubmitData] = useState({
    dataType: '',
    sampleCount: '',
  });

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    }
  }, [requestId]);

  const loadRequestDetails = async () => {
    try {
      setLoading(true);
      
      // Get request details
      const requestData = await blockchainService.getRequest(requestId);
      setRequest(requestData);

      // Get finalized submission if exists
      if (requestData.finalizedSubmissionId !== '0') {
        const submission = await blockchainService.getSubmission(requestData.finalizedSubmissionId);
        setSubmissions([submission]);
        setSelectedSubmission(submission);
      }
    } catch (error) {
      console.error('Error loading request:', error);
      toast.error('Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDataset = async () => {
    if (!submitData.dataType || !submitData.sampleCount) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsGenerating(true);

    try {
      // Call backend to generate dataset and submit to blockchain
      const result = await apiService.generateAndVerify(
        requestId,
        submitData.dataType,
        parseInt(submitData.sampleCount),
        request.description,
        true // Auto-verify
      );

      toast.success('Dataset submitted and verified successfully!');
      setIsSubmitModalOpen(false);
      await loadRequestDetails();
    } catch (error) {
      console.error('Error submitting dataset:', error);
      toast.error(error.message || 'Failed to submit dataset');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-12">
          <Loader size="lg" className="mx-auto" />
        </Card>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Alert type="error">Request not found</Alert>
      </div>
    );
  }

  const acceptedFormats = formatsMaskToArray(request.formatsMask);
  const isBuyer = account && request.buyer.toLowerCase() === account.toLowerCase();
  const isOpen = request.status === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Request #{requestId}</h1>
            <p className="text-gray-600 mt-1">{formatDate(request.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusColor(blockchainService.requestStatusToString(request.status))}>
              {blockchainService.requestStatusToString(request.status)}
            </Badge>
            {isOpen && !isBuyer && (
              <Button onClick={() => setIsSubmitModalOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                Submit Dataset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Request Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Request Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-600">Description</label>
            <p className="text-gray-900 mt-1">{request.description}</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Accepted Formats</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {acceptedFormats.map(format => (
                <Badge key={format} variant={getFormatColor(format)}>
                  {format}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Budget</label>
            <p className="text-gray-900 mt-1 text-lg font-semibold">{request.budget} ETH</p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-600">Buyer</label>
            <p className="text-gray-900 mt-1 font-mono text-sm">{formatAddress(request.buyer)}</p>
          </div>
        </div>
      </Card>

      {/* Submissions */}
      {submissions.length > 0 && (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Submissions</h2>
          
          {submissions.map((submission) => (
            <Card key={submission.id} className="p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Submission #{submission.id}
                    </h3>
                    <Badge variant={getStatusColor(blockchainService.submissionStatusToString(submission.status))}>
                      {blockchainService.submissionStatusToString(submission.status)}
                    </Badge>
                    <Badge variant={getFormatColor(blockchainService.formatToString(submission.format))}>
                      {blockchainService.formatToString(submission.format)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Seller:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {formatAddress(submission.seller)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Samples:</span>
                      <span className="font-semibold text-gray-900 ml-2">{submission.sampleCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File Size:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {formatFileSize(submission.fileSize)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Extensions:</span>
                      <span className="font-semibold text-gray-900 ml-2">{submission.fileExtensions}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dataset Preview */}
              <div className="mt-6">
                <DatasetViewer
                  format={blockchainService.formatToString(submission.format)}
                  datasetReference={submission.datasetReference}
                />
              </div>
            </Card>
          ))}

          {/* QA Report */}
          {request.qualityReportCid && request.qualityReportCid !== '' && (
            <QAReportViewer
              qualityReportCid={request.qualityReportCid}
              qualityScore={request.qualityScore}
            />
          )}
        </>
      )}

      {/* No Submissions */}
      {submissions.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No submissions yet for this request</p>
          {isOpen && !isBuyer && (
            <Button onClick={() => setIsSubmitModalOpen(true)} className="mt-4">
              <Send className="h-4 w-4 mr-2" />
              Be the first to submit
            </Button>
          )}
        </Card>
      )}

      {/* Submit Dataset Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Dataset"
      >
        <div className="space-y-4">
          <Alert type="info">
            This will generate a dataset using the AI model and automatically submit it to the blockchain for verification.
          </Alert>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              value={submitData.dataType}
              onChange={(e) => setSubmitData({ ...submitData, dataType: e.target.value })}
            >
              <option value="">Select format...</option>
              {acceptedFormats.map(format => (
                <option key={format} value={format.toLowerCase()}>
                  {format}
                </option>
              ))}
            </select>
          </div>

          <Input
            type="number"
            label="Sample Count"
            placeholder="100"
            value={submitData.sampleCount}
            onChange={(e) => setSubmitData({ ...submitData, sampleCount: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitDataset} loading={isGenerating}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Generate & Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequestDetails;
