import { useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { normalizedRectToViewRect, RecognizedTextBlock } from "ye-expo-vision";
import { llm_translate } from "./ai/llm-translate";
import { recognizeText } from "./recognizeText";
import { calculateOptimalFontSize, recognizeTextInImage } from "./utils";

interface PhotoRecognitionProps {
  onClose: () => void;
  sourceLanguage?: string;
  targetLanguage?: string;
  method?: "native" | "mlkit" | "auto";
}

export function PhotoRecognition({
  onClose,
  sourceLanguage = "ja-JP",
  targetLanguage = "en-US",
  method = "auto",
}: PhotoRecognitionProps) {
  const [recognizedText, setRecognizedText] = useState<RecognizedTextBlock[]>(
    []
  );
  const [ongoingTask, setOngoingTask] = useState<
    "none" | "recognizing" | "selecting" | "translating"
  >("none");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageViewDimensions, setImageViewDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  function updateTranslations(translations: string[]) {
    setRecognizedText((textBlocks) =>
      textBlocks.map((block, index) => ({
        ...block,
        translation: translations[index] || "",
      }))
    );
  }

  const selectImage = async () => {
    try {
      setOngoingTask("selecting");

      // Request permission
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access photo library is required!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageDimensions({
          width: asset.width || 0,
          height: asset.height || 0,
        });

        // Perform text recognition
        await _onRecognizeText(asset.uri);
      }
    } catch (error) {
      console.error("Error selecting image:", error);
      Alert.alert("Error", "Failed to select image");
    } finally {
      setOngoingTask("none");
    }
  };

  /*
  const takePhoto = async () => {
    try {
      setOngoingTask("selecting");

      // Request permission
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          "Permission Required",
          "Permission to access camera is required!"
        );
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setImageUri(asset.uri);
        setImageDimensions({
          width: asset.width || 0,
          height: asset.height || 0,
        });

        // Perform text recognition
        await recognizeTextInImage(asset.uri);
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo");
    } finally {
      setOngoingTask("none");
    }
  };
  */

  const _onRecognizeText = async (uri: string) => {
    await recognizeTextInImage(uri, {
      sourceLanguage,
      targetLanguage,
      method,
      onTask: (task) => setOngoingTask(task),
      onRecognizedText: (textBlocks) => setRecognizedText(textBlocks),
      onTranslations: (translations) => updateTranslations(translations),
    });
  };

  const clearAll = () => {
    setRecognizedText([]);
    setImageUri(null);
    setImageDimensions(null);
    setImageViewDimensions(null);
  };

  const onImageViewLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    console.log("Image view dimensions:", { width, height });
    setImageViewDimensions({ width, height });
  };

  const getScaledBoundingBox = (
    boundingBox: RecognizedTextBlock["boundingBox"]
  ) => {
    if (!imageDimensions || !imageViewDimensions) return null;

    return normalizedRectToViewRect(
      boundingBox,
      imageDimensions.width,
      imageDimensions.height,
      imageViewDimensions.width,
      imageViewDimensions.height,
      "contain"
    );
  };

  const translatedTextBlocks = recognizedText.filter(
    (block) => block.translation && block.translation.length > 0
  );

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Photo Recognition</Text>
        {(imageUri || recognizedText.length > 0) && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAll}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {!imageUri ? (
          // No image selected - show selection options
          <View style={styles.selectionContainer}>
            <Text style={styles.instructionText}>
              Select an image to recognize text
            </Text>

            <TouchableOpacity
              style={[
                styles.actionButton,
                ongoingTask === "selecting" && styles.actionButtonDisabled,
              ]}
              onPress={selectImage}
              disabled={ongoingTask !== "none"}
            >
              <Text style={styles.actionButtonText}>
                {ongoingTask === "selecting"
                  ? "Selecting..."
                  : "Choose from Gallery"}
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity
              style={[
                styles.actionButton,
                ongoingTask === "selecting" && styles.actionButtonDisabled,
              ]}
              onPress={takePhoto}
              disabled={ongoingTask !== "none"}
            >
              <Text style={styles.actionButtonText}>
                {ongoingTask === "selecting"
                  ? "Opening Camera..."
                  : "Take Photo"}
              </Text>
            </TouchableOpacity> */}
          </View>
        ) : (
          // Image selected - show image with recognition results
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                onLayout={onImageViewLayout}
                resizeMode="contain"
              />

              {/* Text Recognition Overlay */}
              {translatedTextBlocks.map((textBlock, index) => {
                const scaledBox = getScaledBoundingBox(textBlock.boundingBox);
                if (!scaledBox) return null;

                const optimalFontSize = calculateOptimalFontSize(
                  textBlock.text,
                  scaledBox.width,
                  scaledBox.height
                );

                return (
                  <View
                    key={index}
                    style={[
                      styles.textOverlay,
                      {
                        transform: [
                          { translateX: scaledBox.left },
                          { translateY: scaledBox.top },
                        ],
                        width: scaledBox.width,
                        height: scaledBox.height,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.overlayText,
                        { fontSize: optimalFontSize },
                      ]}
                      adjustsFontSizeToFit={true}
                      minimumFontScale={0.5}
                    >
                      {textBlock.translation || textBlock.text}
                    </Text>
                  </View>
                );
              })}

              {/* Processing Indicator */}
              {ongoingTask === "recognizing" && (
                <View style={styles.processingOverlay}>
                  <Text style={styles.processingText}>Recognizing text...</Text>
                </View>
              )}
            </View>

            {/* Recognized Text List */}
            {recognizedText.length > 0 && (
              <ScrollView style={styles.textList}>
                <Text style={styles.textListTitle}>Recognized Text:</Text>
                {recognizedText.map((textBlock, index) => (
                  <View key={index} style={styles.textItem}>
                    <Text style={styles.textItemText}>{textBlock.text}</Text>
                    <Text style={styles.textItemConfidence}>
                      Confidence: {Math.round(textBlock.confidence * 100)}%
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
      </View>

      {/* Bottom Bar */}
      {imageUri && (
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.bottomButton}
            onPress={() => {
              setImageUri(null);
              setRecognizedText([]);
              setImageDimensions(null);
              setImageViewDimensions(null);
            }}
          >
            <Text style={styles.bottomButtonText}>Select New Image</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  closeButton: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#333",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  clearButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  selectionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  instructionText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 24,
  },
  actionButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 10,
    minWidth: 200,
    alignItems: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "#ccc",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    flex: 1,
  },
  imageWrapper: {
    flex: 2,
    position: "relative",
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    borderWidth: 0,
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
    margin: 0,
  },
  overlayText: {
    color: "#00FF00",
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    margin: 0,
    padding: 2,
  },
  processingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  processingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  textList: {
    flex: 1,
    backgroundColor: "white",
    margin: 10,
    borderRadius: 12,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  textListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
  },
  textItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  textItemText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  textItemConfidence: {
    fontSize: 12,
    color: "#666",
  },
  bottomBar: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  bottomButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  bottomButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
