
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker for PDF.js
// For React Native, we need to use the legacy build
if (typeof window !== 'undefined') {
  // Web environment
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extract text content from a PDF file
 * @param uri - The URI of the PDF file
 * @returns Promise<string> - The extracted text content
 */
export const extractTextFromPDF = async (uri: string): Promise<string> => {
  try {
    console.log('Extracting text from PDF:', uri);
    
    // Fetch the PDF file
    const response = await fetch(uri);
    const arrayBuffer = await response.arrayBuffer();
    
    // Load the PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log('PDF loaded, pages:', pdf.numPages);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
      console.log(`Extracted text from page ${pageNum}`);
    }
    
    console.log('Total text extracted:', fullText.length, 'characters');
    return fullText.trim();
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF. The file may be corrupted or password-protected.');
  }
};

/**
 * Check if a file is a PDF based on its name or MIME type
 */
export const isPDFFile = (fileName: string, mimeType?: string): boolean => {
  const isPDFExtension = fileName.toLowerCase().endsWith('.pdf');
  const isPDFMimeType = mimeType === 'application/pdf';
  return isPDFExtension || isPDFMimeType;
};
