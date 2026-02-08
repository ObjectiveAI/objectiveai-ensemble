"use client";

import { useResponsive } from "./useResponsive";

/**
 * Custom hook for detecting mobile viewport.
 * Uses 640px breakpoint to match globals.css mobile styles.
 *
 * **Note:** This is a convenience wrapper around `useResponsive()`.
 * For more responsive states (tablet, desktop), use `useResponsive()` directly.
 *
 * @returns boolean indicating if viewport is mobile width (<= 640px)
 *
 * @example
 * const isMobile = useIsMobile();
 * // Use for responsive styling
 * <div style={{ padding: isMobile ? '16px' : '32px' }}>
 */
export function useIsMobile(): boolean {
  const { isMobile } = useResponsive();
  return isMobile;
}

export default useIsMobile;
