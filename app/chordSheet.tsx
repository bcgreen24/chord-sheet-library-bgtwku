
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CustomWebView } from "@/components/CustomWebView";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { ChordSheet } from "@/types/chordSheet";
import { saveChordSheet, loadChordSheets } from "@/utils/storage";
import { parseToNashvilleChart } from "@/utils/chordSheetParser";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function ChordSheetScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const sheetId = params.id as string;
  const mode = params.mode as string;

  const [isEditing, setIsEditing] = useState(mode === "new" || mode === "edit");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [content, setContent] = useState("");
  const [key, setKey] = useState("");
  const [tempo, setTempo] = useState("");
  const [isPDF, setIsPDF] = useState(false);
  const [pdfUri, setPdfUri] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (sheetId && mode !== "new") {
      loadSheet();
    }
  }, [sheetId]);

  const loadSheet = async () => {
    try {
      const sheets = await loadChordSheets();
      const sheet = sheets.find((s) => s.id === sheetId);
      if (sheet) {
        setTitle(sheet.title);
        setArtist(sheet.artist);
        setContent(sheet.content);
        setKey(sheet.key || "");
        setTempo(sheet.tempo || "");
        setIsPDF(sheet.isPDF || false);
        setPdfUri(sheet.pdfUri);
      }
    } catch (error) {
      console.error("Error loading chord sheet:", error);
    }
  };

  const handleSave = async () => {
    if (title.trim() === "" || artist.trim() === "") {
      if (Platform.OS === "web") {
        window.alert("Please enter title and artist");
      } else {
        Alert.alert("Error", "Please enter title and artist");
      }
      return;
    }

    const sheet: ChordSheet = {
      id: sheetId || Date.now().toString(),
      title: title.trim(),
      artist: artist.trim(),
      content: content.trim(),
      key: key.trim() || undefined,
      tempo: tempo.trim() || undefined,
      isPDF,
      pdfUri,
      createdAt: sheetId ? 0 : Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveChordSheet(sheet);
      console.log("Chord sheet saved successfully");
      setIsEditing(false);
      if (mode === "new") {
        router.replace(`/chordSheet?id=${sheet.id}&mode=view`);
      }
    } catch (error) {
      console.error("Error saving chord sheet:", error);
      if (Platform.OS === "web") {
        window.alert("Error saving chord sheet");
      } else {
        Alert.alert("Error", "Failed to save chord sheet");
      }
    }
  };

  const handleCancel = () => {
    if (mode === "new") {
      router.back();
    } else {
      setIsEditing(false);
      loadSheet();
    }
  };

  const renderNashvilleChart = () => {
    const chart = parseToNashvilleChart(content);
    
    if (chart.sections.length === 0) {
      return (
        <View style={styles.emptyChartContainer}>
          <Text style={styles.emptyChartText}>
            No chords found in this chart
          </Text>
          <Text style={styles.emptyChartSubtext}>
            Add chord progressions with section labels like [Verse], [Chorus], etc.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.nashvilleChartContainer}>
        {chart.sections.map((section, sectionIndex) => (
          <React.Fragment key={sectionIndex}>
            <View style={styles.sectionRow}>
              <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>{section.name}</Text>
              </View>
              <View style={styles.measuresContainer}>
                {section.measures.map((measureLine, lineIndex) => (
                  <React.Fragment key={lineIndex}>
                    <View style={styles.measureLine}>
                      {measureLine.map((chord, chordIndex) => (
                        <React.Fragment key={chordIndex}>
                          <View style={styles.measureBox}>
                            <Text style={styles.chordText}>{chord}</Text>
                          </View>
                        </React.Fragment>
                      ))}
                      {/* Fill empty measures with dashes */}
                      {measureLine.length < 4 && Array.from({ length: 4 - measureLine.length }).map((_, emptyIndex) => (
                        <React.Fragment key={`empty-${emptyIndex}`}>
                          <View style={styles.measureBox}>
                            <Text style={styles.chordText}>-</Text>
                          </View>
                        </React.Fragment>
                      ))}
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow-back"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {mode === "new" ? "New Chart" : isEditing ? "Edit Chart" : "Nashville Chart"}
        </Text>
        {!isPDF && (
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            <IconSymbol
              ios_icon_name={isEditing ? "checkmark" : "pencil"}
              android_material_icon_name={isEditing ? "check" : "edit"}
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>
        )}
        {isPDF && <View style={styles.editButton} />}
      </View>

      {isPDF && pdfUri ? (
        <View style={styles.pdfContainer}>
          <CustomWebView
            uri={pdfUri}
            style={styles.webview}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading PDF...</Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
            }}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          {isEditing ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Title *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Song title"
                  placeholderTextColor={colors.textSecondary}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Artist *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Artist name"
                  placeholderTextColor={colors.textSecondary}
                  value={artist}
                  onChangeText={setArtist}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Key</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., C, G, Am"
                    placeholderTextColor={colors.textSecondary}
                    value={key}
                    onChangeText={setKey}
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Tempo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 120 BPM"
                    placeholderTextColor={colors.textSecondary}
                    value={tempo}
                    onChangeText={setTempo}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Chord Progressions *</Text>
                <Text style={styles.helperText}>
                  Enter chords with section labels. Example format:
                </Text>
                <Text style={styles.exampleText}>
                  [Verse]{'\n'}
                  C G Am F{'\n'}
                  C G F G{'\n'}
                  {'\n'}
                  [Chorus]{'\n'}
                  F C G Am{'\n'}
                  F C G G
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Enter your chords here..."
                  placeholderTextColor={colors.textSecondary}
                  value={content}
                  onChangeText={setContent}
                  multiline
                  numberOfLines={20}
                />
              </View>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.viewContainer}>
              <View style={styles.viewHeader}>
                <Text style={styles.viewTitle}>{title}</Text>
                <Text style={styles.viewArtist}>{artist}</Text>
                {(key || tempo) && (
                  <View style={styles.viewMeta}>
                    {key && <Text style={styles.viewMetaText}>Key: {key}</Text>}
                    {tempo && <Text style={styles.viewMetaText}>Tempo: {tempo}</Text>}
                  </View>
                )}
              </View>
              <View style={styles.divider} />
              {renderNashvilleChart()}
            </View>
          )}
        </ScrollView>
      )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  editButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  helperText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  exampleText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    backgroundColor: colors.secondary,
    padding: 12,
    borderRadius: 6,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    outlineStyle: "none",
  },
  textArea: {
    minHeight: 300,
    textAlignVertical: "top",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: colors.secondary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.card,
  },
  viewContainer: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  viewHeader: {
    gap: 8,
    marginBottom: 4,
  },
  viewTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  viewArtist: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  viewMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  viewMetaText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.secondary,
    marginVertical: 20,
  },
  nashvilleChartContainer: {
    gap: 20,
  },
  sectionRow: {
    flexDirection: "row",
    gap: 16,
    alignItems: "flex-start",
  },
  sectionLabelContainer: {
    width: 90,
    paddingTop: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  measuresContainer: {
    flex: 1,
    gap: 8,
  },
  measureLine: {
    flexDirection: "row",
    gap: 6,
  },
  measureBox: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: 6,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.background,
  },
  chordText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  emptyChartContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyChartText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  emptyChartSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
