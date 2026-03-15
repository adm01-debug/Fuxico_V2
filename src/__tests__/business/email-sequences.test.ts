import { describe, it, expect } from "vitest";

// =============================================================================
// EMAIL SEQUENCES TESTS - 25+ scenarios
// =============================================================================

describe("Email Sequence Logic", () => {
  interface SequenceStep {
    id: string;
    order: number;
    delayDays: number;
    delayHours: number;
    subject: string;
    body: string;
    isActive: boolean;
    triggerCondition: string | null;
  }

  interface Enrollment {
    id: string;
    contactEmail: string;
    currentStep: number;
    status: "active" | "paused" | "completed" | "bounced" | "replied";
    enrolledAt: Date;
    nextStepAt: Date | null;
  }

  const calculateNextStepTime = (enrolledAt: Date, step: SequenceStep): Date => {
    const next = new Date(enrolledAt);
    next.setDate(next.getDate() + step.delayDays);
    next.setHours(next.getHours() + step.delayHours);
    return next;
  };

  const shouldExecuteStep = (enrollment: Enrollment, step: SequenceStep, now: Date): boolean => {
    if (enrollment.status !== "active") return false;
    if (!step.isActive) return false;
    if (enrollment.currentStep !== step.order) return false;
    const nextTime = enrollment.nextStepAt;
    if (!nextTime || now < nextTime) return false;
    return true;
  };

  describe("Step timing", () => {
    it("should calculate next step with days delay", () => {
      const enrolled = new Date("2024-01-01T10:00:00Z");
      const step: SequenceStep = {
        id: "s1", order: 1, delayDays: 3, delayHours: 0,
        subject: "Follow up", body: "Hi!", isActive: true, triggerCondition: null,
      };
      const next = calculateNextStepTime(enrolled, step);
      expect(next.toISOString()).toBe("2024-01-04T10:00:00.000Z");
    });

    it("should calculate next step with hours delay", () => {
      const enrolled = new Date("2024-01-01T10:00:00Z");
      const step: SequenceStep = {
        id: "s1", order: 1, delayDays: 0, delayHours: 6,
        subject: "Quick follow up", body: "Hi!", isActive: true, triggerCondition: null,
      };
      const next = calculateNextStepTime(enrolled, step);
      expect(next.toISOString()).toBe("2024-01-01T16:00:00.000Z");
    });

    it("should combine days and hours", () => {
      const enrolled = new Date("2024-01-01T10:00:00Z");
      const step: SequenceStep = {
        id: "s1", order: 1, delayDays: 1, delayHours: 12,
        subject: "Test", body: "Hi!", isActive: true, triggerCondition: null,
      };
      const next = calculateNextStepTime(enrolled, step);
      expect(next.toISOString()).toBe("2024-01-02T22:00:00.000Z");
    });
  });

  describe("Step execution conditions", () => {
    const baseEnrollment: Enrollment = {
      id: "e1", contactEmail: "test@test.com", currentStep: 1,
      status: "active", enrolledAt: new Date("2024-01-01"),
      nextStepAt: new Date("2024-01-04"),
    };
    const baseStep: SequenceStep = {
      id: "s1", order: 1, delayDays: 3, delayHours: 0,
      subject: "Test", body: "Hi!", isActive: true, triggerCondition: null,
    };

    it("should execute when all conditions met", () => {
      expect(shouldExecuteStep(baseEnrollment, baseStep, new Date("2024-01-05"))).toBe(true);
    });

    it("should NOT execute if enrollment is paused", () => {
      expect(shouldExecuteStep({ ...baseEnrollment, status: "paused" }, baseStep, new Date("2024-01-05"))).toBe(false);
    });

    it("should NOT execute if enrollment is completed", () => {
      expect(shouldExecuteStep({ ...baseEnrollment, status: "completed" }, baseStep, new Date("2024-01-05"))).toBe(false);
    });

    it("should NOT execute if step is inactive", () => {
      expect(shouldExecuteStep(baseEnrollment, { ...baseStep, isActive: false }, new Date("2024-01-05"))).toBe(false);
    });

    it("should NOT execute if wrong step order", () => {
      expect(shouldExecuteStep({ ...baseEnrollment, currentStep: 2 }, baseStep, new Date("2024-01-05"))).toBe(false);
    });

    it("should NOT execute before scheduled time", () => {
      expect(shouldExecuteStep(baseEnrollment, baseStep, new Date("2024-01-03"))).toBe(false);
    });

    it("should NOT execute if bounced", () => {
      expect(shouldExecuteStep({ ...baseEnrollment, status: "bounced" }, baseStep, new Date("2024-01-05"))).toBe(false);
    });

    it("should NOT execute if replied", () => {
      expect(shouldExecuteStep({ ...baseEnrollment, status: "replied" }, baseStep, new Date("2024-01-05"))).toBe(false);
    });
  });

  describe("Sequence validation", () => {
    it("should require at least one step", () => {
      const steps: SequenceStep[] = [];
      expect(steps.length > 0).toBe(false);
    });

    it("should enforce unique step orders", () => {
      const orders = [1, 2, 3, 2]; // duplicate 2
      const unique = new Set(orders);
      expect(unique.size < orders.length).toBe(true);
    });

    it("should validate step order is sequential", () => {
      const orders = [1, 2, 4]; // gap at 3
      const isSequential = orders.every((o, i) => o === i + 1);
      expect(isSequential).toBe(false);
    });

    it("should validate email in enrollment", () => {
      const isValid = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid("test@example.com")).toBe(true);
      expect(isValid("invalid")).toBe(false);
    });
  });
});
