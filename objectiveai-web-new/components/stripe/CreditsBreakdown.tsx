"use client";

import { useMemo } from "react";
import { PaymentIntentPreview, PaymentIntent } from "@/lib/stripe-types";
import { formatCurrency } from "@/lib/stripe";

interface CreditsBreakdownProps {
  paymentIntentPreview?: PaymentIntentPreview | null;
  paymentIntent?: PaymentIntent | null;
  confirmingOrConfirmed?: boolean;
}

/**
 * Displays the payment breakdown (credits, fees, subtotal/tax/total).
 */
export function CreditsBreakdown({
  paymentIntentPreview,
  paymentIntent,
  confirmingOrConfirmed,
}: CreditsBreakdownProps) {
  const breakdown = useMemo(() => {
    const credits = paymentIntent
      ? paymentIntent.credits_amount_cents
      : paymentIntentPreview
      ? paymentIntentPreview.credits_amount_cents
      : undefined;

    const fee = paymentIntent
      ? paymentIntent.fee_amount_cents
      : paymentIntentPreview
      ? paymentIntentPreview.fee_amount_cents
      : undefined;

    const subtotal = paymentIntent
      ? paymentIntent.subtotal_amount_cents
      : paymentIntentPreview
      ? paymentIntentPreview.subtotal_amount_cents
      : undefined;

    const tax = paymentIntent ? paymentIntent.tax_amount_cents : undefined;
    const total = paymentIntent ? paymentIntent.total_amount_cents : undefined;

    return {
      credits: credits !== undefined ? formatCurrency(credits) : undefined,
      creditsZero: credits === 0,
      fee: fee !== undefined ? formatCurrency(fee) : undefined,
      feeZero: fee === 0,
      subtotal: subtotal !== undefined ? formatCurrency(subtotal) : undefined,
      subtotalZero: subtotal === 0,
      tax: tax !== undefined ? formatCurrency(tax) : undefined,
      taxZero: tax === 0,
      total: total !== undefined ? formatCurrency(total) : undefined,
      totalZero: total === 0,
    };
  }, [paymentIntent, paymentIntentPreview]);

  const LoadingDots = () => (
    <span style={{ color: "var(--text-muted)" }}>...</span>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {/* Credits */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: breakdown.creditsZero ? "var(--text-muted)" : "var(--text)",
        }}
      >
        <span style={{ fontSize: "14px" }}>Credits</span>
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
          {breakdown.credits ?? <LoadingDots />}
        </span>
      </div>

      {/* Service fees */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: breakdown.feeZero ? "var(--text-muted)" : "var(--text)",
        }}
      >
        <span style={{ fontSize: "14px" }}>Service fees</span>
        <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
          {breakdown.fee ?? <LoadingDots />}
        </span>
      </div>

      {/* Subtotal (only shown before confirm) */}
      {!confirmingOrConfirmed && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: breakdown.subtotalZero ? "var(--text-muted)" : "var(--text)",
            borderTop: "1px solid var(--border)",
            paddingTop: "8px",
            marginTop: "4px",
          }}
        >
          <span style={{ fontSize: "14px", fontWeight: 600 }}>Subtotal</span>
          <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
            {breakdown.subtotal ?? <LoadingDots />}
          </span>
        </div>
      )}

      {/* Tax and Total (only shown after confirm) */}
      {confirmingOrConfirmed && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: breakdown.taxZero ? "var(--text-muted)" : "var(--text)",
            }}
          >
            <span style={{ fontSize: "14px" }}>Sales taxes</span>
            <span style={{ fontFamily: "monospace", fontWeight: 500 }}>
              {breakdown.tax ?? <LoadingDots />}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: breakdown.totalZero ? "var(--text-muted)" : "var(--text)",
              borderTop: "1px solid var(--border)",
              paddingTop: "8px",
              marginTop: "4px",
            }}
          >
            <span style={{ fontSize: "14px", fontWeight: 600 }}>Total</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
              {breakdown.total ?? <LoadingDots />}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
