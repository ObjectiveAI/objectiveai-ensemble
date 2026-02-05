/**
 * Timing constants for UI interactions
 * Centralizes magic numbers for timeouts and delays
 */

// Feedback durations - how long to show success states
export const COPY_FEEDBACK_DURATION_MS = 2000;
export const EMAIL_SENT_FEEDBACK_DURATION_MS = 2000;

// Animation durations
export const PINNED_COLOR_ANIMATION_MS = 1000;

// Layout timing - delays for DOM calculations
export const NAV_HEIGHT_CALCULATION_DELAY_MS = 100;

// Input behavior
export const DROPDOWN_BLUR_DELAY_MS = 150;
export const WASM_VALIDATION_DEBOUNCE_MS = 300;

// Stripe payment timing
export const STRIPE_TAX_PROPAGATION_DELAY_MS = 10000;  // 10 seconds for tax calculation
export const STRIPE_MIN_CREDITS_CENTS = 500;           // $5 minimum
export const STRIPE_MAX_CREDITS_CENTS = 1_000_000;     // $10,000 maximum
