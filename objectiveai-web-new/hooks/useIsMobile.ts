"use client";

import { useState, useEffect } from "react";

/**
 * Mobile breakpoint matching globals.css
 * @see objectiveai-web-new/app/globals.css - @media (max-width: 640px)
 */
const MOBILE_BREAKPOINT = 640;

/**
 * Custom hook for detecting mobile viewport.
 * Uses 640px breakpoint to match globals.css mobile styles.
 *
 * @returns boolean indicating if viewport is mobile width (<= 640px)
 *
 * @example
 * const isMobile = useIsMobile();
 * // Use for responsive styling
 * <div style={{ padding: isMobile ? '16px' : '32px' }}>
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener("resize", checkMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return isMobile;
}

export default useIsMobile;
