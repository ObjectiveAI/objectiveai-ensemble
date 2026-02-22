"use client";

/**
 * Skeleton loading placeholder for function cards on the browse page.
 * Matches the dimensions of a rendered function card.
 */
export function SkeletonCard() {
  return (
    <div className="card" style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "16px",
    }}>
      {/* Category tag */}
      <div className="skeleton" style={{
        alignSelf: "flex-start",
        marginBottom: "8px",
        height: "22px",
        width: "60px",
        borderRadius: "4px",
      }} />
      {/* Title */}
      <div className="skeleton" style={{
        height: "20px",
        width: "80%",
        marginBottom: "12px",
        borderRadius: "4px",
      }} />
      {/* Description lines */}
      <div style={{ flex: 1, marginBottom: "12px" }}>
        <div className="skeleton" style={{ height: "14px", width: "100%", marginBottom: "6px", borderRadius: "4px" }} />
        <div className="skeleton" style={{ height: "14px", width: "90%", marginBottom: "6px", borderRadius: "4px" }} />
        <div className="skeleton" style={{ height: "14px", width: "60%", borderRadius: "4px" }} />
      </div>
      {/* Tags */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "14px" }}>
        <div className="skeleton" style={{ height: "18px", width: "50px", borderRadius: "10px" }} />
        <div className="skeleton" style={{ height: "18px", width: "70px", borderRadius: "10px" }} />
      </div>
      {/* Open link */}
      <div className="skeleton" style={{ height: "16px", width: "60px", borderRadius: "4px" }} />
    </div>
  );
}
