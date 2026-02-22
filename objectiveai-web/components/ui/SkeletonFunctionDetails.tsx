"use client";

import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * Full-page skeleton for the function detail page.
 * Matches the layout of a loaded function page.
 */
export function SkeletonFunctionDetails() {
  const isMobile = useIsMobile();

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: isMobile ? "24px" : "32px" }}>
        {/* Breadcrumbs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <div className="skeleton" style={{ width: "70px", height: "20px", borderRadius: "4px" }} />
          <span style={{ color: "var(--text-muted)" }}>/</span>
          <div className="skeleton" style={{ width: "140px", height: "20px", borderRadius: "4px" }} />
        </div>
        {/* Title */}
        <div className="skeleton" style={{
          height: isMobile ? "28px" : "36px",
          width: "60%",
          marginBottom: "12px",
          borderRadius: "6px",
        }} />
        {/* Description */}
        <div className="skeleton" style={{ height: "16px", width: "90%", marginBottom: "6px", borderRadius: "4px" }} />
        <div className="skeleton" style={{ height: "16px", width: "70%", marginBottom: "24px", borderRadius: "4px" }} />
        {/* Tags row */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "32px" }}>
          <div className="skeleton" style={{ height: "24px", width: "80px", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "24px", width: "60px", borderRadius: "12px" }} />
          <div className="skeleton" style={{ height: "24px", width: "90px", borderRadius: "12px" }} />
        </div>
        {/* Input area */}
        <div className="skeleton" style={{
          height: "200px",
          width: "100%",
          borderRadius: "12px",
          marginBottom: "24px",
        }} />
        {/* Button */}
        <div className="skeleton" style={{
          height: "44px",
          width: isMobile ? "100%" : "200px",
          borderRadius: "8px",
        }} />
      </div>
    </div>
  );
}
