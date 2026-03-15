import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock sentry
vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn().mockReturnValue("event-123"),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
}));

// Import after mocks
import ErrorBoundary from "@/components/ErrorBoundary";

// Component that throws
function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Content loaded</div>;
}

// Suppress console.error for expected errors
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  // ===== NORMAL RENDERING =====
  describe("Normal rendering", () => {
    it("should render children when no error", () => {
      render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      );
      expect(screen.getByText("Safe content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );
      expect(screen.getByText("Child 1")).toBeInTheDocument();
      expect(screen.getByText("Child 2")).toBeInTheDocument();
    });
  });

  // ===== ERROR CATCHING =====
  describe("Error catching", () => {
    it("should catch errors and show fallback UI", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("Algo deu errado")).toBeInTheDocument();
    });

    it("should show custom fallback when provided", () => {
      render(
        <ErrorBoundary fallback={<div>Custom error page</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("Custom error page")).toBeInTheDocument();
    });

    it("should show reload button", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("Recarregar")).toBeInTheDocument();
    });

    it("should show home button", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("Início")).toBeInTheDocument();
    });

    it("should report to Sentry", () => {
      const { captureException } = require("@/lib/sentry");
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(captureException).toHaveBeenCalled();
    });

    it("should show event ID", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText(/event-123/)).toBeInTheDocument();
    });
  });
});
