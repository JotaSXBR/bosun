import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

/** A model the agent wants — provider-agnostic reference. */
export type ModelRef = {
  provider: "openai" | "anthropic";
  modelId: string;
};

export class AiProviderNotConfiguredError extends Error {
  constructor(provider: ModelRef["provider"]) {
    super(`AI provider "${provider}" is not configured (missing API key)`);
    this.name = "AiProviderNotConfiguredError";
  }
}

export type AiProviderKeys = {
  openaiApiKey?: string | undefined;
  anthropicApiKey?: string | undefined;
};

/**
 * The ONLY switch on provider — resolves a ModelRef to an AI SDK
 * LanguageModel. Throws AiProviderNotConfiguredError when the key is missing.
 */
export function resolveLanguageModel(ref: ModelRef, keys: AiProviderKeys): LanguageModel {
  switch (ref.provider) {
    case "openai": {
      if (!keys.openaiApiKey) throw new AiProviderNotConfiguredError("openai");
      const openai = createOpenAI({ apiKey: keys.openaiApiKey });
      return openai(ref.modelId);
    }
    case "anthropic": {
      if (!keys.anthropicApiKey) throw new AiProviderNotConfiguredError("anthropic");
      const anthropic = createAnthropic({ apiKey: keys.anthropicApiKey });
      return anthropic(ref.modelId);
    }
  }
}
