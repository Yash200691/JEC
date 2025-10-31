import React, { useState, useEffect } from 'react';
import { Card, Badge, Loader, Alert } from './UI';
import ipfsService from '../services/ipfsService';
import { FileCheck, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';

/**
 * QA Report Viewer Component
 * Fetches and displays QA reports from IPFS
 */
const QAReportViewer = ({ qualityReportCid, qualityScore }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (qualityReportCid && qualityReportCid !== '') {
      fetchReport();
    } else {
      setLoading(false);
    }
  }, [qualityReportCid]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ipfsService.getQAReport(qualityReportCid);
      setReport(data);
    } catch (err) {
      console.error('Error fetching QA report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!qualityReportCid || qualityReportCid === '') {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileCheck className="h-6 w-6 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Report</h3>
        </div>
        <Alert type="info">
          No quality report available yet. The submission is pending verification.
        </Alert>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileCheck className="h-6 w-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">Quality Report</h3>
        </div>
        {qualityScore !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Score:</span>
            <Badge variant={getScoreBadgeColor(qualityScore)}>
              {qualityScore}/100
            </Badge>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader size="lg" />
          <span className="ml-3 text-gray-600">Loading report from IPFS...</span>
        </div>
      ) : error ? (
        <Alert type="error">
          <p className="font-medium">Failed to load QA report</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={fetchReport}
            className="mt-3 text-sm font-medium underline hover:no-underline"
          >
            Try again
          </button>
        </Alert>
      ) : report ? (
        <div className="space-y-6">
          {/* IPFS CID */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-600">IPFS CID:</span>
              <code className="text-xs text-gray-900 bg-white px-2 py-1 rounded">
                {qualityReportCid}
              </code>
            </div>
          </div>

          {/* Summary */}
          {report.summary && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
              <p className="text-gray-900 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {report.summary}
              </p>
            </div>
          )}

          {/* Metrics */}
          {report.metrics && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Quality Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(report.metrics).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {(value * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${value * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issues */}
          {report.issues && report.issues.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                Issues Found
              </h4>
              <ul className="space-y-2">
                {report.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <XCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-yellow-900">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {report.recommendations && report.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-600" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {report.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-blue-900">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verification Timestamp */}
          {report.verifiedAt && (
            <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
              Verified at: {new Date(report.verifiedAt).toLocaleString()}
            </div>
          )}

          {/* View on IPFS link */}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <a
              href={ipfsService.getGatewayURL(qualityReportCid)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View raw report on IPFS
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      ) : (
        <Alert type="warning">
          Report data is empty or invalid
        </Alert>
      )}
    </Card>
  );
};

// Helper function to get badge color based on score
const getScoreBadgeColor = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  return 'bg-red-100 text-red-800 border-red-200';
};

export default QAReportViewer;
