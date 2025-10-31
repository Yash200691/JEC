import React, { useState } from 'react';
import { Card, Badge, Loader } from './UI';
import { getFormatColor } from '../utils/helpers';
import { 
  Music, FileText, Image as ImageIcon, Video, FileSpreadsheet, Archive 
} from 'lucide-react';

/**
 * Dataset Viewer Component
 * Displays datasets from AI models based on format type
 */
const DatasetViewer = ({ dataset, format, datasetReference }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatIcons = {
    AUDIO: <Music className="h-6 w-6" />,
    CSV: <FileSpreadsheet className="h-6 w-6" />,
    IMAGE: <ImageIcon className="h-6 w-6" />,
    TEXT: <FileText className="h-6 w-6" />,
    VIDEO: <Video className="h-6 w-6" />,
    MIXED: <Archive className="h-6 w-6" />,
  };

  // Render based on format
  const renderDataset = () => {
    switch (format) {
      case 'AUDIO':
        return <AudioViewer datasetReference={datasetReference} />;
      case 'CSV':
        return <CSVViewer datasetReference={datasetReference} />;
      case 'IMAGE':
        return <ImageViewer datasetReference={datasetReference} />;
      case 'TEXT':
        return <TextViewer datasetReference={datasetReference} />;
      case 'VIDEO':
        return <VideoViewer datasetReference={datasetReference} />;
      case 'MIXED':
        return <MixedViewer datasetReference={datasetReference} />;
      default:
        return <DefaultViewer datasetReference={datasetReference} />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-primary-600">{formatIcons[format]}</div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Dataset Preview</h3>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={getFormatColor(format)}>{format}</Badge>
            {datasetReference && (
              <span className="text-xs text-gray-500">Ref: {datasetReference}</span>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
            <p className="font-medium">Error loading dataset</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : (
          renderDataset()
        )}
      </div>
    </Card>
  );
};

// Audio Viewer
const AudioViewer = ({ datasetReference }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Audio dataset preview. The audio files are stored off-chain.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <audio controls className="w-full">
          <source src={datasetReference} type="audio/mpeg" />
          Your browser does not support the audio element.
        </audio>
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would fetch actual audio files from your storage (S3, IPFS, etc.)
        </p>
      </div>
    </div>
  );
};

// CSV Viewer
const CSVViewer = ({ datasetReference }) => {
  const mockCSVData = [
    ['ID', 'Name', 'Value', 'Category'],
    ['1', 'Sample A', '123.45', 'Type 1'],
    ['2', 'Sample B', '678.90', 'Type 2'],
    ['3', 'Sample C', '345.67', 'Type 1'],
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        CSV dataset preview (showing first few rows)
      </p>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {mockCSVData[0].map((header, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockCSVData.slice(1).map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50">
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would fetch and parse actual CSV from your storage
        </p>
      </div>
    </div>
  );
};

// Image Viewer
const ImageViewer = ({ datasetReference }) => {
  const mockImages = [
    'https://via.placeholder.com/300x200/0ea5e9/ffffff?text=Sample+1',
    'https://via.placeholder.com/300x200/0369a1/ffffff?text=Sample+2',
    'https://via.placeholder.com/300x200/075985/ffffff?text=Sample+3',
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Image dataset preview (showing sample images)
      </p>
      <div className="grid grid-cols-3 gap-4">
        {mockImages.map((src, idx) => (
          <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden">
            <img src={src} alt={`Sample ${idx + 1}`} className="w-full h-auto" />
          </div>
        ))}
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would fetch actual images from your storage
        </p>
      </div>
    </div>
  );
};

// Text Viewer
const TextViewer = ({ datasetReference }) => {
  const mockText = `This is a sample text dataset generated by the AI model.

The text contains multiple paragraphs and demonstrates the format of the generated content.

In production, this would show the actual text data stored off-chain in your storage system (S3, seller servers, etc.).`;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Text dataset preview
      </p>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <pre className="whitespace-pre-wrap text-sm text-gray-900 font-mono">
          {mockText}
        </pre>
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would fetch actual text files from your storage
        </p>
      </div>
    </div>
  );
};

// Video Viewer
const VideoViewer = ({ datasetReference }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Video dataset preview. The video files are stored off-chain.
      </p>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <video controls className="w-full rounded-lg">
          <source src={datasetReference} type="video/mp4" />
          Your browser does not support the video element.
        </video>
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would fetch actual video files from your storage
        </p>
      </div>
    </div>
  );
};

// Mixed Format Viewer
const MixedViewer = ({ datasetReference }) => {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Mixed format dataset (contains multiple types of files)
      </p>
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <div className="flex items-center justify-center py-8">
          <Archive className="h-16 w-16 text-gray-400" />
        </div>
        <p className="text-center text-sm text-gray-700">
          This dataset contains multiple file formats
        </p>
      </div>
      <div className="text-sm text-gray-500">
        <p><strong>Reference:</strong> {datasetReference}</p>
        <p className="mt-2 text-xs">
          💡 In production, this would show a file browser for the mixed content
        </p>
      </div>
    </div>
  );
};

// Default Viewer
const DefaultViewer = ({ datasetReference }) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-700">Dataset preview not available</p>
        <p className="text-sm text-gray-500 mt-2">
          Reference: {datasetReference}
        </p>
      </div>
    </div>
  );
};

export default DatasetViewer;
