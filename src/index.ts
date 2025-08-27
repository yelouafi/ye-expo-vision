// Reexport the native module. On web, it will be resolved to YeExpoVisionModule.web.ts
// and on native platforms to YeExpoVisionModule.ts
import YeExpoVisionModule from "./YeExpoVisionModule";

export default YeExpoVisionModule;
export const {
  recognizeText,
  recognizeTextInImageMLKit,
  getSupportedLanguages,
} = YeExpoVisionModule;
export * from "./YeExpoVision.types";
