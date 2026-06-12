
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sanitizeText } from "@/lib/sanitize";
import { passwordSchema } from "@/lib/password-policy";
import { sendAccountExists } from "@/lib/email";

const registerSchema = z.object({
    email: z.string().email(),
    password: passwordSchema,
    name: z.string().min(2).transform((v) => sanitizeText(v, 100)),
});

// Identical response whether or not the address was already registered, so the
// endpoint can't be used to enumerate accounts. The register form only keys off
// res.ok (it redirects to sign-in), so this text is never shown to the user.
const NEUTRAL_SUCCESS = { message: "Account ready. Please sign in to continue." };

export async function POST(req: Request) {
    try {
        const ip = getClientIp(req);
        const { allowed, retryAfter } = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
        if (!allowed) {
            return NextResponse.json(
                { message: "Too many accounts created. Please try again later." },
                { status: 429, headers: { "Retry-After": String(retryAfter) } }
            );
        }

        const body = await req.json();
        const { email, password, name } = registerSchema.parse(body);

        // Hash regardless of whether the account exists. bcrypt dominates the
        // request time, so doing it on both branches keeps them indistinguishable
        // — otherwise "new email = slow, existing email = fast" leaks existence.
        const hashedPassword = await bcrypt.hash(password, 10);

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Don't reveal the collision and don't create a duplicate. Nudge the
            // real inbox owner instead; the caller gets the same neutral success
            // an actual signup would return.
            const base = process.env.AUTH_URL ?? new URL(req.url).origin;
            await sendAccountExists(email, `${base}/login`, `${base}/forgot-password`);
        } else {
            await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name,
                },
            });
        }

        return NextResponse.json(NEUTRAL_SUCCESS, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: "Invalid input", errors: error.issues }, { status: 400 });
        }
        console.error("Registration Error:", error);
        return NextResponse.json(
            { message: "Something went wrong" },
            { status: 500 }
        );
    }
}
