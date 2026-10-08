import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

/** A model the agent wants — provider-agnostic reference. */
export type ModelRef = {
  provider: "openai" | "anthropic" | "openrouter";
  modelId: string;
  /**
   * OpenRouter-only routing hints — provider routing (`zdr`, ordering) and
   * `models` fallback chain. Ignored by direct providers.
   */
  routing?: { zdr?: boolean; fallbacks?: string[] };
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
  openrouterApiKey?: string | undefined;
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
    case "openrouter": {
      if (!keys.openrouterApiKey) throw new AiProviderNotConfiguredError("openrouter");
      const openrouter = createOpenRouter({ apiKey: keys.openrouterApiKey });
      const extraBody: Record<string, unknown> = {};
      if (ref.routing?.zdr) {
        extraBody.provider = { zdr: true, data_collection: "deny" };
      }
      if (ref.routing?.fallbacks?.length) {
        extraBody.models = ref.routing.fallbacks;
      }
      return openrouter(ref.modelId, Object.keys(extraBody).length > 0 ? { extraBody } : {});
    }
  }
}
