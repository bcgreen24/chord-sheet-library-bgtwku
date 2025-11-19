
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { Setlist, ChordSheet } from "@/types/chordSheet";
import {
  loadSetlists,
  saveSetlist,
  loadChordSheets,
} from "@/utils/storage";
import { useRouter, useLocalSearchParams } from "expo-router";

export default function SetlistDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setlistId = params.id as string;

  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [allChordSheets, setAllChordSheets] = useState<ChordSheet[]>([]);
  const [setlistSongs, setSetlistSongs] = useState<ChordSheet[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [setlistId]);

  const loadData = async () => {
    try {
      const [setlists, sheets] = await Promise.all([
        loadSetlists(),
        loadChordSheets(),
      ]);

      const currentSetlist = setlists.find((s) => s.id === setlistId);
      if (currentSetlist) {
        setSetlist(currentSetlist);
        const songs = sheets.filter((sheet) =>
          currentSetlist.songIds.includes(sheet.id)
        );
        setSetlistSongs(songs);
      }
      setAllChordSheets(sheets);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleAddSong = async (songId: string) => {
    if (!setlist) {
      console.log("No setlist found");
      return;
    }

    if (setlist.songIds.includes(songId)) {
      if (Platform.OS === "web") {
        window.alert("This song is already in the setlist");
      } else {
        Alert.alert("Info", "This song is already in the setlist");
      }
      return;
    }

    const updatedSetlist: Setlist = {
      ...setlist,
      songIds: [...setlist.songIds, songId],
      updatedAt: Date.now(),
    };

    await saveSetlist(updatedSetlist);
    await loadData();
    setShowAddModal(false);
  };

  const handleRemoveSong = async (songId: string) => {
    if (!setlist) {
      console.log("No setlist found");
      return;
    }

    const updatedSetlist: Setlist = {
      ...setlist,
      songIds: setlist.songIds.filter((id) => id !== songId),
      updatedAt: Date.now(),
    };

    await saveSetlist(updatedSetlist);
    await loadData();
  };

  const handleSongPress = (song: ChordSheet) => {
    router.push(`/chordSheet?id=${song.id}&mode=view`);
  };

  const availableSongs = allChordSheets.filter(
    (sheet) => !setlist?.songIds.includes(sheet.id)
  );

  if (!setlist) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={["top"]}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {setlist.name}
        </Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={28}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {setlist.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{setlist.description}</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {setlistSongs.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="music.note"
              android_material_icon_name="music-note"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No songs in this setlist</Text>
            <Text style={styles.emptySubtext}>Tap + to add songs</Text>
          </View>
        ) : (
          <React.Fragment>
            {setlistSongs.map((song, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.songCard}
                  onPress={() => handleSongPress(song)}
                  activeOpacity={0.7}
                >
                  <View style={styles.songNumber}>
                    <Text style={styles.songNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.songInfo}>
                    <Text style={styles.songTitle}>{song.title}</Text>
                    <Text style={styles.songArtist}>{song.artist}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveSong(song.id)}
                  >
                    <IconSymbol
                      ios_icon_name="minus.circle"
                      android_material_icon_name="remove-circle"
                      size={24}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </React.Fragment>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Song</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {availableSongs.length === 0 ? (
                <View style={styles.modalEmptyState}>
                  <Text style={styles.modalEmptyText}>
                    No songs available to add
                  </Text>
                  <Text style={styles.modalEmptySubtext}>
                    All your chord sheets are already in this setlist
                  </Text>
                </View>
              ) : (
                <React.Fragment>
                  {availableSongs.map((song, index) => (
                    <React.Fragment key={index}>
                      <TouchableOpacity
                        style={styles.modalSongCard}
                        onPress={() => handleAddSong(song.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.modalSongInfo}>
                          <Text style={styles.modalSongTitle}>{song.title}</Text>
                          <Text style={styles.modalSongArtist}>{song.artist}</Text>
                        </View>
                        <IconSymbol
                          ios_icon_name="plus.circle"
                          android_material_icon_name="add-circle-outline"
                          size={24}
                          color={colors.primary}
                        />
                      </TouchableOpacity>
                    </React.Fragment>
                  ))}
                </React.Fragment>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
    marginHorizontal: 12,
  },
  addButton: {
    padding: 4,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
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
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  songNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  songNumberText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  songInfo: {
    flex: 1,
    gap: 4,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  songArtist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  modalScroll: {
    maxHeight: 400,
  },
  modalEmptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  modalEmptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  modalEmptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  modalSongCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  modalSongInfo: {
    flex: 1,
    gap: 4,
  },
  modalSongTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  modalSongArtist: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});
