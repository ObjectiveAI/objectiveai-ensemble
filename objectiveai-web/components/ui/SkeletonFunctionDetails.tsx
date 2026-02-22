"use client";

import React from "react";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * A beautiful, full-page skeletal loading placeholder for the 
 * Single Function Details page (functions/[owner]/[repo]).
 * Uses the .skeletonPulse CSS animation defined in globals.css.
 */
export function SkeletonFunctionDetails() {
    const isMobile = useIsMobile();

    return (
        <div className="page">
            <div className="container">
                {/* Breadcrumb Row with Pin Skeleton */}
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "20px",
                    }}
                >
                    {/* Breadcrumbs */}
                    <div style={{ display: "flex", gap: "8px" }}>
                        <div className="skeletonPulse" style={{ width: "70px", height: "20px", borderRadius: "4px" }} />
                        <span style={{ color: "var(--text-muted)" }}>/</span>
                        <div className="skeletonPulse" style={{ width: "140px", height: "20px", borderRadius: "4px" }} />
                    </div>
                    {/* Pin Button */}
                    <div className="skeletonPulse" style={{ width: "90px", height: "20px", borderRadius: "4px" }} />
                </div>

                {/* Header Skeleton */}
                <div style={{ marginBottom: isMobile ? "20px" : "28px" }}>
                    {/* Title */}
                    <div
                        className="skeletonPulse"
                        style={{ width: "60%", height: isMobile ? "32px" : "40px", borderRadius: "6px", marginBottom: "16px" }}
                    />
                    {/* Description lines */}
                    <div className="skeletonPulse" style={{ width: "80%", height: "18px", borderRadius: "4px", marginBottom: "8px" }} />
                    <div className="skeletonPulse" style={{ width: "75%", height: "18px", borderRadius: "4px", marginBottom: "16px" }} />

                    {/* Tags */}
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <div className="skeletonPulse" style={{ width: "80px", height: "24px", borderRadius: "12px" }} />
                        <div className="skeletonPulse" style={{ width: "150px", height: "24px", borderRadius: "12px" }} />
                    </div>
                </div>

                {/* Main Layout Grid */}
                <div
                    style={{
                        display: isMobile ? "flex" : "grid",
                        flexDirection: "column",
                        gridTemplateColumns: "1fr 1fr",
                        gap: isMobile ? "16px" : "32px",
                        alignItems: isMobile ? "stretch" : "start",
                        maxWidth: "900px",
                    }}
                >
                    {/* Left - Input Card Skeleton */}
                    <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
                        <h3
                            style={{
                                fontSize: isMobile ? "11px" : "12px",
                                fontWeight: 600,
                                marginBottom: isMobile ? "16px" : "24px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "var(--text-muted)",
                            }}
                        >
                            Input
                        </h3>

                        {/* Simulated general input fields */}
                        <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "24px" }}>
                            <div>
                                <div className="skeletonPulse" style={{ width: "40px", height: "14px", borderRadius: "4px", marginBottom: "8px" }} />
                                <div className="skeletonPulse" style={{ width: "100%", height: "120px", borderRadius: "8px" }} />
                                <div className="skeletonPulse" style={{ width: "160px", height: "12px", borderRadius: "4px", marginTop: "8px" }} />
                            </div>

                            {/* Toggles / Reasoning / Demo mode skeletons */}
                            <div className="skeletonPulse" style={{ width: "100%", height: "70px", borderRadius: "8px" }} />
                            <div className="skeletonPulse" style={{ width: "100%", height: "70px", borderRadius: "8px" }} />
                        </div>

                        {/* Execute Button Skeleton */}
                        <div
                            className="skeletonPulse"
                            style={{
                                width: "100%",
                                height: isMobile ? "44px" : "48px",
                                borderRadius: "24px",
                                marginTop: isMobile ? "20px" : "32px",
                            }}
                        />
                    </div>

                    {/* Right - Results Card Skeleton */}
                    <div className="card" style={{ padding: isMobile ? "16px" : undefined }}>
                        <h3
                            style={{
                                fontSize: isMobile ? "11px" : "12px",
                                fontWeight: 600,
                                marginBottom: isMobile ? "16px" : "24px",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                color: "var(--text-muted)",
                            }}
                        >
                            Output
                        </h3>

                        <div
                            style={{
                                textAlign: "center",
                                padding: isMobile ? "40px 16px" : "60px 20px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* Central Dash / Placeholder text */}
                            <div className="skeletonPulse" style={{ width: "24px", height: "4px", borderRadius: "2px", marginBottom: "16px" }} />
                            <div className="skeletonPulse" style={{ width: "220px", height: "16px", borderRadius: "4px" }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SkeletonFunctionDetails;
