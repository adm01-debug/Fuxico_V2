import { log } from "./logger";
import { featureFlags } from "./feature-flags";

type EventName =
  | "page_view"
  | "email_tracked"
  | "email_opened"
  | "link_clicked"
  | "document_viewed"
  | "export_completed"
  | "filter_applied"
  | "settings_changed"
  | "error_occurred";

interface AnalyticsEvent {
  name: EventName;
  properties?: Record<string, unknown>;
  timestamp: number;
}

class AnalyticsManager {
  private queue: AnalyticsEvent[] = [];
  private initialized = false;

  async init(): Promise<void> {
    if (!featureFlags.isEnabled("enableAnalytics")) {
      log.debug("Analytics disabled by feature flag");
      return;
    }

    const gaId = import.meta.env.VITE_GA_TRACKING_ID;
    const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN;

    if (gaId) {
      await this.initGA(gaId);
    }

    if (mixpanelToken) {
      await this.initMixpanel(mixpanelToken);
    }

    this.initialized = true;
    this.flushQueue();
  }

  private async initGA(id: string): Promise<void> {
    try {
      const script = document.createElement("script");
      script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
      script.async = true;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) {
        (window as any).dataLayer.push(args);
      }
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", id);

      log.debug("Google Analytics initialized");
    } catch (e) {
      log.warn("Failed to initialize GA", e);
    }
  }

  private async initMixpanel(token: string): Promise<void> {
    try {
      const mixpanel = await import("mixpanel-browser");
      mixpanel.default.init(token, { debug: import.meta.env.DEV });
      (window as any).mixpanel = mixpanel.default;
      log.debug("Mixpanel initialized");
    } catch (e) {
      log.warn("Failed to initialize Mixpanel", e);
    }
  }

  track(name: EventName, properties?: Record<string, unknown>): void {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
    };

    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    this.sendEvent(event);
  }

  private sendEvent(event: AnalyticsEvent): void {
    log.debug("Analytics event", event);

    // GA4
    if ((window as any).gtag) {
      (window as any).gtag("event", event.name, event.properties);
    }

    // Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.track(event.name, event.properties);
    }
  }

  private flushQueue(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.sendEvent(event);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    if ((window as any).mixpanel) {
      (window as any).mixpanel.identify(userId);
      if (traits) {
        (window as any).mixpanel.people.set(traits);
      }
    }
  }

  pageView(path: string): void {
    this.track("page_view", { path });
  }
}

export const analytics = new AnalyticsManager();

