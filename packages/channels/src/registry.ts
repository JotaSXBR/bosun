import type { MetaCloudConfig } from "./adapters/meta-cloud";
import { MetaCloudChannelProvider } from "./adapters/meta-cloud";
import type { FetchLike, WahaConfig } from "./adapters/waha";
import { WahaChannelProvider } from "./adapters/waha";
import type { ChannelProvider } from "./provider";

export type ChannelProviderConfig =
  ({ kind: "waha" } & WahaConfig) | ({ kind: "meta_cloud" } & MetaCloudConfig);

/**
 * The ONLY switch on provider kind in the codebase — everything else works
 * through the ChannelProvider interface.
 */
export function createChannelProvider(
  config: ChannelProviderConfig,
  deps?: { fetch?: FetchLike },
): ChannelProvider {
  switch (config.kind) {
    case "waha":
      return new WahaChannelProvider(config, deps);
    case "meta_cloud":
      return new MetaCloudChannelProvider(config, deps);
  }
}
