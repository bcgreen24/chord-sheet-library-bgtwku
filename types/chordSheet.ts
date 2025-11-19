
export interface ChordSheet {
  id: string;
  title: string;
  artist: string;
  content: string;
  key?: string;
  tempo?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Setlist {
  id: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt: number;
  updatedAt: number;
}
