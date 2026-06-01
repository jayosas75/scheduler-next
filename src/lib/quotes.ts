// Local, CSP-safe inspiration list for the daily "transmission" bar — no
// external API, no network. A mix of attributed wisdom and in-universe
// netrunner flavor (left unattributed so it reads as a system broadcast).
// Keep lines short so they fit the slim bar on mobile.

export interface Quote {
    text: string;
    author?: string;
}

export const QUOTES: Quote[] = [
    // --- Attributed ---
    { text: 'The future belongs to those who prepare for it today.', author: 'Malcolm X' },
    { text: 'It always seems impossible until it’s done.', author: 'Nelson Mandela' },
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'We are what we repeatedly do. Excellence is a habit, not an act.', author: 'Will Durant' },
    { text: 'Either you run the day, or the day runs you.', author: 'Jim Rohn' },
    { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
    { text: 'A year from now you may wish you had started today.', author: 'Karen Lamb' },
    { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
    { text: 'Small daily improvements over time lead to stunning results.', author: 'Robin Sharma' },
    { text: 'Take care of your body. It’s the only place you have to live.', author: 'Jim Rohn' },
    { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
    { text: 'Time is the most valuable thing you can spend.', author: 'Theophrastus' },

    // --- System transmissions (in-universe flavor) ---
    { text: 'Defrag your day before it fragments you.' },
    { text: 'Every subroutine you complete upgrades the operator.' },
    { text: 'Rest is not downtime — it’s a system recovery cycle.' },
    { text: 'Guard your bandwidth. Not every ping deserves a reply.' },
    { text: 'Compile small habits; they ship the legendary build.' },
    { text: 'The grid rewards consistency over intensity.' },
    { text: 'Hydrate the meatframe. The neural link runs on water.' },
    { text: 'A cluttered schedule is a corrupted save file.' },
    { text: 'Connection is the highest-priority packet. Reach someone today.' },
    { text: 'Ship the day, not the perfect day.' },
    { text: 'Protect the morning block; it sets the clock speed for all of it.' },
    { text: 'Close the open loops. Idle processes drain the core.' },
];

// Deterministic index from a calendar day, so the "quote of the day" is stable
// for the whole day and rotates predictably. Falls back safely for any length.
export function getDayIndex(date: Date, length: number): number {
    if (length <= 0) return 0;
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000);
    return ((dayOfYear % length) + length) % length;
}

// Convenience: today's (or any day's) quote.
export function getQuoteForDay(date: Date): Quote {
    return QUOTES[getDayIndex(date, QUOTES.length)];
}
