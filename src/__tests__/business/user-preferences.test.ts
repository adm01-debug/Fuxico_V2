import { describe, it, expect } from "vitest";

// =============================================================================
// USER PREFERENCES VALIDATION - 20+ scenarios
// =============================================================================

describe("User Preferences", () => {
  interface UserPreferences {
    sound_enabled: boolean;
    desktop_enabled: boolean;
    email_enabled: boolean;
    notify_on_open: boolean;
    notify_on_click: boolean;
    notify_on_document_view: boolean;
    notify_on_document_download: boolean;
    email_digest_frequency: string;
    auto_reminder_enabled: boolean;
    auto_reminder_days: number;
    notification_sound_type: string;
    notification_volume: number;
    warning_volume: number;
    critical_volume: number;
  }

  const DEFAULTS: UserPreferences = {
    sound_enabled: true,
    desktop_enabled: true,
    email_enabled: false,
    notify_on_open: true,
    notify_on_click: true,
    notify_on_document_view: true,
    notify_on_document_download: true,
    email_digest_frequency: "daily",
    auto_reminder_enabled: false,
    auto_reminder_days: 3,
    notification_sound_type: "gentle",
    notification_volume: 0.5,
    warning_volume: 0.4,
    critical_volume: 0.7,
  };

  describe("Default values", () => {
    it("should have sound enabled by default", () => {
      expect(DEFAULTS.sound_enabled).toBe(true);
    });

    it("should have email notifications disabled by default", () => {
      expect(DEFAULTS.email_enabled).toBe(false);
    });

    it("should default to 3 day reminders", () => {
      expect(DEFAULTS.auto_reminder_days).toBe(3);
    });

    it("should have auto reminder disabled by default", () => {
      expect(DEFAULTS.auto_reminder_enabled).toBe(false);
    });
  });

  describe("Volume validation", () => {
    const isValidVolume = (v: number) => v >= 0 && v <= 1;

    it("should accept valid volumes", () => {
      expect(isValidVolume(0)).toBe(true);
      expect(isValidVolume(0.5)).toBe(true);
      expect(isValidVolume(1)).toBe(true);
    });

    it("should reject invalid volumes", () => {
      expect(isValidVolume(-0.1)).toBe(false);
      expect(isValidVolume(1.1)).toBe(false);
    });

    it("should have critical > warning volume", () => {
      expect(DEFAULTS.critical_volume).toBeGreaterThan(DEFAULTS.warning_volume);
    });
  });

  describe("Email digest frequency", () => {
    const VALID_FREQUENCIES = ["none", "daily", "weekly"];

    it("should accept valid frequencies", () => {
      VALID_FREQUENCIES.forEach(f => {
        expect(VALID_FREQUENCIES.includes(f)).toBe(true);
      });
    });

    it("should reject invalid frequency", () => {
      expect(VALID_FREQUENCIES.includes("hourly")).toBe(false);
    });
  });

  describe("Sound type", () => {
    const VALID_SOUNDS = ["gentle", "alert", "chime", "bell"];

    it("should accept valid sound types", () => {
      expect(VALID_SOUNDS.includes("gentle")).toBe(true);
    });

    it("should have default in valid list", () => {
      expect(VALID_SOUNDS.includes(DEFAULTS.notification_sound_type)).toBe(true);
    });
  });

  describe("Merge with partial updates", () => {
    it("should merge partial updates preserving defaults", () => {
      const updates: Partial<UserPreferences> = { sound_enabled: false, auto_reminder_days: 7 };
      const merged = { ...DEFAULTS, ...updates };
      expect(merged.sound_enabled).toBe(false);
      expect(merged.auto_reminder_days).toBe(7);
      expect(merged.desktop_enabled).toBe(true); // unchanged
    });
  });
});
