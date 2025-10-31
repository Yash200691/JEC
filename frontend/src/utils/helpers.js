/**
 * Utility functions for the frontend
 */

/**
 * Format Ethereum address to short format
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Format timestamp to readable date
 */
export const formatDate = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format file size to human readable
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || bytes === '0') return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Get status color for badges
 */
export const getStatusColor = (status) => {
  const statusColors = {
    OPEN: 'bg-green-100 text-green-800 border-green-200',
    CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVED: 'bg-green-100 text-green-800 border-green-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    PAID: 'bg-blue-100 text-blue-800 border-blue-200',
    REFUNDED: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  
  return statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get format badge color
 */
export const getFormatColor = (format) => {
  const formatColors = {
    AUDIO: 'bg-purple-100 text-purple-800 border-purple-200',
    CSV: 'bg-blue-100 text-blue-800 border-blue-200',
    IMAGE: 'bg-pink-100 text-pink-800 border-pink-200',
    TEXT: 'bg-gray-100 text-gray-800 border-gray-200',
    VIDEO: 'bg-red-100 text-red-800 border-red-200',
    MIXED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  
  return formatColors[format] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Convert formats mask to array of format names
 */
export const formatsMaskToArray = (mask) => {
  const formats = ['AUDIO', 'CSV', 'IMAGE', 'TEXT', 'VIDEO', 'MIXED'];
  const result = [];
  
  for (let i = 0; i < formats.length; i++) {
    if (mask & (1 << i)) {
      result.push(formats[i]);
    }
  }
  
  return result;
};

/**
 * Convert array of format names to formats mask
 */
export const formatsArrayToMask = (formatsArray) => {
  const formats = ['AUDIO', 'CSV', 'IMAGE', 'TEXT', 'VIDEO', 'MIXED'];
  let mask = 0;
  
  formatsArray.forEach(format => {
    const index = formats.indexOf(format);
    if (index !== -1) {
      mask |= (1 << index);
    }
  });
  
  return mask;
};

/**
 * Validate Ethereum address
 */
export const isValidAddress = (address) => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Sleep utility for delays
 */
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};
