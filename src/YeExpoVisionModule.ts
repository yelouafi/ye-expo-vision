import { NativeModule, requireNativeModule } from "expo";
import { RecognizedText, Rect } from "./YeExpoVision.types";

declare class YeExpoVisionModule extends NativeModule {
  recognizeText(imageUri: string): Promise<RecognizedText>;
  recognizeTextInImageMLKit(imageUri: string): Promise<RecognizedText>;
  getSupportedLanguages(): string[];
}

export function visionRectToViewRect(
  r: Rect,
  imageW: number,
  imageH: number, // pixel dims of the oriented image you display
  viewW: number,
  viewH: number, // your RN view size
  mode: "contain" | "cover" = "contain"
) {
  const scaleX = viewW / imageW;
  const scaleY = viewH / imageH;
  const scale =
    mode === "cover" ? Math.max(scaleX, scaleY) : Math.min(scaleX, scaleY);

  const dispW = imageW * scale;
  const dispH = imageH * scale;

  const offsetX = (viewW - dispW) / 2;
  const offsetY = (viewH - dispH) / 2;

  // Vision origin = bottom-left. UIKit/RN origin = top-left → flip Y.
  const left = offsetX + r.x * dispW;
  const top = offsetY + (1 - r.y - r.height) * dispH;
  const width = r.width * dispW;
  const height = r.height * dispH;

  return { left, top, width, height };
}

// This call loads the native module object from the JSI.
export default requireNativeModule<YeExpoVisionModule>("YeExpoVision");
