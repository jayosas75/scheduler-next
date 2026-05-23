import { handlers } from "@/auth";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const { GET } = handlers;

export async function POST(req: NextRequest) {
    // Throttle credential login attempts to slow brute-force; other auth POSTs
    // (signout, csrf, etc.) pass straight through to NextAuth.
    if (new URL(req.url).pathname.includes("/callback/credentials")) {
        const ip = getClientIp(req);
        const { allowed, retryAfter } = rateLimit(`login:${ip}`, 10, 5 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json(
                { message: "Too many login attempts. Please try again later." },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }
    }
    return handlers.POST(req);
}
