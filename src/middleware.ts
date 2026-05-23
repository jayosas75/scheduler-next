import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

const isProd = process.env.NODE_ENV === 'production';

export default auth((req) => {
    const { nextUrl } = req;
    const path = nextUrl.pathname;
    const isLoggedIn = !!req.auth?.user;

    const isProtected = path.startsWith('/calendar') || path.startsWith('/import');
    if (isProtected && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', nextUrl));
    }
    if (isLoggedIn && (path === '/login' || path === '/register')) {
        return NextResponse.redirect(new URL('/calendar', nextUrl));
    }

    // Dev needs 'unsafe-eval'/'unsafe-inline' + a websocket for Turbopack HMR,
    // so CSP is only applied in production.
    if (!isProd) {
        return NextResponse.next();
    }

    // A per-request nonce is required: the App Router emits inline scripts on
    // every render to stream the RSC payload, and their contents change each
    // time, so a static hash allowlist can never match them. Next.js reads this
    // nonce from the request's CSP header and applies it to the scripts it
    // generates; 'strict-dynamic' then lets those trusted scripts load chunks.
    const nonce = btoa(crypto.randomUUID());
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
    ].join('; ');

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('content-security-policy', csp);

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('content-security-policy', csp);
    return response;
});

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
