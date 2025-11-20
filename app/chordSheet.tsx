
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ChordSheet, NashvilleChart } from '@/types/chordSheet';
import { loadChordSheet, deleteChordSheet, saveChordSheet } from '@/utils/storage';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';
import { CustomWebView } from '@/components/CustomWebView';
import { parseToNashvilleChart } from '@/utils/chordSheetParser';

export default function ChordSheetScreen() {
  const { id, mode } = useLocalSearchParams<{ id?: string; mode?: string }>();
  const router = useRouter();
  const [sheet, setSheet] = useState<ChordSheet | null>(null);
  const [nashvilleChart, setNashvilleChart] = useState<NashvilleChart | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedArtist, setEditedArtist] = useState('');
  const [editedKey, setEditedKey] = useState('');
  const [editedTempo, setEditedTempo] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (mode === 'new') {
      // Create a new empty chord sheet
      const newSheet: ChordSheet = {
        id: `${Date.now()}`,
        title: 'New Chart',
        artist: 'Unknown Artist',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setSheet(newSheet);
      setEditedTitle(newSheet.title);
      setEditedArtist(newSheet.artist);
      setEditedKey('');
      setEditedTempo('');
      setEditedContent('');
      setIsEditing(true);
      setLoading(false);
    } else if (id) {
      loadSheet();
    } else {
      setLoading(false);
    }
  }, [id, mode]);

  const loadSheet = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const loadedSheet = await loadChordSheet(id);
      if (loadedSheet) {
        setSheet(loadedSheet);
        setEditedTitle(loadedSheet.title);
        setEditedArtist(loadedSheet.artist);
        setEditedKey(loadedSheet.key || '');
        setEditedTempo(loadedSheet.tempo || '');
        setEditedContent(loadedSheet.content);
        
        // Parse to Nashville chart if not a PDF
        if (!loadedSheet.isPDF && loadedSheet.content) {
          console.log('Parsing chord sheet to Nashville chart...');
          const chart = parseToNashvilleChart(loadedSheet.content);
          setNashvilleChart(chart);
          console.log('Nashville chart parsed:', chart);
        }
      } else {
        Alert.alert('Error', 'Chord sheet not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading chord sheet:', error);
      Alert.alert('Error', 'Failed to load chord sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sheet) return;

    try {
      const updatedSheet: ChordSheet = {
        ...sheet,
        title: editedTitle.trim() || 'Untitled',
        artist: editedArtist.trim() || 'Unknown Artist',
        key: editedKey.trim() || undefined,
        tempo: editedTempo.trim() || undefined,
        content: editedContent,
        updatedAt: Date.now(),
      };

      await saveChordSheet(updatedSheet);
      setSheet(updatedSheet);
      setIsEditing(false);

      // Re-parse Nashville chart if content changed
      if (!updatedSheet.isPDF && updatedSheet.content) {
        const chart = parseToNashvilleChart(updatedSheet.content);
        setNashvilleChart(chart);
      }

      Alert.alert('Success', 'Chart saved successfully');
    } catch (error) {
      console.error('Error saving chord sheet:', error);
      Alert.alert('Error', 'Failed to save chart');
    }
  };

  const handleDelete = () => {
    if (!sheet) return;

    Alert.alert(
      'Delete Chord Sheet',
      'Are you sure you want to delete this chord sheet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteChordSheet(sheet.id);
              router.back();
            } catch (error) {
              console.error('Error deleting chord sheet:', error);
              Alert.alert('Error', 'Failed to delete chord sheet');
            }
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (mode === 'new') {
      router.back();
    } else {
      setIsEditing(false);
      if (sheet) {
        setEditedTitle(sheet.title);
        setEditedArtist(sheet.artist);
        setEditedKey(sheet.key || '');
        setEditedTempo(sheet.tempo || '');
        setEditedContent(sheet.content);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (!sheet) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Chord sheet not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: isEditing ? (mode === 'new' ? 'New Chart' : 'Edit Chart') : sheet.title,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerRight: () => (
            <View style={styles.headerButtons}>
              {isEditing ? (
                <React.Fragment>
                  <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
                    <IconSymbol
                      ios_icon_name="pencil"
                      android_material_icon_name="edit"
                      size={24}
                      color={colors.primary}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
                    <IconSymbol
                      ios_icon_name="trash"
                      android_material_icon_name="delete"
                      size={24}
                      color={colors.error}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              )}
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          <View style={styles.editContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Enter title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Artist</Text>
              <TextInput
                style={styles.input}
                value={editedArtist}
                onChangeText={setEditedArtist}
                placeholder="Enter artist"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.inputLabel}>Key</Text>
                <TextInput
                  style={styles.input}
                  value={editedKey}
                  onChangeText={setEditedKey}
                  placeholder="e.g., C, G, Am"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.inputGroup, styles.inputGroupHalf]}>
                <Text style={styles.inputLabel}>Tempo</Text>
                <TextInput
                  style={styles.input}
                  value={editedTempo}
                  onChangeText={setEditedTempo}
                  placeholder="e.g., 120 BPM"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.contentInput]}
                value={editedContent}
                onChangeText={setEditedContent}
                placeholder="Paste chord sheet content here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={20}
                textAlignVertical="top"
              />
            </View>

            <Text style={styles.helpText}>
              Paste your chord sheet content above. The app will automatically parse it into a Nashville chart.
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {/* Header Info */}
            <View style={styles.header}>
              <Text style={styles.title}>{sheet.title}</Text>
              <Text style={styles.artist}>{sheet.artist}</Text>
              {(sheet.key || sheet.tempo) && (
                <View style={styles.metadataRow}>
                  {sheet.key && (
                    <View style={styles.metadataItem}>
                      <Text style={styles.metadataLabel}>Key:</Text>
                      <Text style={styles.metadataValue}>{sheet.key}</Text>
                    </View>
                  )}
                  {sheet.tempo && (
                    <View style={styles.metadataItem}>
                      <Text style={styles.metadataLabel}>Tempo:</Text>
                      <Text style={styles.metadataValue}>{sheet.tempo}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Nashville Chart or PDF Display */}
            {sheet.isPDF && sheet.pdfUri ? (
              <View style={styles.pdfContainer}>
                <CustomWebView uri={sheet.pdfUri} />
              </View>
            ) : nashvilleChart ? (
              <View style={styles.nashvilleContainer}>
                <Text style={styles.nashvilleTitle}>Nashville Chart</Text>
                {nashvilleChart.sections.map((section, sectionIndex) => (
                  <View key={sectionIndex} style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionName}>{section.name}</Text>
                    </View>
                    <View style={styles.measuresContainer}>
                      {section.measures.map((measureLine, lineIndex) => (
                        <View key={lineIndex} style={styles.measureLine}>
                          {measureLine.map((chord, chordIndex) => (
                            <View key={chordIndex} style={styles.chordCell}>
                              <Text style={styles.chordText}>{chord}</Text>
                            </View>
                          ))}
                          {/* Fill empty cells if less than 4 chords */}
                          {measureLine.length < 4 &&
                            Array.from({ length: 4 - measureLine.length }).map((_, emptyIndex) => (
                              <View key={`empty-${emptyIndex}`} style={styles.chordCell}>
                                <Text style={styles.emptyChordText}>-</Text>
                              </View>
                            ))}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.contentContainer}>
                <Text style={styles.contentText}>{sheet.content}</Text>
              </View>
            )}
          </React.Fragment>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  artist: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metadataItem: {
    flexDirection: 'row',
    gap: 6,
  },
  metadataLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  metadataValue: {
    fontSize: 14,
    color: colors.text,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
  },
  pdfContainer: {
    height: 600,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
  },
  contentContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
  },
  contentText: {
    fontSize: 14,
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 20,
  },
  nashvilleContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
  },
  nashvilleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  measuresContainer: {
    gap: 8,
  },
  measureLine: {
    flexDirection: 'row',
    gap: 8,
  },
  chordCell: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chordText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyChordText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    opacity: 0.3,
  },
  editContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputGroupHalf: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    outlineStyle: 'none',
  },
  contentInput: {
    minHeight: 300,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  helpText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
});
