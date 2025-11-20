
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChordSheet, Setlist } from '@/types/chordSheet';

const CHORD_SHEETS_KEY = '@chord_sheets';
const SETLISTS_KEY = '@setlists';

// Chord Sheets Storage
export const saveChordSheets = async (sheets: ChordSheet[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CHORD_SHEETS_KEY, JSON.stringify(sheets));
    console.log('Chord sheets saved successfully');
  } catch (error) {
    console.error('Error saving chord sheets:', error);
    throw error;
  }
};

export const loadChordSheets = async (): Promise<ChordSheet[]> => {
  try {
    const data = await AsyncStorage.getItem(CHORD_SHEETS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading chord sheets:', error);
    return [];
  }
};

export const loadChordSheet = async (id: string): Promise<ChordSheet | null> => {
  try {
    const sheets = await loadChordSheets();
    const sheet = sheets.find(s => s.id === id);
    return sheet || null;
  } catch (error) {
    console.error('Error loading chord sheet:', error);
    return null;
  }
};

export const saveChordSheet = async (sheet: ChordSheet): Promise<void> => {
  try {
    const sheets = await loadChordSheets();
    const index = sheets.findIndex(s => s.id === sheet.id);
    
    if (index >= 0) {
      sheets[index] = sheet;
    } else {
      sheets.push(sheet);
    }
    
    await saveChordSheets(sheets);
    console.log('Chord sheet saved:', sheet.title);
  } catch (error) {
    console.error('Error saving chord sheet:', error);
    throw error;
  }
};

export const deleteChordSheet = async (id: string): Promise<void> => {
  try {
    const sheets = await loadChordSheets();
    const filtered = sheets.filter(s => s.id !== id);
    await saveChordSheets(filtered);
    console.log('Chord sheet deleted:', id);
  } catch (error) {
    console.error('Error deleting chord sheet:', error);
    throw error;
  }
};

// Setlists Storage
export const saveSetlists = async (setlists: Setlist[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(SETLISTS_KEY, JSON.stringify(setlists));
    console.log('Setlists saved successfully');
  } catch (error) {
    console.error('Error saving setlists:', error);
    throw error;
  }
};

export const loadSetlists = async (): Promise<Setlist[]> => {
  try {
    const data = await AsyncStorage.getItem(SETLISTS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading setlists:', error);
    return [];
  }
};

export const saveSetlist = async (setlist: Setlist): Promise<void> => {
  try {
    const setlists = await loadSetlists();
    const index = setlists.findIndex(s => s.id === setlist.id);
    
    if (index >= 0) {
      setlists[index] = setlist;
    } else {
      setlists.push(setlist);
    }
    
    await saveSetlists(setlists);
    console.log('Setlist saved:', setlist.name);
  } catch (error) {
    console.error('Error saving setlist:', error);
    throw error;
  }
};

export const deleteSetlist = async (id: string): Promise<void> => {
  try {
    const setlists = await loadSetlists();
    const filtered = setlists.filter(s => s.id !== id);
    await saveSetlists(filtered);
    console.log('Setlist deleted:', id);
  } catch (error) {
    console.error('Error deleting setlist:', error);
    throw error;
  }
};
