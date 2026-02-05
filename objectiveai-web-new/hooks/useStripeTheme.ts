import { useState, useEffect } from "react";

/**
 * Hook to get the current theme for Stripe Elements.
 * Reads from document.documentElement.dataset.theme.
 */
export function useStripeTheme(): "light" | "dark" {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Read from document attribute
    const getTheme = (): "light" | "dark" => {
      const dataTheme = document.documentElement.dataset.theme;
      return dataTheme === "dark" ? "dark" : "light";
    };

    setTheme(getTheme());

    // Watch for changes
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  return theme;
}
