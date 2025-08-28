export {
  generateText as aiGenerateText,
  generateObject as aiGenerateObject,
} from "ai";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const groq = createGroq({
  apiKey: process.env.EXPO_PUBLIC_GORQ_API_KEY,
});

const google = createGoogleGenerativeAI({
  apiKey: process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY,
});

export const LanguageModelMap = {
  "groq/llama-3.3-70b-versatile": groq("llama-3.3-70b-versatile"),
  "groq/gpt-oss-120b": groq("openai/gpt-oss-120b"),
  "groq/gpt-oss-20b": groq("openai/gpt-oss-20b"),
  //
  "google/gemini-pro": google("gemini-2.5-pro"),
  "google/gemini-flash": google("gemini-2.5-flash"),
  "google/gemini-flash-lite": google("gemini-2.5-flash-lite-preview-06-17"),
};

export type AiModel = keyof typeof LanguageModelMap;
