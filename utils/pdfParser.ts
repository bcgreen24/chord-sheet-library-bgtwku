
import { Platform } from 'react-native';

/**
 * Check if a file is a PDF based on its name or MIME type
 */
export const isPDFFile = (fileName: string, mimeType?: string): boolean => {
  const isPDFExtension = fileName.toLowerCase().endsWith('.pdf');
  const isPDFMimeType = mimeType === 'application/pdf';
  return isPDFExtension || isPDFMimeType;
};
