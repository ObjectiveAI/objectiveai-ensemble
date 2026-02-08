/**
 * Timing constants for UI interactions
 * Centralizes magic numbers for timeouts and delays
 */

// Feedback durations - how long to show success states
export const COPY_FEEDBACK_DURATION_MS = 2000;

// Animation durations
export const PINNED_COLOR_ANIMATION_MS = 1000;
export const TRANSITION_FAST_MS = 150;
export const TRANSITION_NORMAL_MS = 300;
export const TRANSITION_SLOW_MS = 500;

// Layout timing - delays for DOM calculations
export const NAV_HEIGHT_CALCULATION_DELAY_MS = 100;

// Input behavior
export const DROPDOWN_BLUR_DELAY_MS = 150;
export const WASM_VALIDATION_DEBOUNCE_MS = 300;
export const SEARCH_DEBOUNCE_MS = 300;

// API timeouts
export const API_TIMEOUT_MS = 30000;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const BROWSE_PAGE_INITIAL_COUNT = 6;
export const BROWSE_PAGE_LOAD_MORE_COUNT = 6;

// Layout dimensions
export const STICKY_BAR_HEIGHT = 72;
export const SAFE_GAP = 24; // Gap below nav for content breathing room
export const STICKY_SEARCH_OVERLAP = 12; // How much the search bar tucks under the nav

// Stripe payment timing
export const STRIPE_TAX_PROPAGATION_DELAY_MS = 10000;  // 10 seconds for tax calculation
export const STRIPE_MIN_CREDITS_CENTS = 500;           // $5 minimum
export const STRIPE_MAX_CREDITS_CENTS = 1_000_000;     // $10,000 maximum

/**
 * Breakpoints - use these for consistency with CSS.
 * Note: Also exported from hooks/useResponsive.ts for use in hooks.
 */
export const BREAKPOINT_MOBILE = 640;
export const BREAKPOINT_TABLET = 1024;
