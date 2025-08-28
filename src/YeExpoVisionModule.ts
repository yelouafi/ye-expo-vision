import { NativeModule, requireNativeModule } from "expo";
import { MLKitScript, RecognizedText } from "./YeExpoVision.types";

declare class YeExpoVisionModule extends NativeModule {
  recognizeTextNative(
    imageUri: string,
    languages: string[]
  ): Promise<RecognizedText>;
  recognizeTextMLKit(
    imageUri: string,
    script: MLKitScript
  ): Promise<RecognizedText>;
}

export default requireNativeModule<YeExpoVisionModule>("YeExpoVision");
