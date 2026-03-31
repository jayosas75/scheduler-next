import { Segment } from './event-utils';

/**
 * Determines the state of the add/edit button for a given hour slot.
 * @param segments - List of segments existing in that hour.
 * @returns 'add' | 'edit'
 */

/**
 * Determines the state of the add/edit button for a given hour slot.
 * @param segments - List of segments existing in that hour.
 * @returns 'add' | 'edit'
 */
export function getButtonState(segments: Segment[]): 'add' | 'edit' {
    if (!segments || segments.length === 0) return 'add';

    const sorted = [...segments].sort((a, b) => a.offset - b.offset);
    let usefulDuration = 0;

    for (let i = 0; i < sorted.length; i++) {
        const seg = sorted[i];
        if (seg.label === '_FREE_') continue;

        const nextOffset = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
        usefulDuration += (nextOffset - seg.offset);
    }

    // If we have filled 60 minutes with actual tasks, we are full -> 'edit'
    if (usefulDuration >= 60) {
        return 'edit';
    }

    // If we have 4 items (even if some are spacers? No, spacers take slots too)
    // Actually our system limits to 4 *slots*. Spacers consume slots.
    // If we have 4 slots used (e.g. 15m Task, 15m Free, 15m Task, 15m Free), we are physically out of slots.
    if (sorted.length >= 4) {
        return 'edit';
    }

    return 'add';
}
