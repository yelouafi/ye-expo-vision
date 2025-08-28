import { RecognizedTextBlock } from "ye-expo-vision";
import { llm_translate } from "./ai/llm-translate";
import { recognizeText } from "./recognizeText";

export type Task = "recognizing" | "translating" | "none";
export type Method = "native" | "mlkit" | "auto";

export async function recognizeTextInImage(
  uri: string,
  opts: {
    sourceLanguage: string;
    targetLanguage: string;
    method: Method;
    onTask: (task: Task) => void;
    onRecognizedText: (text: RecognizedTextBlock[]) => void;
    onTranslations: (translations: string[]) => void;
  }
) {
  try {
    opts.onTask("recognizing");
    console.log("Recognizing text in image:", uri);

    const textBlocks = await recognizeText(
      uri,
      opts.sourceLanguage,
      opts.method
    );

    console.log("Recognized text blocks:", textBlocks);
    opts.onRecognizedText(textBlocks);

    opts.onTask("translating");
    console.log("translating text");
    const texts = textBlocks.map((block) => block.text);
    const translations = await llm_translate({
      // model: "google/gemini-flash",
      model: "groq/gpt-oss-120b",
      texts,
      sourceLang: opts.sourceLanguage,
      targetLang: opts.targetLanguage,
    });

    console.log("translations", translations);
    opts.onTranslations(translations);
  } catch (error) {
    console.error(error);
  } finally {
    opts.onTask("none");
  }
}

export function calculateOptimalFontSize(
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
