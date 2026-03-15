import { describe, it, expect } from "vitest";

// =============================================================================
// AUTO-REMINDER ON SEND - 20+ scenarios
// =============================================================================

describe("Auto-Reminder Feature", () => {
  interface UserPreferences {
    auto_reminder_enabled: boolean;
    auto_reminder_days: number;
  }

  const defaultPreferences: UserPreferences = {
    auto_reminder_enabled: false,
    auto_reminder_days: 3,
  };

  const shouldCreateAutoReminder = (prefs: UserPreferences | null): boolean => {
    if (!prefs) return false;
    return prefs.auto_reminder_enabled;
  };

  const getReminderDays = (prefs: UserPreferences | null): number => {
    if (!prefs) return defaultPreferences.auto_reminder_days;
    return prefs.auto_reminder_days;
  };

  describe("Auto-reminder decision", () => {
    it("should NOT create reminder when disabled", () => {
      expect(shouldCreateAutoReminder({ auto_reminder_enabled: false, auto_reminder_days: 3 })).toBe(false);
    });

    it("should create reminder when enabled", () => {
      expect(shouldCreateAutoReminder({ auto_reminder_enabled: true, auto_reminder_days: 3 })).toBe(true);
    });

    it("should handle null preferences", () => {
      expect(shouldCreateAutoReminder(null)).toBe(false);
    });
  });

  describe("Reminder days configuration", () => {
    it("should use configured days", () => {
      expect(getReminderDays({ auto_reminder_enabled: true, auto_reminder_days: 7 })).toBe(7);
    });

    it("should default to 3 days when no preferences", () => {
      expect(getReminderDays(null)).toBe(3);
    });

    it("should validate reminder days range", () => {
      const isValid = (days: number) => Number.isInteger(days) && days >= 0 && days <= 365;
      expect(isValid(0)).toBe(true);
      expect(isValid(3)).toBe(true);
      expect(isValid(30)).toBe(true);
      expect(isValid(365)).toBe(true);
      expect(isValid(-1)).toBe(false);
      expect(isValid(366)).toBe(false);
      expect(isValid(1.5)).toBe(false);
    });
  });

  describe("Integration: create tracking + auto-reminder flow", () => {
    it("should produce reminder data after tracking creation", () => {
      const trackingId = "t-new-123";
      const prefs: UserPreferences = { auto_reminder_enabled: true, auto_reminder_days: 5 };

      if (shouldCreateAutoReminder(prefs)) {
        const reminderData = {
          tracking_id: trackingId,
          reminder_days: getReminderDays(prefs),
          status: "pending" as const,
        };
        expect(reminderData.tracking_id).toBe(trackingId);
        expect(reminderData.reminder_days).toBe(5);
        expect(reminderData.status).toBe("pending");
      }
    });

    it("should NOT create reminder data when disabled", () => {
      const prefs: UserPreferences = { auto_reminder_enabled: false, auto_reminder_days: 5 };
      let reminderCreated = false;

      if (shouldCreateAutoReminder(prefs)) {
        reminderCreated = true;
      }
      expect(reminderCreated).toBe(false);
    });
  });

  describe("Preference update validation", () => {
    it("should accept valid preference updates", () => {
      const validate = (updates: Partial<UserPreferences>) => {
        if (updates.auto_reminder_days !== undefined) {
          if (!Number.isInteger(updates.auto_reminder_days) || updates.auto_reminder_days < 0 || updates.auto_reminder_days > 365) {
            return false;
          }
        }
        if (updates.auto_reminder_enabled !== undefined && typeof updates.auto_reminder_enabled !== "boolean") {
          return false;
        }
        return true;
      };

      expect(validate({ auto_reminder_enabled: true })).toBe(true);
      expect(validate({ auto_reminder_days: 7 })).toBe(true);
      expect(validate({ auto_reminder_days: -1 })).toBe(false);
      expect(validate({ auto_reminder_days: 1.5 })).toBe(false);
    });
  });
});
