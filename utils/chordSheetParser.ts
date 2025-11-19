
import { ChordSheet } from '@/types/chordSheet';
import { isPDFFile } from './pdfParser';

/**
 * Parse a chord sheet file and extract text content
 * For PDFs, returns metadata only (no text extraction)
 * For text files, reads the content directly
 */
export const parseChordSheetFile = async (
  uri: string,
  fileName: string,
  mimeType?: string
): Promise<{ content: string; isPDF: boolean; pdfUri?: string }> => {
  try {
    // Check if it's a PDF file
    if (isPDFFile(fileName, mimeType)) {
      console.log('Detected PDF file, storing reference...');
      return {
        content: '',
        isPDF: true,
        pdfUri: uri,
      };
    }
    
    // For text files, read directly
    console.log('Reading text file...');
    const response = await fetch(uri);
    const content = await response.text();
    return {
      content,
      isPDF: false,
    };
  } catch (error) {
    console.error('Error parsing chord sheet file:', error);
    throw error;
  }
};

/**
 * Parse a chord sheet file content and extract metadata
 * Supports basic text format and ChordPro format
 */
export const parseChordSheetContent = (content: string, fileName: string): Partial<ChordSheet> => {
  const lines = content.split('\n');
  let title = '';
  let artist = '';
  let key = '';
  let tempo = '';
  let parsedContent = content;

  // Try to parse ChordPro format first
  const chordProRegex = /\{([^:]+):([^}]+)\}/g;
  let match;
  const metadata: Record<string, string> = {};

  while ((match = chordProRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase().trim();
    const value = match[2].trim();
    metadata[tag] = value;
  }

  // Extract metadata from ChordPro tags
  title = metadata['title'] || metadata['t'] || '';
  artist = metadata['artist'] || metadata['subtitle'] || metadata['st'] || '';
  key = metadata['key'] || '';
  tempo = metadata['tempo'] || '';

  // If no ChordPro metadata found, try to parse from first few lines
  if (!title && lines.length > 0) {
    // Look for title in first 5 lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      // Check for common title patterns
      if (line.toLowerCase().startsWith('title:')) {
        title = line.substring(6).trim();
      } else if (line.toLowerCase().startsWith('song:')) {
        title = line.substring(5).trim();
      } else if (i === 0 && line && !line.startsWith('[') && !line.startsWith('#')) {
        // First non-empty line might be the title
        title = line;
      }
    }
  }

  // Look for artist in first 5 lines
  if (!artist && lines.length > 1) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      
      if (line.toLowerCase().startsWith('artist:')) {
        artist = line.substring(7).trim();
      } else if (line.toLowerCase().startsWith('by:')) {
        artist = line.substring(3).trim();
      }
    }
  }

  // Look for key and tempo
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim().toLowerCase();
    
    if (line.startsWith('key:')) {
      key = lines[i].substring(4).trim();
    } else if (line.startsWith('tempo:')) {
      tempo = lines[i].substring(6).trim();
    } else if (line.startsWith('bpm:')) {
      tempo = lines[i].substring(4).trim();
    }
  }

  // If still no title, use filename
  if (!title) {
    title = fileName.replace(/\.(txt|chordpro|cho|crd|pro|pdf)$/i, '');
  }

  // If still no artist, use "Unknown Artist"
  if (!artist) {
    artist = 'Unknown Artist';
  }

  return {
    title,
    artist,
    key: key || undefined,
    tempo: tempo || undefined,
    content: parsedContent,
  };
};

/**
 * Validate if the content looks like a chord sheet
 */
export const isValidChordSheet = (content: string, isPDF: boolean = false): boolean => {
  // PDFs are always valid
  if (isPDF) {
    return true;
  }

  if (!content || content.trim().length === 0) {
    return false;
  }

  // Check for common chord patterns
  const chordPattern = /\b[A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]?\b/;
  const chordProPattern = /\{[^}]+\}/;
  
  // Check if content has chords or ChordPro tags
  return chordPattern.test(content) || chordProPattern.test(content);
};
