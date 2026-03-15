import { describe, it, expect } from "vitest";

// Test tracking statistics calculations extracted from use-tracking.ts

interface TrackingEvent {
  event_type: "open" | "click";
  ip_address: string | null;
  is_self_open: boolean;
  created_at: string;
  user_agent: string | null;
}

function calculateStats(events: TrackingEvent[]) {
  const openEvents = events.filter((e) => e.event_type === "open");
  const clickEvents = events.filter((e) => e.event_type === "click");

  return {
    totalOpens: openEvents.length,
    uniqueOpens: new Set(openEvents.map((e) => e.ip_address)).size,
    selfOpens: openEvents.filter((e) => e.is_self_open).length,
    totalClicks: clickEvents.length,
    uniqueClicks: new Set(clickEvents.map((e) => e.ip_address)).size,
    firstOpened:
      openEvents.length > 0 ? openEvents[openEvents.length - 1].created_at : null,
    lastOpened: openEvents.length > 0 ? openEvents[0].created_at : null,
  };
}

function calculateDeviceBreakdown(events: TrackingEvent[]) {
  return events.reduce(
    (acc, event) => {
      const ua = event.user_agent?.toLowerCase() || "";
      if (
        ua.includes("mobile") ||
        ua.includes("android") ||
        ua.includes("iphone")
      ) {
        acc.mobile++;
      } else if (ua.includes("ipad") || ua.includes("tablet")) {
        acc.tablet++;
      } else {
        acc.desktop++;
      }
      return acc;
    },
    { mobile: 0, desktop: 0, tablet: 0 }
  );
}

describe("Tracking Stats Calculation", () => {
  // ===== EMPTY DATA =====
  describe("Empty data handling", () => {
    it("should return zeros for no events", () => {
      const stats = calculateStats([]);
      expect(stats.totalOpens).toBe(0);
      expect(stats.uniqueOpens).toBe(0);
      expect(stats.totalClicks).toBe(0);
      expect(stats.uniqueClicks).toBe(0);
      expect(stats.selfOpens).toBe(0);
      expect(stats.firstOpened).toBeNull();
      expect(stats.lastOpened).toBeNull();
    });
  });

  // ===== OPEN TRACKING =====
  describe("Open tracking", () => {
    it("should count total opens correctly", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T12:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.totalOpens).toBe(3);
    });

    it("should count unique opens by IP", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T12:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.uniqueOpens).toBe(2);
    });

    it("should count self opens", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: true, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: true, created_at: "2024-01-01T12:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.selfOpens).toBe(2);
    });

    it("should handle null IP addresses in unique count", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: null, is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "open", ip_address: null, is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.totalOpens).toBe(2);
      // Both have null IP, so unique = 1
      expect(stats.uniqueOpens).toBe(1);
    });
  });

  // ===== CLICK TRACKING =====
  describe("Click tracking", () => {
    it("should count total clicks", () => {
      const events: TrackingEvent[] = [
        { event_type: "click", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "click", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.totalClicks).toBe(2);
    });

    it("should count unique clicks by IP", () => {
      const events: TrackingEvent[] = [
        { event_type: "click", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "click", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
        { event_type: "click", ip_address: "3.3.3.3", is_self_open: false, created_at: "2024-01-01T12:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.uniqueClicks).toBe(2);
    });

    it("should separate clicks from opens", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
        { event_type: "click", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: null },
      ];
      const stats = calculateStats(events);
      expect(stats.totalOpens).toBe(1);
      expect(stats.totalClicks).toBe(1);
    });
  });

  // ===== DEVICE DETECTION =====
  describe("Device detection", () => {
    it("should detect mobile devices", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS)" },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: "Mozilla/5.0 (Linux; Android 13)" },
      ];
      const devices = calculateDeviceBreakdown(events);
      expect(devices.mobile).toBe(2);
      expect(devices.desktop).toBe(0);
    });

    it("should detect desktop devices", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64)" },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X)" },
      ];
      const devices = calculateDeviceBreakdown(events);
      expect(devices.mobile).toBe(0);
      expect(devices.desktop).toBe(2);
    });

    it("should handle mixed devices", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: "Mozilla/5.0 (iPhone)" },
        { event_type: "open", ip_address: "2.2.2.2", is_self_open: false, created_at: "2024-01-01T11:00:00Z", user_agent: "Mozilla/5.0 (Windows NT)" },
        { event_type: "open", ip_address: "3.3.3.3", is_self_open: false, created_at: "2024-01-01T12:00:00Z", user_agent: "Mozilla/5.0 (Linux; Android)" },
      ];
      const devices = calculateDeviceBreakdown(events);
      expect(devices.mobile).toBe(2);
      expect(devices.desktop).toBe(1);
    });

    it("should handle null user agents as desktop", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: null },
      ];
      const devices = calculateDeviceBreakdown(events);
      expect(devices.desktop).toBe(1);
    });

    it("should detect iPad as tablet", () => {
      const events: TrackingEvent[] = [
        { event_type: "open", ip_address: "1.1.1.1", is_self_open: false, created_at: "2024-01-01T10:00:00Z", user_agent: "Mozilla/5.0 (iPad; CPU OS 17_0)" },
      ];
      const devices = calculateDeviceBreakdown(events);
      expect(devices.tablet).toBe(1);
      expect(devices.desktop).toBe(0);
    });
  });

  // ===== LARGE DATASET =====
  describe("Large dataset handling", () => {
    it("should handle 1000 events", () => {
      const events: TrackingEvent[] = Array.from({ length: 1000 }, (_, i) => ({
        event_type: (i % 3 === 0 ? "click" : "open") as "open" | "click",
        ip_address: `192.168.1.${i % 255}`,
        is_self_open: i % 10 === 0,
        created_at: `2024-01-${String((i % 28) + 1).padStart(2, "0")}T10:00:00Z`,
        user_agent: i % 2 === 0 ? "Desktop" : "Mobile iPhone",
      }));

      const stats = calculateStats(events);
      expect(stats.totalOpens + stats.totalClicks).toBe(1000);
      expect(stats.totalOpens).toBeGreaterThan(0);
      expect(stats.totalClicks).toBeGreaterThan(0);
    });
  });

  // ===== OPEN RATE CALCULATION =====
  describe("Open/Click rate calculations", () => {
    it("should calculate open rate correctly", () => {
      const totalEmails = 100;
      const emailsWithOpens = 35;
      const openRate = Math.round((emailsWithOpens / totalEmails) * 100);
      expect(openRate).toBe(35);
    });

    it("should handle 0 emails (avoid division by zero)", () => {
      const totalEmails = 0;
      const openRate = totalEmails > 0 ? Math.round((0 / totalEmails) * 100) : 0;
      expect(openRate).toBe(0);
    });

    it("should calculate click rate based on opens", () => {
      const emailsWithOpens = 50;
      const emailsWithClicks = 15;
      const clickRate =
        emailsWithOpens > 0
          ? Math.round((emailsWithClicks / emailsWithOpens) * 100)
          : 0;
      expect(clickRate).toBe(30);
    });

    it("should cap rates at 100%", () => {
      const rate = Math.min(100, Math.round((120 / 100) * 100));
      expect(rate).toBe(100);
    });
  });
});
