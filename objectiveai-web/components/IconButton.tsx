"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Visual variant */
  variant?: "default" | "ghost" | "danger";
  /** Icon content */
  children: React.ReactNode;
}

/**
 * Reusable icon button component with consistent styling.
 * Uses CSS classes from globals.css for hover states.
 *
 * @example
 * <IconButton onClick={handleClick} aria-label="Close">
 *   <CloseIcon />
 * </IconButton>
 *
 * <IconButton size="sm" variant="ghost">
 *   <SettingsIcon />
 * </IconButton>
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = "md", variant = "default", className = "", children, ...props }, ref) => {
    const sizeClass = size === "sm" ? "iconBtn--sm" : size === "lg" ? "iconBtn--lg" : "";
    const variantClass = variant === "ghost" ? "iconBtn--ghost" : variant === "danger" ? "iconBtn--danger" : "";

    return (
      <button
        ref={ref}
        className={`iconBtn ${sizeClass} ${variantClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default IconButton;
