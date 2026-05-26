import { addDays, addWeeks, addMonths, isBefore } from 'date-fns';
import type { Segment } from '@/types';

export type RecurrenceRule = 'daily' | 'weekly' | 'monthly' | null;

export interface RecurringEvent {
    id: string;
    title: string;
    description?: string | null;
    start: Date | string;
    end: Date | string;
    allDay: boolean;
    location?: string | null;
    details?: string | null;
    category: string;
    deleted: boolean;
    recurrenceRule?: RecurrenceRule;
    recurrenceEnd?: Date | string | null;
    segments?: Segment[];
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
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);

    // If no recurrence rule, return the original event if it's in range
    if (!event.recurrenceRule) {
        if (isBefore(eventStart, rangeEnd) && !isBefore(eventStart, rangeStart)) {
            return [event];
        }
        return [];
    }

    // Parse exclusions from description (Format: EXCLUDE:2024-01-01,2024-01-02)
    const excludedDates: string[] = [];
    if (event.description && event.description.includes('EXCLUDE:')) {
        const match = event.description.match(/EXCLUDE:([\d\-,]*)/);
        if (match && match[1]) {
            excludedDates.push(...match[1].split(','));
        }
    }

    const instances: RecurringEvent[] = [];
    const duration = eventEnd.getTime() - eventStart.getTime();

    const recurrenceEndDate = event.recurrenceEnd
        ? new Date(event.recurrenceEnd)
        : addMonths(rangeEnd, 12);

    let currentStart = new Date(eventStart);

    // Iterate through occurrences
    let iterationCount = 0;
    const MAX_ITERATIONS = 1000;

    while (
        isBefore(currentStart, rangeEnd) &&
        isBefore(currentStart, recurrenceEndDate) &&
        iterationCount < MAX_ITERATIONS
    ) {
        iterationCount++;

        const dateStr = currentStart.toISOString().split('T')[0];

        // If this occurrence is within or after rangeStart AND not excluded, add it
        if (!isBefore(currentStart, rangeStart) && !excludedDates.includes(dateStr)) {
            const instanceEnd = new Date(currentStart.getTime() + duration);

            instances.push({
                ...event,
                id: `${event.id}_${currentStart.toISOString()}`,
                start: new Date(currentStart),
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
