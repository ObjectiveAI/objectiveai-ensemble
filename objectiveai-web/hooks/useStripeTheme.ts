import { useSyncExternalStore } from "react";

// Read theme from DOM
function getTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const dataTheme = document.documentElement.dataset.theme;
  return dataTheme === "dark" ? "dark" : "light";
}

// Snapshot function for useSyncExternalStore
function getSnapshot(): "light" | "dark" {
  return getTheme();
}

// Server snapshot
function getServerSnapshot(): "light" | "dark" {
  return "light";
}

// Subscribe to theme changes
function subscribe(callback: () => void): () => void {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

/**
 * Hook to get the current theme for Stripe Elements.
 * Reads from document.documentElement.dataset.theme.
 */
export function useStripeTheme(): "light" | "dark" {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
