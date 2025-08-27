import { useState } from "react";
import { Button, SafeAreaView, View, Text, StyleSheet } from "react-native";
import { Camera } from "./Camera";

export default function App() {
  const [showCamera, setShowCamera] = useState(false);

  const handleOpenCamera = () => {
    setShowCamera(true);
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handlePhotoTaken = async (photoUri: string) => {
    // Photo taken - text recognition happens in the camera component
    console.log("Photo taken:", photoUri);
  };

  if (showCamera) {
    return (
      <Camera onClose={handleCloseCamera} onPhotoTaken={handlePhotoTaken} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Text Recognition Camera</Text>
          <Text style={styles.subtitle}>
            Take a photo to recognize text with iOS Vision API
          </Text>
          <Button title="Open Camera" onPress={handleOpenCamera} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  centerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
    lineHeight: 22,
  },
});
