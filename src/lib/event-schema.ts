import { z } from "zod";
import { sanitizeText } from "@/lib/sanitize";

// Validation for the /api/events endpoints. Kept separate from the route so it
// can be unit-tested without pulling in Prisma/NextAuth.
//
// description/location/details map to nullable columns and the client sends
// `null` to clear them, so they're `nullish()` (string | null | undefined) and
// only sanitize real strings. (A previous `optional()` rejected null, which made
// saving an event with an empty Details field fail with a 400.)
export const eventSchema = z.object({
    title: z.string().min(1).transform((v) => sanitizeText(v)),
    description: z.string().nullish().transform((v) => (v === undefined || v === null ? v : sanitizeText(v))),
    start: z.string().datetime(),
    end: z.string().datetime(),
    allDay: z.boolean().optional(),
    location: z.string().nullish().transform((v) => (v === undefined || v === null ? v : sanitizeText(v))),
    details: z.string().nullish().transform((v) => (v === undefined || v === null ? v : sanitizeText(v, 1000))),
    category: z.string().optional(),
    recurrenceRule: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
    recurrenceEnd: z.string().datetime().optional().nullable(),
    segments: z.array(z.object({
        offset: z.number(),
        label: z.string().transform((v) => sanitizeText(v, 100)),
        category: z.string(),
    })).optional(),
});

export const patchSchema = z.object({
    id: z.string().min(1),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    description: z.string().optional(),
});

export type EventInput = z.infer<typeof eventSchema>;
export type PatchInput = z.infer<typeof patchSchema>;
