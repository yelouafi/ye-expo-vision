import YeExpoVisionModule, {
  MLKitScript,
  RecognizedText,
} from "ye-expo-vision";

export function getSupportedLanguages() {
  return YeExpoVisionModule.getSupportedLanguages();
}

function getIOSLanguageCode(languageCode: string, iosLanguages: string[]) {
  if (languageCode.startsWith("ch")) return "zh-Hans";
  if (languageCode.startsWith("ar")) return "ar-SA";

  return iosLanguages.find(
    (iosLanguage) => iosLanguage.slice(0, 2) === languageCode.slice(0, 2)
  );
}

export function recognizeText(
  imageUri: string,
  language: string,
  method: "native" | "mlkit" | "auto" = "auto"
): Promise<RecognizedText> {
  //
  const supportedLanguages = getSupportedLanguages();

  if (method === "auto") {
    //
    if (supportedLanguages.includes(language)) {
      method = "native";
    } else {
      method = "mlkit";
    }
  }
  if (method === "native") {
    const iosLanguage = getIOSLanguageCode(language, supportedLanguages);
    if (!iosLanguage) {
      throw new Error(`Unsupported language: ${language}`);
    }
    console.log("recognizing text with native method", language, iosLanguage);
    return YeExpoVisionModule.recognizeTextIOS(imageUri, {
      recognitionLanguages: [iosLanguage],
    });
  }
  if (method === "mlkit") {
    console.log("recognizing text with mlkit method");
    const script = getMLKitScript(language);
    return YeExpoVisionModule.recognizeTextMLKit(imageUri, script);
  }

  throw new Error(`Unsupported method: ${method}`);
}

export function getMLKitScript(languageCode: string): MLKitScript {
  if (languageCode.startsWith("zh")) return "chinese";
  if (languageCode.startsWith("ko")) return "korean";
  if (languageCode.startsWith("ja")) return "japanese";
  if (languageCode.startsWith("hi")) return "devanagari";
  return "latin";
}
