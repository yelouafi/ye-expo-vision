import { useState } from "react";
import {
  Button,
  SafeAreaView,
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Camera } from "./Camera";

export default function App() {
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const handleOpenCamera = () => {
    setShowCamera(true);
    setCapturedPhoto(null);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handlePhotoTaken = (photoUri: string) => {
    setCapturedPhoto(photoUri);
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <Camera onClose={handleCloseCamera} onPhotoTaken={handlePhotoTaken} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Button title="Open Camera" onPress={handleOpenCamera} />
      </View>

      <View style={styles.content}>
        {capturedPhoto ? (
          <View style={styles.photoContainer}>
            <Text style={styles.photoTitle}>Last Photo Taken:</Text>
            <Image source={{ uri: capturedPhoto }} style={styles.photo} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={handleOpenCamera}
            >
              <Text style={styles.retakeButtonText}>Take Another Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No photos taken yet</Text>
            <Text style={styles.emptySubtext}>
              Tap "Open Camera" to get started
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  photoContainer: {
    alignItems: "center",
    width: "100%",
  },
  photoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  photo: {
    width: 300,
    height: 400,
    borderRadius: 10,
    marginBottom: 20,
  },
  retakeButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retakeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
  },
  emptyText: {
    fontSize: 20,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: "#999",
  },
});
