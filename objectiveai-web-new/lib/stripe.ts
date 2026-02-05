import { loadStripe } from "@stripe/stripe-js";
import { StripeAddressElementChangeEvent, Appearance } from "@stripe/stripe-js";
import { ObjectiveAIFetchError } from "objectiveai";
import { CustomerSession, BillingAddress } from "./stripe-types";
import { STRIPE_TAX_PROPAGATION_DELAY_MS } from "./constants";

// Load Stripe instance (cached)
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (typeof window !== "undefined" && !stripePublishableKey) {
  console.warn("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not defined");
}

export const stripePromise = stripePublishableKey
  ? loadStripe(stripePublishableKey)
  : Promise.resolve(null);

/**
 * Convert CustomerSession to AddressElement default values
 */
export function customerSessionToBillingAddress(
  { customer: { name, address } }: CustomerSession
): StripeAddressElementChangeEvent["value"] {
  return {
    name: name ?? "",
    address: {
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? null,
      city: address?.city ?? "",
      state: address?.state ?? "",
      postal_code: address?.postal_code ?? "",
      country: address?.country ?? "",
    },
  };
}

/**
 * Convert AddressElement value to API billing address format
 */
export function addressElementToBillingAddress(
  value: StripeAddressElementChangeEvent["value"]
): BillingAddress {
  return {
    name: value.name,
    address: {
      line1: value.address.line1,
      line2: value.address.line2,
      city: value.address.city,
      state: value.address.state,
      postal_code: value.address.postal_code,
      country: value.address.country,
    },
  };
}

/**
 * Get Stripe appearance based on theme
 */
export function getStripeAppearance(theme: "light" | "dark"): Appearance {
  return {
    theme: theme === "light" ? "stripe" : "night",
    variables: {
      colorPrimary: "#6B5CFF", // Match ObjectiveAI accent
      borderRadius: "12px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Retry wrapper for Stripe API calls that may need time for tax propagation.
 * Handles 429 rate limit errors by waiting 10 seconds and retrying once.
 */
export async function withStripeRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (
        error instanceof ObjectiveAIFetchError &&
        error.code === 429 &&
        attempt < maxRetries
      ) {
        attempt += 1;
        await new Promise((resolve) =>
          setTimeout(resolve, STRIPE_TAX_PROPAGATION_DELAY_MS)
        );
      } else {
        throw error;
      }
    }
  }
}
