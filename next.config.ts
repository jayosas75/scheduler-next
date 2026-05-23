import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// NOTE: Content-Security-Policy is set per-request in src/middleware.ts because
// it needs a fresh nonce on every render. Don't add a CSP header here too — a
// duplicate header would conflict with the nonce'd policy.
const securityHeaders = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
    ...(isProd
        ? [
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
