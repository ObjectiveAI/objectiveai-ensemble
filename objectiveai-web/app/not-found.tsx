import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <div
        className="container"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "var(--accent)",
            marginBottom: "8px",
            lineHeight: 1,
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 600,
            marginBottom: "12px",
          }}
        >
          Page not found
        </h2>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "15px",
            maxWidth: "400px",
            marginBottom: "32px",
          }}
        >
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="pillBtn"
          style={{
            padding: "12px 28px",
            fontSize: "14px",
            fontWeight: 600,
            background: "var(--accent)",
            color: "var(--color-light)",
            textDecoration: "none",
          }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
