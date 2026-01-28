"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleIcon, GitHubIcon, XIcon, RedditIcon } from "./SocialIcons";

type LoginModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Provider = "google" | "github" | "reddit" | "x";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { signInWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [hoveredProvider, setHoveredProvider] = useState<Provider | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const handleSignIn = async (provider: Provider) => {
    // TODO: Connect to actual auth providers
    if (provider === "google") {
      await signInWithGoogle();
    }
    onClose();
  };

  const providers: { id: Provider; name: string; icon: React.ReactNode }[] = [
    { id: "google", name: "Google", icon: <GoogleIcon /> },
    { id: "github", name: "GitHub", icon: <GitHubIcon /> },
    { id: "x", name: "X", icon: <XIcon /> },
    { id: "reddit", name: "Reddit", icon: <RedditIcon /> },
  ];

  const modal = (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      {/* Modal Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--card-bg)",
          borderRadius: "24px",
          border: "1px solid var(--border)",
          padding: "40px 36px 32px",
          width: "100%",
          maxWidth: "400px",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.2)",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          {/* Logo */}
          <svg
            width="44"
            height="28"
            viewBox="0 0 180 120.85"
            fill="var(--text)"
            style={{ marginBottom: "24px" }}
          >
            <path d="M3.01,67.4H0v-13.94h3.01c6.02,0,10.94-4.92,10.94-10.94v-17.64C13.94,11.21,25.15,0,38.82,0h7.66v13.94h-7.66c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,6.97-3.01,13.4-7.66,17.91,4.65,4.51,7.66,10.94,7.66,17.91v17.64c0,6.01,4.92,10.94,10.94,10.94h7.66v13.94h-7.66c-13.67,0-24.88-11.21-24.88-24.88v-17.64c0-6.02-4.92-10.94-10.94-10.94Z" />
            <path d="M159.77,60.42c-4.65-4.51-7.66-10.94-7.66-17.91v-17.64c0-6.02-4.92-10.94-10.94-10.94h-7.66V0h7.66c13.67,0,24.88,11.21,24.88,24.88v17.64c0,6.02,4.92,10.94,10.94,10.94h3.01v13.94h-3.01c-6.02,0-10.94,4.92-10.94,10.94v17.64c0,13.67-11.21,24.88-24.88,24.88h-7.66v-13.94h7.66c6.02,0,10.94-4.92,10.94-10.94v-17.64c0-6.97,3.01-13.4,7.66-17.91Z" />
            <path d="M51.38,53.6c.42-.49,1.29-1.22,2.59-2.17,1.3-.95,2.96-1.9,4.97-2.86,2.01-.95,4.36-1.78,7.04-2.49,2.68-.7,5.61-1.06,8.78-1.06s6.37.37,9.37,1.11c3,.74,5.66,1.96,7.99,3.65,2.33,1.69,4.18,3.91,5.56,6.67s2.06,6.14,2.06,10.16v31.43h-14.82l-1.27-6.03c-1.62,2.26-3.67,4.01-6.14,5.24-2.47,1.23-5.54,1.85-9.21,1.85-2.82,0-5.31-.41-7.46-1.22-2.15-.81-3.95-1.92-5.4-3.33-1.45-1.41-2.54-3.07-3.28-4.97-.74-1.91-1.11-3.95-1.11-6.14s.48-4.41,1.43-6.46c.95-2.04,2.47-3.83,4.55-5.34,2.08-1.52,4.78-2.73,8.1-3.65,3.32-.92,7.34-1.38,12.06-1.38h6.14v-.42c0-2.12-.76-3.77-2.28-4.98-1.52-1.2-4-1.8-7.46-1.8-1.55,0-3.05.21-4.5.64-1.45.42-2.75.92-3.92,1.48-1.16.57-2.17,1.15-3.02,1.75-.85.6-1.45,1.08-1.8,1.43l-8.99-11.11ZM83.34,75.82h-5.5c-3.53,0-5.96.65-7.3,1.96-1.34,1.31-2.01,2.77-2.01,4.39,0,1.2.46,2.33,1.38,3.39.92,1.06,2.4,1.59,4.45,1.59.85,0,1.8-.21,2.86-.63,1.06-.42,2.03-1.06,2.91-1.91.88-.85,1.64-1.92,2.28-3.23.63-1.3.95-2.8.95-4.5v-1.06Z" />
            <path d="M106.94,32.22c0-1.55.28-3,.85-4.34.56-1.34,1.32-2.5,2.28-3.49.95-.99,2.08-1.76,3.39-2.33,1.3-.56,2.7-.85,4.18-.85s2.87.28,4.18.85c1.3.57,2.47,1.34,3.49,2.33,1.02.99,1.82,2.15,2.38,3.49.56,1.34.85,2.79.85,4.34s-.28,2.91-.85,4.29c-.57,1.38-1.36,2.56-2.38,3.54-1.02.99-2.19,1.78-3.49,2.38-1.31.6-2.7.9-4.18.9s-2.88-.3-4.18-.9c-1.31-.6-2.43-1.39-3.39-2.38-.95-.99-1.71-2.17-2.28-3.54-.57-1.38-.85-2.8-.85-4.29ZM108.95,46.19h17.46v51.86h-17.46v-51.86Z" />
          </svg>
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginBottom: "8px" }}>
            Sign in
          </h2>
          <p style={{ fontSize: "15px", color: "var(--text-muted)" }}>
            Choose your preferred method
          </p>
        </div>

        {/* Provider Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {providers.map((provider) => {
            const isHovered = hoveredProvider === provider.id;
            return (
              <button
                key={provider.id}
                onClick={() => handleSignIn(provider.id)}
                onMouseEnter={() => setHoveredProvider(provider.id)}
                onMouseLeave={() => setHoveredProvider(null)}
                style={{
                  width: "100%",
                  padding: "14px 20px",
                  fontSize: "15px",
                  fontWeight: 500,
                  color: isHovered ? "var(--accent)" : "var(--text)",
                  background: isHovered
                    ? "rgba(107, 92, 255, 0.05)"
                    : "var(--page-bg)",
                  border: `1px solid ${isHovered ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "50px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  transition: "all 0.15s ease",
                  fontFamily: "inherit",
                }}
              >
                <span style={{
                  display: "flex",
                  color: isHovered && provider.id !== "google" ? "var(--accent)" : undefined
                }}>
                  {provider.icon}
                </span>
                Continue with {provider.name}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            margin: "24px 0",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* Email option placeholder */}
        <button
          style={{
            width: "100%",
            padding: "14px 20px",
            fontSize: "15px",
            fontWeight: 500,
            color: "var(--color-light)",
            background: "var(--accent)",
            border: "none",
            borderRadius: "50px",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "0.9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
        >
          Continue with Email
        </button>

        {/* Terms */}
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            textAlign: "center",
            marginTop: "24px",
            lineHeight: 1.6,
          }}
        >
          By continuing, you agree to our{" "}
          <a href="/legal/terms" style={{ color: "var(--accent)", textDecoration: "none" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/legal/privacy" style={{ color: "var(--accent)", textDecoration: "none" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
