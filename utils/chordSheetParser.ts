
import { ChordSheet, NashvilleChart, NashvilleSection } from '@/types/chordSheet';
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
  const chordPattern = /\b[A-G](#|b|♯|♭)?(m|maj|min|dim|aug|sus|add)?[0-9]?\b/;
  const chordProPattern = /\{[^}]+\}/;
  
  // Check if content has chords or ChordPro tags
  return chordPattern.test(content) || chordProPattern.test(content);
};

/**
 * Extract chords from a line of text
 * Matches common chord patterns like C, Dm, G7, F#m, Bb, etc.
 */
const extractChordsFromLine = (line: string): string[] => {
  const chords: string[] = [];
  
  // Enhanced chord pattern to match various chord formats
  // Matches: C, Cm, Cmaj7, C#m, Db, F/G, Gsus4, etc.
  const chordPattern = /\b([A-G](#|b|♯|♭)?(m|maj|min|dim|aug|sus|add)?[0-9]?(\/[A-G](#|b|♯|♭)?)?)\b/g;
  
  let match;
  while ((match = chordPattern.exec(line)) !== null) {
    const chord = match[1].trim();
    // Filter out common false positives (single letters that might be lyrics)
    if (chord.length > 1 || ['A', 'I'].includes(chord)) {
      chords.push(chord);
    }
  }
  
  return chords;
};

/**
 * Check if a line is likely a lyrics line (not chords)
 */
const isLyricsLine = (line: string): boolean => {
  // Lines with lots of lowercase letters and spaces are likely lyrics
  const lowerCaseCount = (line.match(/[a-z]/g) || []).length;
  const upperCaseCount = (line.match(/[A-G]/g) || []).length;
  const totalLetters = lowerCaseCount + upperCaseCount;
  
  // If more than 60% lowercase, it's probably lyrics
  if (totalLetters > 0 && lowerCaseCount / totalLetters > 0.6) {
    return true;
  }
  
  // Check for common lyric words
  const lyricWords = /\b(the|and|you|me|my|your|love|heart|time|day|night|way|life|know|see|feel|want|need|come|go|take|make|give|tell|say|think|look|find|keep|hold|stay|leave|turn|walk|run|sing|dance|play|dream|hope|wish|believe)\b/i;
  if (lyricWords.test(line)) {
    return true;
  }
  
  return false;
};

/**
 * Parse chord sheet content into Nashville chart format
 * Extracts sections and their chord progressions, ignoring lyrics
 */
export const parseToNashvilleChart = (content: string): NashvilleChart => {
  const lines = content.split('\n');
  const sections: NashvilleSection[] = [];
  let currentSection: NashvilleSection | null = null;
  
  // Section name patterns - matches [Verse], [Chorus], or standalone section names
  const sectionPattern = /^\[([^\]]+)\]|^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Tag|Ending|Refrain|Hook|Coda|Instrumental)[\s:]*(\d*)/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and metadata lines
    if (!line || 
        line.toLowerCase().startsWith('title:') ||
        line.toLowerCase().startsWith('artist:') ||
        line.toLowerCase().startsWith('key:') ||
        line.toLowerCase().startsWith('tempo:') ||
        line.toLowerCase().startsWith('bpm:') ||
        line.toLowerCase().startsWith('by:') ||
        line.toLowerCase().startsWith('capo:')) {
      continue;
    }
    
    // Check if this is a section header
    const sectionMatch = line.match(sectionPattern);
    if (sectionMatch) {
      // Save previous section if it exists and has chords
      if (currentSection && currentSection.measures.length > 0) {
        sections.push(currentSection);
      }
      
      // Start new section
      const sectionName = (sectionMatch[1] || sectionMatch[2]).trim();
      const sectionNumber = sectionMatch[3] || '';
      const fullSectionName = sectionNumber ? `${sectionName} ${sectionNumber}` : sectionName;
      
      currentSection = {
        name: fullSectionName,
        measures: [],
      };
      continue;
    }
    
    // Skip lines that are clearly lyrics
    if (isLyricsLine(line)) {
      continue;
    }
    
    // Extract chords from the line
    const chords = extractChordsFromLine(line);
    
    if (chords.length > 0) {
      // If no section has been started, create a default one
      if (!currentSection) {
        currentSection = {
          name: 'Chart',
          measures: [],
        };
      }
      
      // Group chords into measures (4 chords per measure line)
      const measuresPerLine = 4;
      for (let j = 0; j < chords.length; j += measuresPerLine) {
        const measureLine = chords.slice(j, j + measuresPerLine);
        currentSection.measures.push(measureLine);
      }
    }
  }
  
  // Add the last section
  if (currentSection && currentSection.measures.length > 0) {
    sections.push(currentSection);
  }
  
  // If no sections were found but we have content, try to extract all chords
  if (sections.length === 0) {
    const allChords: string[] = [];
    for (const line of lines) {
      if (!isLyricsLine(line)) {
        const chords = extractChordsFromLine(line);
        allChords.push(...chords);
      }
    }
    
    if (allChords.length > 0) {
      const measures: string[][] = [];
      for (let j = 0; j < allChords.length; j += 4) {
        measures.push(allChords.slice(j, j + 4));
      }
      
      sections.push({
        name: 'Chart',
        measures,
      });
    }
  }
  
  return { sections };
};

/**
 * Convert Nashville chart back to string format
 */
export const nashvilleChartToString = (chart: NashvilleChart): string => {
  let result = '';
  
  for (const section of chart.sections) {
    result += `[${section.name}]\n`;
    
    for (const measureLine of section.measures) {
      result += measureLine.join('  ') + '\n';
    }
    
    result += '\n';
  }
  
  return result.trim();
};
