import { log } from "./logger";

interface FeatureFlags {
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  enableBetaFeatures: boolean;
  enableABTesting: boolean;
  enableAdvancedExport: boolean;
  enableWebhooks: boolean;
  enableBitrix24: boolean;
  enableDocumentTracking: boolean;
  enablePushNotifications: boolean;
  enableCampaigns: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableAnalytics: false,
  enableDebugMode: false,
  enableBetaFeatures: false,
  enableABTesting: true,
  enableAdvancedExport: true,
  enableWebhooks: true,
  enableBitrix24: true,
  enableDocumentTracking: true,
  enablePushNotifications: true,
  enableCampaigns: true,
};

class FeatureFlagManager {
  private flags: FeatureFlags;
  private overrides: Partial<FeatureFlags> = {};

  constructor() {
    this.flags = { ...DEFAULT_FLAGS };
    this.loadFromEnv();
    this.loadFromStorage();
  }

  private loadFromEnv(): void {
    if (import.meta.env.VITE_ENABLE_ANALYTICS === "true") {
      this.flags.enableAnalytics = true;
    }
    if (import.meta.env.VITE_ENABLE_DEBUG === "true") {
      this.flags.enableDebugMode = true;
    }
    if (import.meta.env.VITE_ENABLE_BETA === "true") {
      this.flags.enableBetaFeatures = true;
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem("feature_flags");
      if (stored) {
        this.overrides = JSON.parse(stored);
        log.debug("Loaded feature flag overrides", this.overrides);
      }
    } catch {
      // Ignore storage errors
    }
  }

  isEnabled(flag: keyof FeatureFlags): boolean {
    return this.overrides[flag] ?? this.flags[flag] ?? false;
  }

  setOverride(flag: keyof FeatureFlags, value: boolean): void {
    this.overrides[flag] = value;
    try {
      localStorage.setItem("feature_flags", JSON.stringify(this.overrides));
    } catch {
      // Ignore storage errors
    }
    log.debug(`Feature flag ${flag} set to ${value}`);
  }

  clearOverrides(): void {
    this.overrides = {};
    localStorage.removeItem("feature_flags");
  }

  getAllFlags(): FeatureFlags {
    return { ...this.flags, ...this.overrides };
  }
}

export const featureFlags = new FeatureFlagManager();

export function useFeatureFlag(flag: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(flag);
}

