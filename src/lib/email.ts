// Email delivery abstraction. Two modes:
//
//   - Dev / no provider: log the link to the server console. The reset flow
//     still works end-to-end locally; you copy the URL out of `npm run dev`.
//   - Prod: post to Resend's REST API when RESEND_API_KEY is set. Resend has
//     a small free tier and no SDK is required for the JSON endpoint.
//
// The route handlers should NEVER await this call's outcome from the user's
// perspective — failures here must not leak whether an account exists or not.
// We swallow + log errors and let the route return its neutral 200 anyway.

type SendArgs = {
    to: string;
    subject: string;
    html: string;
    text: string;
};

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

async function send({ to, subject, html, text }: SendArgs): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? 'Scheduler 2026 <onboarding@resend.dev>';

    if (!apiKey) {
        // Dev fallback. Loud so the link is easy to spot in the dev server logs.
        console.log('\n📧 [DEV EMAIL — no RESEND_API_KEY set]');
        console.log(`   To:      ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body:    ${text}\n`);
        return;
    }

    try {
        const res = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ from, to, subject, html, text }),
        });
        if (!res.ok) {
            const body = await res.text();
            console.error(`[email] Resend rejected the request (${res.status}): ${body}`);
        }
    } catch (err) {
        // Network blip; logged but not surfaced — the caller's neutral response
        // is more important than telling the client we couldn't deliver.
        console.error('[email] Resend send failed:', err);
    }
}

export async function sendPasswordReset(toEmail: string, resetUrl: string): Promise<void> {
    const subject = 'Reset your Scheduler 2026 password';
    const text =
        `Someone (hopefully you) asked to reset the password for this account.\n\n` +
        `Use this link within the next hour:\n${resetUrl}\n\n` +
        `If you didn't request this, you can ignore this email — your password won't change.`;
    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #0f172a;">
  <h2 style="margin: 0 0 16px; font-size: 18px;">Reset your Scheduler 2026 password</h2>
  <p style="margin: 0 0 16px; line-height: 1.5;">Someone (hopefully you) asked to reset the password for this account. Use the link below within the next hour:</p>
  <p style="margin: 0 0 24px;"><a href="${resetUrl}" style="display: inline-block; padding: 10px 18px; background: #0ea5e9; color: white; border-radius: 6px; text-decoration: none; font-weight: 600;">Choose a new password</a></p>
  <p style="margin: 0 0 8px; line-height: 1.5; font-size: 13px; color: #475569;">Or paste this URL into your browser:</p>
  <p style="margin: 0 0 24px; line-height: 1.5; font-size: 13px; word-break: break-all;"><a href="${resetUrl}" style="color: #0ea5e9;">${resetUrl}</a></p>
  <p style="margin: 0; line-height: 1.5; font-size: 13px; color: #475569;">If you didn't request this, you can ignore this email — your password won't change.</p>
</div>
`.trim();

    await send({ to: toEmail, subject, html, text });
}
