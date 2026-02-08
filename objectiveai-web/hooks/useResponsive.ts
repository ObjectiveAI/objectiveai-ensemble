"use client";

import { useState, useEffect } from "react";

/**
 * Breakpoints matching globals.css
 * @see objectiveai-web/app/globals.css
 */
export const MOBILE_BREAKPOINT = 640;
export const TABLET_BREAKPOINT = 1024;

interface ResponsiveState {
  /** Viewport is mobile width (<= 640px) */
  isMobile: boolean;
  /** Viewport is tablet width or smaller (<= 1024px) */
  isTablet: boolean;
  /** Viewport is desktop width (> 1024px) */
  isDesktop: boolean;
  /** Current window width in pixels */
  windowWidth: number;
  /** Whether the component has mounted (for SSR-safe rendering) */
  hasMounted: boolean;
}

/**
 * SSR-safe default state - uses desktop values to avoid layout shift
 * for the majority of users. Mobile users will see a brief flash but
 * this is preferable to hydration errors.
 */
const SSR_DEFAULT_STATE: ResponsiveState = {
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  windowWidth: 1200,
  hasMounted: false,
};

/**
 * Custom hook for detecting responsive breakpoints.
 * Consolidates mobile and tablet detection that was previously
 * duplicated across browse pages.
 *
 * **SSR-Safe:** Always starts with desktop defaults on both server and
 * client to prevent hydration mismatches. After mount, updates to actual
 * viewport size.
 *
 * Breakpoints match globals.css:
 * - Mobile: <= 640px
 * - Tablet: <= 1024px
 * - Desktop: > 1024px
 *
 * @example
 * const { isMobile, isTablet, isDesktop, hasMounted } = useResponsive();
 * // Use for responsive layouts
 * const columns = isDesktop ? 3 : isTablet ? 2 : 1;
 * // Optional: hide content until mounted for SSR-sensitive UI
 * if (!hasMounted) return <Skeleton />;
 */
export function useResponsive(): ResponsiveState {
  // Always initialize with the same values on server and client
  const [state, setState] = useState<ResponsiveState>(SSR_DEFAULT_STATE);

  useEffect(() => {
    const updateState = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width <= MOBILE_BREAKPOINT,
        isTablet: width <= TABLET_BREAKPOINT,
        isDesktop: width > TABLET_BREAKPOINT,
        windowWidth: width,
        hasMounted: true,
      });
    };

    // Initial check after mount
    updateState();

    // Listen for resize events
    window.addEventListener("resize", updateState);

    // Cleanup
    return () => window.removeEventListener("resize", updateState);
  }, []);

  return state;
}

export default useResponsive;
