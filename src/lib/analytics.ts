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

    if (gaId) {
      await this.initGA(gaId);
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
  }

  private flushQueue(): void {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.sendEvent(event);
    }
  }

  identify(userId: string, traits?: Record<string, unknown>): void {
    log.debug("Identify user", { userId, traits });
  }

  pageView(path: string): void {
    this.track("page_view", { path });
  }
}

export const analytics = new AnalyticsManager();
