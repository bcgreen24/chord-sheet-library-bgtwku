
import { NashvilleChartData, NashvilleSection } from '@/types/chordSheet';

/**
 * Parse chord sheet content and extract chords organized by sections
 * This creates a Nashville chart format with section labels and chord progressions
 */
export const parseToNashvilleChart = (content: string): NashvilleChartData => {
  const lines = content.split('\n');
  const sections: NashvilleSection[] = [];
  let currentSection: NashvilleSection | null = null;
  
  // Common chord pattern - matches chords like C, Dm, G7, Cmaj7, etc.
  const chordPattern = /\b([A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]?)\b/g;
  
  // Section header patterns
  const sectionPattern = /^\[(.*?)\]|^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Tag|Ending)[\s:]/i;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      continue;
    }
    
    // Check if this is a section header
    const sectionMatch = line.match(sectionPattern);
    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection && currentSection.measures.length > 0) {
        sections.push(currentSection);
      }
      
      // Start new section
      const sectionName = sectionMatch[1] || sectionMatch[2] || 'Section';
      currentSection = {
        name: sectionName,
        measures: [],
      };
      continue;
    }
    
    // Extract chords from the line
    const chords: string[] = [];
    let match;
    
    // Reset regex
    chordPattern.lastIndex = 0;
    
    while ((match = chordPattern.exec(line)) !== null) {
      chords.push(match[1]);
    }
    
    // If we found chords, add them to current section
    if (chords.length > 0) {
      if (!currentSection) {
        // Create a default section if none exists
        currentSection = {
          name: 'Section',
          measures: [],
        };
      }
      
      // Group chords into measures (4 chords per line typically)
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
  
  // If no sections were found, create a default one
  if (sections.length === 0) {
    sections.push({
      name: 'Chart',
      measures: [],
    });
  }
  
  return { sections };
};

/**
 * Convert Nashville chart data back to a readable string format
 */
export const nashvilleChartToString = (data: NashvilleChartData): string => {
  let result = '';
  
  for (const section of data.sections) {
    result += `[${section.name}]\n`;
    
    for (const measureLine of section.measures) {
      result += measureLine.join('  |  ') + '\n';
    }
    
    result += '\n';
  }
  
  return result.trim();
};

/**
 * Validate if content has enough chords to create a Nashville chart
 */
export const hasEnoughChordsForNashville = (content: string): boolean => {
  const chordPattern = /\b([A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]?)\b/g;
  const matches = content.match(chordPattern);
  return matches !== null && matches.length >= 4;
};

/**
 * Extract just the chords from a chord sheet (removing lyrics)
 */
export const extractChordsOnly = (content: string): string => {
  const lines = content.split('\n');
  const chordLines: string[] = [];
  
  // Pattern to detect if a line is primarily chords
  const chordPattern = /\b([A-G](#|b)?(m|maj|min|dim|aug|sus|add)?[0-9]?)\b/g;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) {
      continue;
    }
    
    // Keep section headers
    if (trimmedLine.match(/^\[.*?\]|^(Verse|Chorus|Bridge|Intro|Outro|Pre-Chorus|Interlude|Solo|Tag|Ending)[\s:]/i)) {
      chordLines.push(trimmedLine);
      continue;
    }
    
    // Check if line contains chords
    const chords = trimmedLine.match(chordPattern);
    if (chords && chords.length > 0) {
      // Calculate chord density (chords vs total characters)
      const chordChars = chords.join('').length;
      const totalChars = trimmedLine.replace(/\s/g, '').length;
      
      // IfPerfect! Now I understand the current structure. Let me create the Nashville chart format. A Nashville chart typically displays:

1. **Section labels** on the left (Verse, Chorus, Bridge, etc.)
2. **Chord names** arranged in measures (typically 4 chords per line representing 4 bars)
3. **Clean, grid-like layout** with chords aligned

I'll need to:
1. Update the chord sheet parser to extract sections and chords (ignoring lyrics)
2. Update the ChordSheet type to support Nashville chart format
3. Update the display component to show Nashville chart layout

Let me implement these changes:

<write file="types/chordSheet.ts">
export interface ChordSheet {
  id: string;
  title: string;
  artist: string;
  content: string;
  key?: string;
  tempo?: string;
  createdAt: number;
  updatedAt: number;
  isPDF?: boolean;
  pdfUri?: string;
  nashvilleChart?: NashvilleChart;
}

export interface NashvilleChart {
  sections: NashvilleSection[];
}

export interface NashvilleSection {
  name: string;
  measures: string[][]; // Each measure is an array of chords
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}
