//
import { z } from "zod";
import { aiGenerateObject, AiModel, LanguageModelMap } from "./generate";
import { CoreMessage } from "ai";

const SYSTEM_PROMPT = (opts: { sourceLang: string; targetLang: string }) => `
You are a specialized AI assistant designed to translate text captured from phone camera images.
Your role is to translate texts in ${opts.sourceLang} language to ${opts.targetLang}. 
You will accurately translate text found in real-world signage, street signs, shop displays, menus, notices, and other visual text elements that users photograph with their mobile devices.


Your input will be a list of text elements; your output will be an array of objects with original and translated text.
Recognize common abbreviations and symbols used in public signage
Understand that some text may be partially obscured or at angles
If text is unclear, try to guess the meaning and provide a translation. Otherwise, return an empty string.
In general, prefer concise & short translations.
For numbers, no need to translate them unless they are not in latin characters.

IMPORTANT: If the text is not in ${opts.sourceLang} language, **return an empty string**.
`;

const TranslationSchema = z.object({
  translations: z.array(
    z
      .string()
      .describe(
        "The translated text, it's important to provide the translations in the same order as the input text elements. If the text is not in the source language, **return an empty string**."
      )
  ),
});

const GOOGLE_NO_THINKING_CONFIG = {
  thinkingConfig: {
    thinkingBudget: 0,
  },
};

const GROQ_NO_THINKING_CONFIG = {
  reasoning_effort: "low",
};

type TranslationOptions = {
  model: AiModel;
  texts: string[];
  sourceLang: string;
  targetLang: string;
};

type TranslationResult = string[];

export async function llm_translate(
  opts: TranslationOptions
): Promise<TranslationResult> {
  //
  const modelName = opts.model ?? "google/gemini-flash";
  const model = LanguageModelMap[modelName];
  let messages: CoreMessage[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT({
        sourceLang: opts.sourceLang,
        targetLang: opts.targetLang,
      }),
    },
    {
      role: "user",
      content: `Translate the following text elements to ${opts.targetLang}: \n\n${JSON.stringify(
        opts.texts,
        null,
        2
      )}`,
    },
  ];

  const providerOptions = modelName.startsWith("google")
    ? GOOGLE_NO_THINKING_CONFIG
    : modelName.startsWith("groq/gpt-oss")
      ? GROQ_NO_THINKING_CONFIG
      : {};

  const schema = TranslationSchema;

  let result = await aiGenerateObject({
    model,
    messages,
    schema,
    providerOptions,
    maxRetries: 0,
  });

  // if (opts.mode === "speaker") {
  //   console.log("prompt system", messages[0].content);
  //   console.log("prompt user", messages[1].content);
  //   console.log("result", result.object);
  // }

  return result.object.translations;
}
