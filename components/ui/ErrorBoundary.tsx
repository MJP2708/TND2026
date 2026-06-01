"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          margin: "16px",
          padding: "16px",
          background: "#FFF5F5",
          border: "1px solid #FFCCD5",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "0.88rem", color: "#D94040" }}>
            Something went wrong
          </p>
          <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#6B7A99" }}>
            {this.props.name ? `${this.props.name} failed to load.` : "This section failed to load."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "#D94040",
              color: "white",
              border: "none",
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
