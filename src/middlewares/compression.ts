/**
 * Custom Compression Middleware Configuration
 */

import { CompressionOptions } from 'compression';

export const compressionOptions: CompressionOptions = {
  // Only compress responses larger than 1kb
  threshold: 1024,
  
  // Compression level (0-9, 6 is default)
  level: 6,
  
  // Filter function to decide what to compress
  filter: (req, res) => {
    // Don't compress if client doesn't accept encoding
    if (req.headers['x-no-compression']) {
      return false;
    }

    // Use default compression filter
    return true;
  },
};
