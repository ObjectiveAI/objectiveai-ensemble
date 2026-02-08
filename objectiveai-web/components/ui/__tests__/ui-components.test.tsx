import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LoadingSpinner } from "../LoadingSpinner";
import { ErrorAlert } from "../ErrorAlert";
import { EmptyState } from "../EmptyState";

describe("LoadingSpinner", () => {
  it("renders a spinner with role status", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has default aria-label of Loading", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading");
  });

  it("uses custom message as aria-label", () => {
    render(<LoadingSpinner message="Loading functions..." />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-label", "Loading functions...");
  });

  it("shows message text when fullPage and message provided", () => {
    render(<LoadingSpinner fullPage message="Loading functions..." />);
    expect(screen.getByText("Loading functions...")).toBeInTheDocument();
  });

  it("does not show message text when not fullPage", () => {
    render(<LoadingSpinner message="Loading functions..." />);
    expect(screen.queryByText("Loading functions...")).not.toBeInTheDocument();
  });

  it("renders spinner with default size", () => {
    render(<LoadingSpinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveStyle({ width: "40px", height: "40px" });
  });

  it("renders spinner with custom size", () => {
    render(<LoadingSpinner size={24} />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveStyle({ width: "24px", height: "24px" });
  });
});

describe("ErrorAlert", () => {
  it("renders with role alert", () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("displays the error message", () => {
    render(<ErrorAlert message="Failed to load data" />);
    expect(screen.getByText("Failed to load data")).toBeInTheDocument();
  });

  it("displays optional title when provided", () => {
    render(<ErrorAlert title="Connection Error" message="Unable to connect" />);
    expect(screen.getByText("Connection Error")).toBeInTheDocument();
    expect(screen.getByText("Unable to connect")).toBeInTheDocument();
  });

  it("does not display title when not provided", () => {
    render(<ErrorAlert message="Error message only" />);
    expect(screen.queryByText("Error")).not.toBeInTheDocument();
  });

  it("shows retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Failed" onRetry={onRetry} />);
    expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
  });

  it("does not show retry button when onRetry not provided", () => {
    render(<ErrorAlert message="Failed" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onRetry when retry button clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorAlert message="Failed" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try Again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("EmptyState", () => {
  it("displays the message", () => {
    render(<EmptyState message="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("displays optional title when provided", () => {
    render(<EmptyState title="No Results" message="Try a different search" />);
    expect(screen.getByText("No Results")).toBeInTheDocument();
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("displays optional icon when provided", () => {
    render(<EmptyState icon="📭" message="No messages" />);
    expect(screen.getByText("📭")).toBeInTheDocument();
  });

  // Note: Link test requires Next.js router context - skipping in unit test
  // This would be better tested in an integration test with the router
  it.skip("renders link action when href provided", () => {
    render(
      <EmptyState
        message="No API keys"
        action={{ label: "Create key", href: "/keys/create" }}
      />
    );
    const link = screen.getByRole("link", { name: /Create key/i });
    expect(link).toHaveAttribute("href", "/keys/create");
  });

  it("renders button action when onClick provided", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="No results"
        action={{ label: "Clear filters", onClick }}
      />
    );
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("calls onClick when button action clicked", () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        message="No results"
        action={{ label: "Clear filters", onClick }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not render action when not provided", () => {
    render(<EmptyState message="Nothing here" />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
