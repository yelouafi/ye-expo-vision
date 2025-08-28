import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { useState, useRef, useEffect } from "react";
import {
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import YeExpoVisionModule, { RecognizedTextBlock, Rect } from "ye-expo-vision";
import { visionRectToViewRect } from "ye-expo-vision/YeExpoVisionModule";
import { llm_translate } from "./ai/llm-translate";
import { transformFileSync } from "@babel/core";

interface CameraProps {
  onClose: () => void;
  onPhotoTaken: (photoUri: string) => void;
  language?: string;
}

export function Camera({
  onClose,
  onPhotoTaken,
  language = "ar-SA",
}: CameraProps) {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [recognizedText, setRecognizedText] = useState<RecognizedTextBlock[]>(
    []
  );
  const [ongoingTask, setOngoingTask] = useState<
    "none" | "recognizing" | "translating"
  >("none");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [cameraViewDimensions, setCameraViewDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [imageViewDimensions, setImageViewDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mode, setMode] = useState<"camera" | "preview">("camera");
  const cameraRef = useRef<CameraView>(null);

  function updateTranslations(translations: string[]) {
    setRecognizedText((textBlocks) =>
      textBlocks.map((block, index) => ({
        ...block,
        translation: translations[index] || "",
      }))
    );
  }

  useEffect(() => {
    const languages = YeExpoVisionModule.getSupportedLanguages();
    console.log("languages", languages);
  }, []);

  const screenDimensions = Dimensions.get("window");

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  async function takePicture() {
    if (cameraRef.current) {
      try {
        setOngoingTask("recognizing");
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        if (photo?.uri) {
          setImageUri(photo.uri);
          console.log("Photo taken with dimensions:", {
            width: photo.width,
            height: photo.height,
          });
          setImageDimensions({ width: photo.width, height: photo.height });

          // Switch to preview mode
          setMode("preview");

          // Perform text recognition
          try {
            console.log("recognizing text");
            const textBlocks =
              await YeExpoVisionModule.recognizeTextInImageMLKit(photo.uri, [
                language,
              ]);
            console.log("blocks", textBlocks);
            setRecognizedText(textBlocks);

            // setOngoingTask("translating");
            // console.log("translating text");
            // const texts = textBlocks.map((block) => block.text);
            // const translations = await llm_translate({
            //   // model: "google/gemini-flash",
            //   model: "groq/gpt-oss-120b",
            //   texts,
            //   targetLang: language,
            // });

            // console.log("translations", translations);
            // updateTranslations(translations);
            setOngoingTask("none");
          } catch (error) {
            console.error("Error recognizing text:", error);
            Alert.alert(
              "Text Recognition Error",
              "Failed to recognize text in image"
            );
          }

          onPhotoTaken(photo.uri);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
        console.error("Error taking picture:", error);
      } finally {
        setOngoingTask("none");
      }
    }
  }

  function clearTextRecognition() {
    setRecognizedText([]);
    setImageUri(null);
    setImageDimensions(null);
    setImageViewDimensions(null);
    setMode("camera");
  }

  function retakePhoto() {
    setRecognizedText([]);
    setImageUri(null);
    setImageDimensions(null);
    setImageViewDimensions(null);
    setMode("camera");
  }

  function onCameraViewLayout(event: any) {
    const { width, height } = event.nativeEvent.layout;
    console.log("Camera view dimensions:", { width, height });
    setCameraViewDimensions({ width, height });
  }

  function onImageViewLayout(event: any) {
    const { width, height } = event.nativeEvent.layout;
    console.log("Image view dimensions:", { width, height });
    setImageViewDimensions({ width, height });
  }

  function getScaledBoundingBox(
    boundingBox: RecognizedTextBlock["boundingBox"]
  ) {
    const view =
      mode === "preview" ? imageViewDimensions : cameraViewDimensions;
    if (!imageDimensions || !view) return null;

    const contentMode = mode === "preview" ? "contain" : "cover"; // CameraView is aspectFill by default
    return visionRectToViewRect(
      boundingBox,
      imageDimensions.width,
      imageDimensions.height,
      view.width,
      view.height,
      contentMode
    );
  }

  function calculateOptimalFontSize(
    text: string,
    boxWidth: number,
    boxHeight: number
  ) {
    // Base font size calculation based on box height
    const baseSize = Math.max(8, Math.min(boxHeight * 0.6, 24));

    // Adjust for text length - longer text needs smaller font
    const textLengthFactor = Math.max(0.5, Math.min(1.2, 20 / text.length));

    // Adjust for box width - narrow boxes need smaller font
    const widthFactor = Math.max(
      0.6,
      Math.min(1.5, boxWidth / (text.length * 8))
    );

    return Math.max(8, Math.min(baseSize * textLengthFactor * widthFactor, 20));
  }

  // Render camera view
  if (mode === "camera") {
    return (
      <View style={styles.container}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          onLayout={onCameraViewLayout}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {recognizedText.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearTextRecognition}
              >
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Text Recognition Overlay */}
          {recognizedText.map((textBlock, index) => {
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
                  style={[styles.overlayText, { fontSize: optimalFontSize }]}
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
          {ongoingTask === "translating" && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Translating text...</Text>
            </View>
          )}

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.flipButton}
              onPress={toggleCameraFacing}
            >
              <Text style={styles.buttonText}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureButton,
                ongoingTask === "recognizing" && styles.captureButtonDisabled,
              ]}
              onPress={takePicture}
              disabled={
                ongoingTask === "recognizing" || ongoingTask === "translating"
              }
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.spacer} />
          </View>
        </CameraView>
      </View>
    );
  }

  // Render image preview mode
  return (
    <View style={styles.container}>
      <View style={styles.imagePreviewContainer}>
        <Image
          source={{ uri: imageUri! }}
          style={styles.imagePreview}
          onLayout={onImageViewLayout}
          resizeMode="contain"
        />

        {/* Text Recognition Overlay for Image Preview */}
        {recognizedText.map((textBlock, index) => {
          const scaledBox = getScaledBoundingBox(textBlock.boundingBox);
          //console.log("scaledBox", scaledBox);
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
                style={[styles.overlayText, { fontSize: optimalFontSize }]}
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
        {ongoingTask === "translating" && (
          <View style={styles.processingOverlay}>
            <Text style={styles.processingText}>Translating text...</Text>
          </View>
        )}

        {/* Top Bar for Preview */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearTextRecognition}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Bar for Preview */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <View style={styles.spacer} />
          <TouchableOpacity style={styles.flipButton} onPress={onClose}>
            <Text style={styles.buttonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  message: {
    textAlign: "center",
    paddingBottom: 10,
    color: "white",
  },
  camera: {
    flex: 1,
  },
  imagePreviewContainer: {
    flex: 1,
    position: "relative",
  },
  imagePreview: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  retakeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  topBar: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 1,
  },
  closeButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
  },
  bottomBar: {
    position: "absolute",
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  flipButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "white",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  spacer: {
    width: 60,
  },
  clearButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  clearButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  textOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    // borderWidth: 2,
    // borderColor: "#00FF00",
    borderWidth: 0,
    backgroundColor: "rgba(0, 255, 0, 0.1)",
    // borderRadius: 4,
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
    // paddingHorizontal: 4,
    // paddingVertical: 2,
    // borderRadius: 2,
  },
  processingOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -15 }],
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  processingText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
