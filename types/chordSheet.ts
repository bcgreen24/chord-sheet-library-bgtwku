
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
  isNashvilleChart?: boolean;
  nashvilleData?: NashvilleChartData;
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface NashvilleSection {
  name: string;
  measures: string[][]; // Each inner array is a line of measures (chords)
}

export interface NashvilleChartData {
  sections: NashvilleSection[];
}
