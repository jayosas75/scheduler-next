import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// sha256 of the inline theme script in src/app/layout.tsx. Must be regenerated
// if that script's contents change.
const THEME_SCRIPT_HASH = "sha256-Nm9+ZCeONz2z/SbVbXU7NwqunK3OrljnG3DKIa+82F4=";

// Strict CSP for production. Dev needs 'unsafe-eval'/'unsafe-inline' and a
// websocket for Turbopack HMR, so the policy is skipped in development.
const contentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' '${THEME_SCRIPT_HASH}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    ...(isProd
        ? [
            { key: "Content-Security-Policy", value: contentSecurityPolicy },
            { key: "Strict-Transport-Security", value: "max-age=31536000" },
        ]
        : []),
];

const nextConfig: NextConfig = {
    async headers() {
        return [{ source: "/:path*", headers: securityHeaders }];
    },
};

export default nextConfig;
