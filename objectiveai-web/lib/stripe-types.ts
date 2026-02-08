/**
 * Stripe-related types for the payment integration.
 */

export interface PaymentIntentPreview {
  credits_amount_cents: number;
  fee_amount_cents: number;
  subtotal_amount_cents: number;
}

export interface PaymentIntent extends PaymentIntentPreview {
  client_secret: string;
  tax_amount_cents: number;
  total_amount_cents: number;
}

export interface CustomerSession {
  client_secret: string;
  customer: {
    id: string;
    name: string | null;
    address: {
      city: string | null;
      country: string | null;
      line1: string | null;
      line2: string | null;
      postal_code: string | null;
      state: string | null;
    } | null;
  };
}

export interface BillingAddress {
  name: string;
  address: {
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
}
