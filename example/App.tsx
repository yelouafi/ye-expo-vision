import { useState } from "react";
import {
  Button,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from "react-native";
import { CameraRecognition } from "./CameraRecognition";
import { PhotoRecognition } from "./PhotoRecognition";

/*
const languages = [
  { code: "en-US", label: "English (US)" },
  { code: "fr-FR", label: "French (France)" },
  { code: "it-IT", label: "Italian (Italy)" },
  { code: "de-DE", label: "German (Germany)" },
  { code: "es-ES", label: "Spanish (Spain)" },
  { code: "pt-BR", label: "Portuguese (Brazil)" },
  { code: "zh-Hans", label: "Chinese (Simplified)" },
  { code: "zh-Hant", label: "Chinese (Traditional)" },
  { code: "yue-Hans", label: "Cantonese (Simplified)" },
  { code: "yue-Hant", label: "Cantonese (Traditional)" },
  { code: "ko-KR", label: "Korean" },
  { code: "ja-JP", label: "Japanese" },
  { code: "ru-RU", label: "Russian" },
  { code: "uk-UA", label: "Ukrainian" },
  { code: "th-TH", label: "Thai" },
  { code: "vi-VT", label: "Vietnamese" },
  { code: "ar-SA", label: "Arabic (Saudi Arabia)" },
  { code: "ars-SA", label: "Najdi Arabic (Saudi Arabia)" },
];
*/

export const languages = [
  {
    code: "zh-CN",
    name: "Chinese (Simplified)",
    slug: "zh",
  },
  {
    code: "ko-KR",
    name: "Korean",
    slug: "ko",
  },
  {
    code: "it-IT",
    name: "Italian",
    slug: "it",
  },
  {
    code: "ja-JP",
    name: "Japanese",
    slug: "ja",
  },
  {
    code: "th-TH",
    name: "Thai",
    slug: "th",
  },
  {
    code: "vi-VT",
    name: "Vietnamese",
    slug: "vi",
  },
  {
    code: "da-DK",
    name: "Danish",
    slug: "da",
  },
  {
    code: "es-ES",
    name: "Spanish",
    slug: "es",
  },
  {
    code: "fr-FR",
    name: "French",
    slug: "fr",
  },
  {
    code: "en-US",
    name: "English (US)",
    slug: "en",
  },
  {
    code: "ar-SA",
    name: "Arabic",
    slug: "ar",
  },
  {
    code: "hi-IN",
    name: "Hindi",
    slug: "hi",
  },
  {
    code: "de-DE",
    name: "German",
    slug: "de",
  },
  {
    code: "tr-TR",
    name: "Turkish",
    slug: "tr",
  },
  {
    code: "nl-NL",
    name: "Dutch",
    slug: "nl",
  },
  {
    code: "pt-BR",
    name: "Portuguese (Brazil)",
    slug: "pt",
  },
  {
    code: "pt-PT",
    name: "Portuguese (Portugal)",
    slug: "pt-pt",
  },
  {
    code: "uk-UA",
    name: "Ukrainian",
    slug: "uk",
  },
  {
    code: "ru-RU",
    name: "Russian",
    slug: "ru",
  },
  {
    code: "id-ID",
    name: "Indonesian",
    slug: "id",
  },
  {
    code: "el-GR",
    name: "Greek",
    slug: "el",
  },
  {
    code: "fi-FI",
    name: "Finnish",
    slug: "fi",
  },
  {
    code: "bg-BG",
    name: "Bulgarian",
    slug: "bg",
  },
  {
    code: "en-AU",
    name: "English (Australia)",
    slug: "en-au",
  },
  {
    code: "es-MX",
    name: "Spanish (Mexico)",
    slug: "es-mx",
  },
  {
    code: "pl-PL",
    name: "Polish",
    slug: "pl",
  },
  {
    code: "sv-SE",
    name: "Swedish",
    slug: "sv",
  },
  {
    code: "ro-RO",
    name: "Romanian",
    slug: "ro",
  },
  {
    code: "ar-AE",
    name: "Arabic (UAE)",
    slug: "ar-ae",
  },
  {
    code: "cs-CZ",
    name: "Czech",
    slug: "cs",
  },
  {
    code: "hr-HR",
    name: "Croatian",
    slug: "hr",
  },
  {
    code: "ms-MY",
    name: "Malay",
    slug: "ms",
  },
  {
    code: "sk-SK",
    name: "Slovak",
    slug: "sk",
  },
];

const methods = [
  { code: "native", name: "Native" },
  { code: "mlkit", name: "MLKit" },
  { code: "auto", name: "Auto" },
];

type Method = "native" | "mlkit" | "auto";

type DropdownItem = { code: string; name: string };

// Custom Dropdown Component
interface DropdownProps {
  label: string;
  selectedValue: string;
  onValueChange: (value: string) => void;
  options: DropdownItem[];
  renderItem?: (item: DropdownItem, isSelected: boolean) => string;
}

function Dropdown({
  label,
  selectedValue,
  onValueChange,
  options,
  renderItem = (item, isSelected) => item.name,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(
    (option) => option.code === selectedValue
  );

  return (
    <View style={styles.languageContainer}>
      <Text style={styles.languageLabel}>{label}:</Text>
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedOption?.name || "Select..."}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.code === selectedValue && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    onValueChange(item.code);
                    setIsOpen(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      item.code === selectedValue &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {renderItem(item, item.code === selectedValue)}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "camera" | "photo">(
    "home"
  );
  const [sourceLanguage, setSourceLanguage] = useState<string>("ja-JP");
  const [targetLanguage, setTargetLanguage] = useState<string>("en-US");
  const [method, setMethod] = useState<Method>("auto");
  const handleOpenCamera = () => {
    setCurrentView("camera");
  };

  const handleOpenPhotoRecognition = () => {
    setCurrentView("photo");
  };

  const handleClose = () => {
    setCurrentView("home");
  };

  if (currentView === "camera") {
    return (
      <CameraRecognition
        onClose={handleClose}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        method={method}
      />
    );
  }

  if (currentView === "photo") {
    return (
      <PhotoRecognition
        onClose={handleClose}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        method={method}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.centerContent}>
          <Text style={styles.title}>Text Recognition</Text>
          <Text style={styles.subtitle}>
            Choose how you want to recognize text with iOS Vision API
          </Text>

          <View style={styles.languageSection}>
            <Dropdown
              label="Source Language"
              selectedValue={sourceLanguage}
              onValueChange={setSourceLanguage}
              options={languages}
            />
            <Dropdown
              label="Target Language"
              selectedValue={targetLanguage}
              onValueChange={setTargetLanguage}
              options={languages}
              renderItem={(item, isSelected) =>
                `${item.name} ${sourceLanguage === item.code ? "(Transcribe only)" : ""}`
              }
            />
          </View>

          <View style={styles.methodSection}>
            <Dropdown
              label="Method"
              selectedValue={method}
              onValueChange={(value) => setMethod(value as Method)}
              options={methods}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button title="Take Photo with Camera" onPress={handleOpenCamera} />
            <View style={styles.buttonSpacing} />
            <Button
              title="Select Photo from Gallery"
              onPress={handleOpenPhotoRecognition}
            />
          </View>
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
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonSpacing: {
    height: 15,
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
  languageSection: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
  languageContainer: {
    marginBottom: 20,
    width: "100%",
  },
  languageLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "left",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 50,
    width: "100%",
  },
  dropdownButtonText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "left",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#666",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    maxHeight: 300,
    width: "90%",
    maxWidth: 400,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  dropdownItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dropdownItemSelected: {
    backgroundColor: "#e3f2fd",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#333",
  },
  dropdownItemTextSelected: {
    color: "#1976d2",
    fontWeight: "600",
  },
  methodSection: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 30,
  },
});
