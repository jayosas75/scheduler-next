import { addDays, addWeeks, addMonths, startOfDay, isBefore, isAfter } from 'date-fns';

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | null;

export interface RecurringEvent {
    id: string;
    title: string;
    description?: string | null;
    start: Date | string;
    end: Date | string;
    allDay: boolean;
    location?: string | null;
    category: string;
    recurrenceRule?: RecurrenceRule;
    recurrenceEnd?: Date | string | null;
    segments?: any[];
}

/**
 * Calculates the next occurrence date based on the recurrence rule
 */
export function getNextOccurrence(date: Date, rule: RecurrenceRule): Date | null {
    if (!rule) return null;

    switch (rule) {
        case 'daily':
            return addDays(date, 1);
        case 'weekly':
            return addWeeks(date, 1);
        case 'monthly':
            return addMonths(date, 1);
        default:
            return null;
    }
}

/**
 * Expands a recurring event into virtual instances for a date range.
 * Returns an array of event instances that fall within rangeStart and rangeEnd.
 */
export function expandRecurringEvent(
    event: RecurringEvent,
    rangeStart: Date,
    rangeEnd: Date
): RecurringEvent[] {
    // If no recurrence rule, return the original event if it's in range
    if (!event.recurrenceRule) {
        const eventStart = new Date(event.start);
        if (isBefore(eventStart, rangeEnd) && isAfter(eventStart, rangeStart)) {
            return [event];
        }
        return [];
    }

    const instances: RecurringEvent[] = [];
    const originalStart = new Date(event.start);
    const originalEnd = new Date(event.end);
    const duration = originalEnd.getTime() - originalStart.getTime();

    const recurrenceEndDate = event.recurrenceEnd
        ? new Date(event.recurrenceEnd)
        : addMonths(rangeEnd, 12); // Default: expand up to 1 year ahead if no end date

    let currentStart = startOfDay(originalStart);

    // Iterate through occurrences within the range
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000; // Safety limit

    while (
        isBefore(currentStart, rangeEnd) &&
        isBefore(currentStart, recurrenceEndDate) &&
        iterationCount < MAX_ITERATIONS
    ) {
        iterationCount++;

        // If this occurrence is within the requested range, add it
        if (!isBefore(currentStart, rangeStart)) {
            const instanceEnd = new Date(currentStart.getTime() + duration);

            instances.push({
                ...event,
                id: `${event.id}_${currentStart.toISOString()}`, // Virtual ID
                start: currentStart,
                end: instanceEnd,
            });
        }

        // Calculate next occurrence
        const nextOccurrence = getNextOccurrence(currentStart, event.recurrenceRule);
        if (!nextOccurrence) break;
        currentStart = nextOccurrence;
    }

    return instances;
}

/**
 * Expands multiple events (some may be recurring) into a flat list of instances.
 */
export function expandEvents(
    events: RecurringEvent[],
    rangeStart: Date,
    rangeEnd: Date
): RecurringEvent[] {
    const expanded: RecurringEvent[] = [];

    for (const event of events) {
        const instances = expandRecurringEvent(event, rangeStart, rangeEnd);
        expanded.push(...instances);
    }

    return expanded;
}
