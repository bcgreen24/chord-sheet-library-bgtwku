
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
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { colors } from "@/styles/commonStyles";
import { Setlist, ChordSheet } from "@/types/chordSheet";
import {
  loadSetlists,
  saveSetlist,
  deleteSetlist,
  loadChordSheets,
} from "@/utils/storage";
import { useRouter } from "expo-router";

export default function SetlistsScreen() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [chordSheets, setChordSheets] = useState<ChordSheet[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSetlistName, setNewSetlistName] = useState("");
  const [newSetlistDescription, setNewSetlistDescription] = useState("");
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [loadedSetlists, loadedSheets] = await Promise.all([
        loadSetlists(),
        loadChordSheets(),
      ]);
      setSetlists(loadedSetlists);
      setChordSheets(loadedSheets);
      console.log("Loaded setlists:", loadedSetlists.length);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleCreateSetlist = async () => {
    if (newSetlistName.trim() === "") {
      if (Platform.OS === "web") {
        window.alert("Please enter a setlist name");
      } else {
        Alert.alert("Error", "Please enter a setlist name");
      }
      return;
    }

    const newSetlist: Setlist = {
      id: Date.now().toString(),
      name: newSetlistName.trim(),
      description: newSetlistDescription.trim(),
      songIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await saveSetlist(newSetlist);
    await loadData();
    setShowCreateModal(false);
    setNewSetlistName("");
    setNewSetlistDescription("");
  };

  const handleDeleteSetlist = async (setlist: Setlist) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Delete "${setlist.name}"?`);
      if (confirmed) {
        await deleteSetlist(setlist.id);
        await loadData();
      }
    } else {
      Alert.alert(
        "Delete Setlist",
        `Are you sure you want to delete "${setlist.name}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await deleteSetlist(setlist.id);
              await loadData();
            },
          },
        ]
      );
    }
  };

  const handleSetlistPress = (setlist: Setlist) => {
    router.push(`/setlistDetail?id=${setlist.id}`);
  };

  const getSongCount = (setlist: Setlist): number => {
    return setlist.songIds.length;
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Setlists</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <IconSymbol
            ios_icon_name="plus.circle.fill"
            android_material_icon_name="add-circle"
            size={32}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          Platform.OS !== "ios" && styles.contentContainerWithTabBar,
        ]}
      >
        {setlists.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="list.bullet.rectangle"
              android_material_icon_name="playlist-play"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>No setlists yet</Text>
            <Text style={styles.emptySubtext}>
              Tap + to create your first setlist
            </Text>
          </View>
        ) : (
          <React.Fragment>
            {setlists.map((setlist, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  style={styles.setlistCard}
                  onPress={() => handleSetlistPress(setlist)}
                  activeOpacity={0.7}
                >
                  <View style={styles.setlistCardContent}>
                    <View style={styles.setlistInfo}>
                      <Text style={styles.setlistName}>{setlist.name}</Text>
                      {setlist.description && (
                        <Text style={styles.setlistDescription}>
                          {setlist.description}
                        </Text>
                      )}
                      <Text style={styles.songCount}>
                        {getSongCount(setlist)}{" "}
                        {getSongCount(setlist) === 1 ? "song" : "songs"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSetlist(setlist)}
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

      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Setlist</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={28}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Setlist name"
              placeholderTextColor={colors.textSecondary}
              value={newSetlistName}
              onChangeText={setNewSetlistName}
              autoFocus
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={newSetlistDescription}
              onChangeText={setNewSetlistDescription}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateSetlist}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </TouchableOpacity>
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
  headerTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
  },
  addButton: {
    padding: 4,
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
  },
  setlistCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
    elevation: 2,
  },
  setlistCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  setlistInfo: {
    flex: 1,
    gap: 4,
  },
  setlistName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  setlistDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  songCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    gap: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    outlineStyle: "none",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.card,
  },
});
