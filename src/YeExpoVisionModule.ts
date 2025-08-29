import { NativeModule, requireNativeModule } from "expo";
import { MLKitScript, RecognizedText } from "./YeExpoVision.types";

declare class YeExpoVisionModule extends NativeModule {
  recognizeTextIOS(
    imageUri: string,
    options: {
      recognitionLevel?: "fast" | "accurate";
      recognitionLanguages?: string[];
      automaticallyDetectsLanguage?: boolean;
      usesLanguageCorrection?: boolean;
    }
  ): Promise<RecognizedText>;
  recognizeTextMLKit(
    imageUri: string,
    script: MLKitScript
  ): Promise<RecognizedText>;
}

export default requireNativeModule<YeExpoVisionModule>("YeExpoVision");
