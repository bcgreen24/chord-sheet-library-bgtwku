
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { loadChordSheets, loadSetlists, saveChordSheet } from "@/utils/storage";
import { ChordSheet } from "@/types/chordSheet";

export default function ProfileScreen() {
  const [sheetCount, setSheetCount] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [sheets, setlists] = await Promise.all([
        loadChordSheets(),
        loadSetlists(),
      ]);
      setSheetCount(sheets.length);
      setSetlistCount(setlists.length);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleAddSampleData = async () => {
    const sampleSheets: ChordSheet[] = [
      {
        id: Date.now().toString(),
        title: "Amazing Grace",
        artist: "Traditional",
        content: `[Verse 1]
G              G7        C        G
Amazing grace how sweet the sound
                            D
That saved a wretch like me
G              G7      C          G
I once was lost, but now I'm found
    Em      D        G
Was blind but now I see

[Verse 2]
G                G7         C       G
'Twas grace that taught my heart to fear
                        D
And grace my fears relieved
G               G7      C        G
How precious did that grace appear
    Em    D      G
The hour I first believed`,
        key: "G",
        tempo: "80 BPM",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: (Date.now() + 1).toString(),
        title: "Let It Be",
        artist: "The Beatles",
        content: `[Verse 1]
C                G
When I find myself in times of trouble
Am              F
Mother Mary comes to me
C                G              F  C
Speaking words of wisdom, let it be

[Chorus]
C           G           Am         F
Let it be, let it be, let it be, let it be
C              G              F  C
Whisper words of wisdom, let it be`,
        key: "C",
        tempo: "73 BPM",
        createdAt: Date.now() + 1,
        updatedAt: Date.now() + 1,
      },
    ];

    try {
      for (const sheet of sampleSheets) {
        await saveChordSheet(sheet);
      }
      await loadStats();
      Alert.alert("Success", "Sample chord sheets added!");
    } catch (error) {
      console.error("Error adding sample data:", error);
      Alert.alert("Error", "Failed to add sample data");
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.header}>
          <IconSymbol
            ios_icon_name="music.note"
            android_material_icon_name="music-note"
            size={64}
            color={colors.primary}
          />
          <Text style={styles.appName}>Chord Sheet Manager</Text>
          <Text style={styles.appDescription}>
            Your offline chord sheet library
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="music.note.list"
              android_material_icon_name="library-music"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.statNumber}>{sheetCount}</Text>
            <Text style={styles.statLabel}>Chord Sheets</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol
              ios_icon_name="list.bullet.rectangle"
              android_material_icon_name="playlist-play"
              size={32}
              color={colors.primary}
            />
            <Text style={styles.statNumber}>{setlistCount}</Text>
            <Text style={styles.statLabel}>Setlists</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Import and create chord sheets
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Edit and organize your library
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Create custom setlists
              </Text>
            </View>
            <View style={styles.featureItem}>
              <IconSymbol
                ios_icon_name="checkmark.circle.fill"
                android_material_icon_name="check-circle"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.featureText}>
                Works completely offline
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.sampleButton}
          onPress={handleAddSampleData}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={20}
            color={colors.card}
          />
          <Text style={styles.sampleButtonText}>Add Sample Chord Sheets</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            All data is stored locally on your device
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 20,
  },
  header: {
    alignItems: "center",
    paddingTop: 20,
    paddingBottom: 32,
    gap: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
  },
  appDescription: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text,
  },
  sampleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sampleButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.card,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
