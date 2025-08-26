import { NativeModule, requireNativeModule } from "expo";

declare class YeExpoVisionModule extends NativeModule {
  PI: number;
  hello(): string;
  setValueAsync(value: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<YeExpoVisionModule>("YeExpoVision");
