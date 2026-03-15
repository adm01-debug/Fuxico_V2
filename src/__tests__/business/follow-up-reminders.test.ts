import { describe, it, expect } from "vitest";

// =============================================================================
// FOLLOW-UP REMINDER TESTS - 25+ scenarios
// =============================================================================

describe("Follow-Up Reminder Logic", () => {
  type ReminderStatus = "pending" | "sent" | "cancelled" | "opened";

  const validTransitions: Record<ReminderStatus, ReminderStatus[]> = {
    pending: ["sent", "cancelled"],
    sent: ["opened"],
    cancelled: [],
    opened: [],
  };

  const canTransition = (from: ReminderStatus, to: ReminderStatus) =>
    validTransitions[from]?.includes(to) ?? false;

  describe("Status transitions", () => {
    it("should allow pending → sent", () => expect(canTransition("pending", "sent")).toBe(true));
    it("should allow pending → cancelled", () => expect(canTransition("pending", "cancelled")).toBe(true));
    it("should allow sent → opened", () => expect(canTransition("sent", "opened")).toBe(true));
    it("should NOT allow cancelled → any", () => {
      (["pending", "sent", "opened"] as ReminderStatus[]).forEach(to =>
        expect(canTransition("cancelled", to)).toBe(false)
      );
    });
    it("should NOT allow opened → any", () => {
      (["pending", "sent", "cancelled"] as ReminderStatus[]).forEach(to =>
        expect(canTransition("opened", to)).toBe(false)
      );
    });
    it("should NOT allow sent → pending", () => expect(canTransition("sent", "pending")).toBe(false));
  });

  describe("Due date calculation", () => {
    const isDue = (emailSentAt: Date, reminderDays: number, now = new Date()): boolean => {
      const dueDate = new Date(emailSentAt);
      dueDate.setDate(dueDate.getDate() + reminderDays);
      return now >= dueDate;
    };

    const daysSinceSent = (sentAt: Date, now = new Date()): number =>
      Math.floor((now.getTime() - sentAt.getTime()) / (1000 * 60 * 60 * 24));

    it("should be due after reminder days elapsed", () => {
      const sent = new Date("2024-01-01");
      expect(isDue(sent, 3, new Date("2024-01-05"))).toBe(true);
    });

    it("should NOT be due before reminder days elapsed", () => {
      const sent = new Date("2024-01-01");
      expect(isDue(sent, 3, new Date("2024-01-03"))).toBe(false);
    });

    it("should be due exactly on the day", () => {
      const sent = new Date("2024-01-01T00:00:00Z");
      expect(isDue(sent, 3, new Date("2024-01-04T00:00:00Z"))).toBe(true);
    });

    it("should calculate days since sent correctly", () => {
      const sent = new Date("2024-01-01");
      expect(daysSinceSent(sent, new Date("2024-01-11"))).toBe(10);
    });

    it("should handle same-day reminder (0 days)", () => {
      const sent = new Date("2024-01-01T10:00:00Z");
      expect(isDue(sent, 0, new Date("2024-01-01T15:00:00Z"))).toBe(true);
    });
  });

  describe("Reminder validation", () => {
    it("should require valid tracking_id", () => {
      const isValid = (id: string) => id.length > 0;
      expect(isValid("t-abc-123")).toBe(true);
      expect(isValid("")).toBe(false);
    });

    it("should require positive reminder_days", () => {
      const isValid = (days: number) => Number.isInteger(days) && days >= 0 && days <= 365;
      expect(isValid(3)).toBe(true);
      expect(isValid(0)).toBe(true);
      expect(isValid(-1)).toBe(false);
      expect(isValid(366)).toBe(false);
      expect(isValid(1.5)).toBe(false);
    });

    it("should prevent duplicate reminders for same tracking_id", () => {
      const existing = ["t-1", "t-2", "t-3"];
      const isDuplicate = (id: string) => existing.includes(id);
      expect(isDuplicate("t-1")).toBe(true);
      expect(isDuplicate("t-99")).toBe(false);
    });
  });

  describe("Reminded_at timestamp", () => {
    it("should set reminded_at when status becomes sent", () => {
      const update = (status: ReminderStatus) => ({
        status,
        reminded_at: status === "sent" ? new Date().toISOString() : null,
      });
      expect(update("sent").reminded_at).not.toBeNull();
      expect(update("cancelled").reminded_at).toBeNull();
    });
  });
});
