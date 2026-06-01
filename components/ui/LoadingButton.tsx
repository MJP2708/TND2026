"use client";

import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export function LoadingButton({
  loading = false,
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled,
  className = "",
  style,
  ...props
}: LoadingButtonProps) {
  const variantClass = {
    primary:   "fv-btn fv-btn-primary",
    secondary: "fv-btn fv-btn-secondary",
    ghost:     "fv-btn fv-btn-ghost",
    danger:    "fv-btn",
  }[variant];

  const sizeClass = size === "sm" ? "fv-btn-sm" : size === "lg" ? "fv-btn-lg" : "";
  const dangerStyle = variant === "danger"
    ? { background: "#FFF5F5", color: "#D94040", border: "1.5px solid #FFCCD5" }
    : {};

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${variantClass} ${sizeClass} ${fullWidth ? "fv-btn-full" : ""} ${className}`.trim()}
      style={{ ...dangerStyle, ...style }}
    >
      {loading ? (
        <>
          <Loader2 size={size === "sm" ? 13 : 16} style={{ animation: "spin 1s linear infinite" }} />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  );
}
