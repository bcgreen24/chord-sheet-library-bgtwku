
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { ChordSheet } from "@/types/chordSheet";
import { loadChordSheets, deleteChordSheet, saveChordSheet } from "@/utils/storage";
import { parseChordSheetContent, isValidChordSheet, parseChordSheetFile } from "@/utils/chordSheetParser";
import { useRouter } from "expo-router";
import * as DocumentPicker from 'expo-document-picker';

export default function LibraryScreen() {
  const [chordSheets, setChordSheets] = useState<ChordSheet[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredSheets, setFilteredSheets] = useState<ChordSheet[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
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
      
      // Different file types based on platform
      const fileTypes = Platform.OS === 'web' 
        ? ['text/plain', 'application/pdf', 'application/octet-stream', '*/*']
        : ['text/plain', 'application/octet-stream', '*/*']; // No PDF on mobile
      
      const result = await DocumentPicker.getDocumentAsync({
        type: fileTypes,
        copyToCacheDirectory: true,
        multiple: true,
      });

      console.log('Document picker result:', result);

      if (result.canceled) {
        console.log('Import cancelled');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        setIsImporting(true);
        setImportProgress({ current: 0, total: result.assets.length });

        const importedSheets: ChordSheet[] = [];
        const failedFiles: { name: string; reason: string }[] = [];

        // Process each file
        for (let i = 0; i < result.assets.length; i++) {
          const file = result.assets[i];
          setImportProgress({ current: i + 1, total: result.assets.length });

          try {
            console.log(`Processing file ${i + 1}/${result.assets.length}:`, file.name);

            // Check if it's a PDF on mobile
            if (Platform.OS !== 'web' && (file.name.toLowerCase().endsWith('.pdf') || file.mimeType === 'application/pdf')) {
              console.log('PDF file detected on mobile - not supported');
              failedFiles.push({ 
                name: file.name, 
                reason: 'PDF files are only supported on web. Please use text files on mobile.' 
              });
              continue;
            }

            // Parse the file (handles both text and PDF on web)
            const content = await parseChordSheetFile(file.uri, file.name, file.mimeType);
            console.log('File content length:', content.length);

            // Validate content
            if (!isValidChordSheet(content)) {
              console.log('Invalid chord sheet:', file.name);
              failedFiles.push({ 
                name: file.name, 
                reason: 'File does not appear to contain chord sheet data' 
              });
              continue;
            }

            // Parse the content
            const parsed = parseChordSheetContent(content, file.name);
            console.log('Parsed chord sheet:', parsed);

            // Create new chord sheet
            const newSheet: ChordSheet = {
              id: `${Date.now()}-${i}`,
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
            importedSheets.push(newSheet);
            console.log('Import successful:', newSheet.title);
          } catch (error) {
            console.error('Error processing file:', file.name, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            failedFiles.push({ name: file.name, reason: errorMessage });
          }
        }

        // Reload data
        await loadData();
        setIsImporting(false);

        // Show results
        const successCount = importedSheets.length;
        const failCount = failedFiles.length;

        let message = '';
        if (successCount > 0) {
          message += `Successfully imported ${successCount} chord sheet${successCount > 1 ? 's' : ''}.`;
        }
        if (failCount > 0) {
          message += `\n\nFailed to import ${failCount} file${failCount > 1 ? 's' : ''}:\n`;
          failedFiles.forEach(f => {
            message += `\n• ${f.name}: ${f.reason}`;
          });
        }

        if (Platform.OS === 'web') {
          window.alert(message);
        } else {
          Alert.alert(
            'Import Complete',
            message,
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error importing chord sheets:', error);
      setIsImporting(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (Platform.OS === 'web') {
        window.alert(`Failed to import chord sheets: ${errorMessage}`);
      } else {
        Alert.alert(
          'Import Failed',
          `Failed to import chord sheets: ${errorMessage}`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleSheetPress = (sheet: ChordSheet) => {
    router.push(`/chordSheet?id=${sheet.id}&mode=view`);
  };

  const handleDeleteSheet = async (sheet: ChordSheet) => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Delete "${sheet.title}"?`);
      if (confirmed) {
        await deleteChordSheet(sheet.id);
        await loadData();
      }
    } else {
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
    }
  };

  const supportedFormatsText = Platform.OS === 'web' 
    ? 'Supports .txt, .chordpro, and .pdf files'
    : 'Supports .txt and .chordpro files (PDF only on web)';

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chord Sheets</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton} 
            onPress={handleImport}
            disabled={isImporting}
          >
            {isImporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <IconSymbol
                ios_icon_name="arrow.down.doc"
                android_material_icon_name="file-download"
                size={28}
                color={colors.primary}
              />
            )}
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

      {isImporting && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Importing {importProgress.current} of {importProgress.total} files...
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(importProgress.current / importProgress.total) * 100}%` }
              ]} 
            />
          </View>
        </View>
      )}

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
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== "ios" && styles.contentContainerWithTabBar,
        ]}
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
                : "Tap + to create or import chord sheets"}
            </Text>
            <Text style={styles.emptySubtext}>
              {supportedFormatsText}
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
    paddingTop: Platform.OS === "android" ? 48 : 16,
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressText: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.card,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
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
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    outlineStyle: "none",
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  contentContainerWithTabBar: {
    paddingBottom: 100,
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
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
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
