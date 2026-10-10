import type { AiProviderKeys } from "@crm/ai";

/** Maps an org credential row to the key bundle `resolveLanguageModel` wants. */
export function keysFor(cred: { provider: string; apiKey: string }): AiProviderKeys {
  return {
    openaiApiKey: cred.provider === "openai" ? cred.apiKey : undefined,
    anthropicApiKey: cred.provider === "anthropic" ? cred.apiKey : undefined,
    openrouterApiKey: cred.provider === "openrouter" ? cred.apiKey : undefined,
  };
}
