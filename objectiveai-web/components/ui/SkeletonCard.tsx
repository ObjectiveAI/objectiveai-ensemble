"use client";

import React from "react";

/**
 * A skeletal loading placeholder for Function cards on the browse page.
 * Uses the .skeletonPulse CSS animation defined in globals.css.
 */
export function SkeletonCard() {
    return (
        <div
            className="card"
            style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                padding: "16px",
            }}
        >
            {/* Category Tag Skeleton */}
            <div
                className="skeletonPulse"
                style={{
                    alignSelf: "flex-start",
                    marginBottom: "8px",
                    height: "22px",
                    width: "60px",
                    borderRadius: "4px",
                }}
            />

            {/* Title Skeleton */}
            <div
                className="skeletonPulse"
                style={{
                    height: "20px",
                    width: "80%",
                    marginBottom: "12px",
                    borderRadius: "4px",
                }}
            />

            {/* Description Lines Skeleton */}
            <div style={{ flex: 1, marginBottom: "12px" }}>
                <div
                    className="skeletonPulse"
                    style={{
                        height: "14px",
                        width: "100%",
                        marginBottom: "6px",
                        borderRadius: "4px",
                    }}
                />
                <div
                    className="skeletonPulse"
                    style={{
                        height: "14px",
                        width: "90%",
                        marginBottom: "6px",
                        borderRadius: "4px",
                    }}
                />
                <div
                    className="skeletonPulse"
                    style={{
                        height: "14px",
                        width: "60%",
                        borderRadius: "4px",
                    }}
                />
            </div>

            {/* Tags Row Skeleton */}
            <div
                style={{
                    display: "flex",
                    gap: "4px",
                    marginBottom: "14px",
                }}
            >
                <div
                    className="skeletonPulse"
                    style={{
                        height: "18px",
                        width: "50px",
                        borderRadius: "10px",
                    }}
                />
                <div
                    className="skeletonPulse"
                    style={{
                        height: "18px",
                        width: "70px",
                        borderRadius: "10px",
                    }}
                />
            </div>

            {/* Open Link Skeleton */}
            <div
                className="skeletonPulse"
                style={{
                    height: "16px",
                    width: "60px",
                    borderRadius: "4px",
                }}
            />
        </div>
    );
}

export default SkeletonCard;
