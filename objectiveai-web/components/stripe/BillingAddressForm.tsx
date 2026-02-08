"use client";

import { useState, useEffect } from "react";
import { Elements, AddressElement } from "@stripe/react-stripe-js";
import { StripeAddressElementChangeEvent } from "@stripe/stripe-js";
import { useObjectiveAI } from "@/hooks/useObjectiveAI";
import { useStripeTheme } from "@/hooks/useStripeTheme";
import { useIsMobile } from "@/hooks/useIsMobile";
import { CustomerSession } from "@/lib/stripe-types";
import {
  stripePromise,
  customerSessionToBillingAddress,
  getStripeAppearance,
  withStripeRetry,
} from "@/lib/stripe";

interface BillingAddressFormProps {
  onClose: () => void;
}

/**
 * Form for updating billing address using Stripe's AddressElement.
 */
export function BillingAddressForm({ onClose }: BillingAddressFormProps) {
  const { getClient } = useObjectiveAI();
  const theme = useStripeTheme();
  const isMobile = useIsMobile();

  // Customer session from API
  const [customerSession, setCustomerSession] = useState<
    [CustomerSession, StripeAddressElementChangeEvent["value"]] | null | undefined
  >(undefined);

  // Current billing address
  const [billingAddress, setBillingAddress] =
    useState<StripeAddressElementChangeEvent["value"]>();

  // States
  const [ready, setReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch customer session on mount
  useEffect(() => {
    let cancelled = false;

    const fetchCustomerSession = async () => {
      try {
        setCustomerSession(undefined);
        setBillingAddress(undefined);
        setError(null);

        const client = await getClient();
        const session = await client.get_unary<CustomerSession | null>(
          "/stripe/customer"
        );

        if (cancelled) return;

        if (session) {
          const sessionBillingAddress = customerSessionToBillingAddress(session);
          setCustomerSession([session, sessionBillingAddress]);
          setBillingAddress(sessionBillingAddress);
        } else {
          setCustomerSession(null);
          setBillingAddress(undefined);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load billing address");
        setCustomerSession(null);
      }
    };

    fetchCustomerSession();

    return () => {
      cancelled = true;
    };
  }, [getClient]);

  // Submit new billing address
  const handleSubmit = async () => {
    if (billingAddress === undefined) return;

    setSubmitting(true);
    setError(null);

    try {
      const client = await getClient();

      await withStripeRetry(async () => {
        await client.post_unary("/stripe/customer", {
          name: billingAddress.name,
          address: billingAddress.address,
        });
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update billing address");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (customerSession === undefined) {
    return (
      <div
        className="card"
        style={{
          padding: isMobile ? "24px 20px" : "32px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
          Loading billing information...
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: isMobile ? "24px 20px" : "32px" }}>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        Billing Address
      </h3>

      {error && (
        <div
          style={{
            padding: "12px 16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            color: "var(--color-error)",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      <Elements
        stripe={stripePromise}
        options={{
          customerSessionClientSecret: customerSession?.[0]?.client_secret,
          appearance: getStripeAppearance(theme),
          mode: "setup",
          currency: "usd",
        }}
      >
        <AddressElement
          onChange={(e) => setBillingAddress(e.value)}
          options={{
            mode: "billing",
            defaultValues: customerSession?.[1] ? { ...customerSession[1] } : undefined,
          }}
          onReady={() => setReady(true)}
        />
      </Elements>

      {ready && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "24px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              background: "transparent",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!billingAddress || submitting}
            style={{
              flex: 1,
              padding: "12px 20px",
              fontSize: "14px",
              fontWeight: 600,
              background:
                billingAddress && !submitting ? "var(--accent)" : "var(--border)",
              color: billingAddress && !submitting ? "white" : "var(--text-muted)",
              border: "none",
              borderRadius: "8px",
              cursor: billingAddress && !submitting ? "pointer" : "not-allowed",
            }}
          >
            {submitting ? "Saving..." : "Save Address"}
          </button>
        </div>
      )}
    </div>
  );
}
