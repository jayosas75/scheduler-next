/**
 * Neutralizes user-supplied free text before it is stored.
 *
 * React already escapes text on render, so this is defense-in-depth: it strips
 * angle brackets (HTML/script injection) and control characters including
 * CR/LF, which also prevents iCal field injection on export.
 */
export function sanitizeText(value: string, maxLength = 500): string {
    return value
        .replace(/[<>]/g, "")
        .replace(/\p{Cc}/gu, "")
        .trim()
        .slice(0, maxLength);
}

/**
 * Escapes a value for safe inclusion in an iCal (RFC 5545) text field.
 */
export function escapeICalText(value: string): string {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r?\n/g, "\\n");
}
