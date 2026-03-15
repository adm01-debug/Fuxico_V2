import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Mock sentry
vi.mock("@/lib/sentry", () => ({
  captureException: vi.fn().mockReturnValue("event-123"),
  addBreadcrumb: vi.fn(),
  setContext: vi.fn(),
}));

import ErrorBoundary from "@/components/ErrorBoundary";

function ThrowingComponent({ shouldThrow = true }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>Content loaded</div>;
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("ErrorBoundary", () => {
  describe("Normal rendering", () => {
    it("should render children when no error", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <div>Safe content</div>
        </ErrorBoundary>
      );
      expect(getByText("Safe content")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <div>Child 1</div>
          <div>Child 2</div>
        </ErrorBoundary>
      );
      expect(getByText("Child 1")).toBeInTheDocument();
      expect(getByText("Child 2")).toBeInTheDocument();
    });
  });

  describe("Error catching", () => {
    it("should catch errors and show fallback UI", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(getByText("Algo deu errado")).toBeInTheDocument();
    });

    it("should show custom fallback when provided", () => {
      const { getByText } = render(
        <ErrorBoundary fallback={<div>Custom error page</div>}>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(getByText("Custom error page")).toBeInTheDocument();
    });

    it("should show reload button", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(getByText("Recarregar")).toBeInTheDocument();
    });

    it("should show home button", () => {
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(getByText("Início")).toBeInTheDocument();
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
      const { getByText } = render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>
      );
      expect(getByText(/event-123/)).toBeInTheDocument();
    });
  });
});
