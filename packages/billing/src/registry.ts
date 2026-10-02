import type { AsaasConfig, FetchLike } from "./adapters/asaas";
import { AsaasBillingProvider } from "./adapters/asaas";
import type { BillingProvider } from "./domain";

export type BillingProviderConfig = { kind: "asaas" } & AsaasConfig;

/** The only switch on provider kind — callers use the BillingProvider interface. */
export function createBillingProvider(
  config: BillingProviderConfig,
  deps?: { fetch?: FetchLike },
): BillingProvider {
  return new AsaasBillingProvider(config, deps);
}
