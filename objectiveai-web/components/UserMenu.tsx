"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import LoginModal from "./LoginModal";

type UserMenuProps = {
  isMobile?: boolean;
  /** When true, forces the user dropdown closed (e.g. mobile nav opened) */
  forceClose?: boolean;
  /** Called when the user dropdown opens, so parent can close other menus */
  onOpen?: () => void;
};

export default function UserMenu({ isMobile = false, forceClose = false, onOpen }: UserMenuProps) {
  const { user, isLoading, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when parent forces it (e.g. mobile nav opened)
  // React 19: derive state from props during render instead of useEffect
  if (forceClose && isOpen) {
    setIsOpen(false);
  }

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menu on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  // Get initials from name or email
  const getInitials = () => {
    if (!user) return null;
    if (user.name) {
      const parts = user.name.split(" ");
      return parts.length > 1
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div
        style={{
          width: isMobile ? "36px" : "40px",
          height: isMobile ? "36px" : "40px",
          background: "var(--border)",
          borderRadius: "50%",
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    );
  }

  return (
    <>
      <div ref={menuRef} style={{ position: "relative" }}>
        {/* Avatar / Sign In Button */}
        <button
          onClick={() => {
            if (user) {
              const opening = !isOpen;
              setIsOpen(opening);
              if (opening) onOpen?.();
            } else {
              setShowLoginModal(true);
            }
          }}
          style={{
            width: isMobile ? "36px" : "40px",
            height: isMobile ? "36px" : "40px",
            background: user ? "var(--accent)" : "var(--card-bg)",
            border: user ? "none" : "1px solid var(--border)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s",
            padding: 0,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (!user) {
              e.currentTarget.style.borderColor = "var(--accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (!user) {
              e.currentTarget.style.borderColor = "var(--border)";
            }
          }}
          aria-label={user ? "Open user menu" : "Sign in"}
        >
          {user ? (
            user.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name || "User avatar"}
                fill
                unoptimized
                sizes="40px"
                style={{ objectFit: "cover" }}
              />
            ) : (
              <span
                style={{
                  color: "var(--color-light)",
                  fontSize: isMobile ? "13px" : "14px",
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {getInitials()}
              </span>
            )
          ) : (
            <svg
              width={isMobile ? "18" : "20"}
              height={isMobile ? "18" : "20"}
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </button>

        {/* Dropdown Menu (only for logged-in users) */}
        {user && isOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: isMobile ? "160px" : "200px",
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              boxShadow: "0 4px 20px var(--shadow)",
              padding: "8px",
              zIndex: 1050,
            }}
          >
            {/* User Info */}
            <div
              style={{
                padding: "12px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "2px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name || "User"}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>

            {/* Menu Items */}
            <MenuItem
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              }
              label="Credits"
              onClick={() => {
                setIsOpen(false);
                router.push('/account/credits');
              }}
            />
            <MenuItem
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
              }
              label="API Keys"
              onClick={() => {
                setIsOpen(false);
                router.push('/account/keys');
              }}
            />

            <MenuItem
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              }
              label="Sign out"
              onClick={handleSignOut}
            />
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </>
  );
}

// Menu Item Component
function MenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: "14px",
        fontWeight: 500,
        color: "var(--text)",
        background: "transparent",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        transition: "background 0.15s",
        fontFamily: "inherit",
        textAlign: "left",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "var(--border)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <span style={{ color: "var(--text-muted)", display: "flex" }}>{icon}</span>
      {label}
    </button>
  );
}
