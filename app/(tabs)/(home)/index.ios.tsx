
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { ChordSheet } from "@/types/chordSheet";
import { loadChordSheets, deleteChordSheet, saveChordSheet } from "@/utils/storage";
import { parseChordSheetContent, isValidChordSheet } from "@/utils/chordSheetParser";
import { useRouter } from "expo-router";
import * as DocumentPicker from 'expo-document-picker';

export default function LibraryScreen() {
  const [chordSheets, setChordSheets] = useState<ChordSheet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSheets, setFilteredSheets] = useState<ChordSheet[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filter chord sheets based on search query
    if (searchQuery.trim() === "") {
      setFilteredSheets(chordSheets);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = chordSheets.filter(
        (sheet) =>
          sheet.title.toLowerCase().includes(query) ||
          sheet.artist.toLowerCase().includes(query)
      );
      setFilteredSheets(filtered);
    }
  }, [searchQuery, chordSheets]);

  const loadData = async () => {
    try {
      const sheets = await loadChordSheets();
      setChordSheets(sheets);
      console.log('Loaded chord sheets:', sheets.length);
    } catch (error) {
      console.error('Error loading chord sheets:', error);
    }
  };

  const handleAddNew = () => {
    router.push('/chordSheet?mode=new');
  };

  const handleImport = async () => {
    try {
      console.log('Opening document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/plain', 'application/octet-stream', '*/*'],
        copyToCacheDirectory: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Import cancelled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        console.log('Selected file:', file.name);

        // Read file content
        const response = await fetch(file.uri);
        const content = await response.text();
        console.log('File content length:', content.length);

        // Validate content
        if (!isValidChordSheet(content)) {
          Alert.alert(
            'Invalid File',
            'The selected file does not appear to be a valid chord sheet.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Parse the content
        const parsed = parseChordSheetContent(content, file.name);
        console.log('Parsed chord sheet:', parsed);

        // Create new chord sheet
        const newSheet: ChordSheet = {
          id: Date.now().toString(),
          title: parsed.title || 'Untitled',
          artist: parsed.artist || 'Unknown Artist',
          content: parsed.content || content,
          key: parsed.key,
          tempo: parsed.tempo,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        // Save to storage
        await saveChordSheet(newSheet);
        await loadData();

        // Show success message
        Alert.alert(
          'Import Successful',
          `"${newSheet.title}" has been added to your library.`,
          [{ text: 'OK' }]
        );

        console.log('Import successful:', newSheet.title);
      }
    } catch (error) {
      console.error('Error importing chord sheet:', error);
      Alert.alert(
        'Import Failed',
        'Failed to import chord sheet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSheetPress = (sheet: ChordSheet) => {
    router.push(`/chordSheet?id=${sheet.id}&mode=view`);
  };

  const handleDeleteSheet = async (sheet: ChordSheet) => {
    Alert.alert(
      'Delete Chord Sheet',
      `Are you sure you want to delete "${sheet.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChordSheet(sheet.id);
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chord Sheets</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.headerButton} onPress={handleImport}>
            <IconSymbol
              ios_icon_name="arrow.down.doc"
              android_material_icon_name="file-download"
              size={28}
              color={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleAddNew}>
            <IconSymbol
              ios_icon_name="plus.circle.fill"
              android_material_icon_name="add-circle"
              size={32}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <IconSymbol
          ios_icon_name="magnifyingglass"
          android_material_icon_name="search"
          size={20}
          color={colors.textSecondary}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title or artist..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <IconSymbol
              ios_icon_name="xmark.circle.fill"
              android_material_icon_name="cancel"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {filteredSheets.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="music.note.list"
              android_material_icon_name="library-music"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No chord sheets found"
                : "No chord sheets yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "Try a different search"
                : "Tap + to create or import a chord sheet"}
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {filteredSheets.map((sheet, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.sheetCard}
                  onPress={() => handleSheetPress(sheet)}
                  activeOpacity={0.7}
                >
                  <View style={styles.sheetCardContent}>
                    <View style={styles.sheetInfo}>
                      <Text style={styles.sheetTitle}>{sheet.title}</Text>
                      <Text style={styles.sheetArtist}>{sheet.artist}</Text>
                      {(sheet.key || sheet.tempo) && (
                        <View style={styles.sheetMeta}>
                          {sheet.key && (
                            <Text style={styles.sheetMetaText}>
                              Key: {sheet.key}
                            </Text>
                          )}
                          {sheet.tempo && (
                            <Text style={styles.sheetMetaText}>
                              Tempo: {sheet.tempo}
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSheet(sheet)}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    marginHorizontal: 20,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  sheetCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sheetCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetInfo: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  sheetArtist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sheetMeta: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  sheetMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
});
