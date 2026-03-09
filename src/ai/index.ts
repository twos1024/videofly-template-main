import type { AIVideoProvider, AIImageProvider } from "./types";
import { EvolinkProvider } from "./providers/evolink";
import { KieProvider } from "./providers/kie";

export type ProviderType = "evolink" | "kie";

const VALID_PROVIDERS: ReadonlySet<string> = new Set<ProviderType>(["evolink", "kie"]);

export function isValidProviderType(value: unknown): value is ProviderType {
  return typeof value === "string" && VALID_PROVIDERS.has(value);
}

const providers: Map<ProviderType, AIVideoProvider> = new Map();

export function getProvider(type: ProviderType): AIVideoProvider {
  if (providers.has(type)) return providers.get(type)!;

  let provider: AIVideoProvider;
  switch (type) {
    case "evolink": {
      const apiKey = process.env.EVOLINK_API_KEY;
      if (!apiKey) throw new Error("EVOLINK_API_KEY environment variable is not set");
      provider = new EvolinkProvider(apiKey);
      break;
    }
    case "kie": {
      const apiKey = process.env.KIE_API_KEY;
      if (!apiKey) throw new Error("KIE_API_KEY environment variable is not set");
      provider = new KieProvider(apiKey);
      break;
    }
    default:
      throw new Error(`Unknown provider: ${type}`);
  }

  providers.set(type, provider);
  return provider;
}

export function getDefaultProvider(): AIVideoProvider {
  const type = (process.env.DEFAULT_AI_PROVIDER as ProviderType) || "evolink";
  return getProvider(type);
}

export function getImageProvider(type?: ProviderType): AIImageProvider {
  const providerType = type || (process.env.DEFAULT_AI_PROVIDER as ProviderType) || "evolink";
  return getProvider(providerType) as unknown as AIImageProvider;
}

export * from "./types";
