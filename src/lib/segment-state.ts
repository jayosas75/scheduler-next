// Per-segment time state within the current hour. Pure so it's easy to unit-test.
//
// A segment is defined by its start offset (0-59) and end offset (1-60) within
// an hour. `currentMinute` is the live minute-of-hour (0-59). The caller is
// responsible for short-circuiting when the row isn't for the current hour
// (or the day isn't today) — this function only handles the in-hour math.

export type SegmentState = 'past' | 'active' | 'future';

export function getSegmentState(
    currentMinute: number,
    segmentStartOffset: number,
    segmentEndOffset: number,
): SegmentState {
    if (currentMinute >= segmentEndOffset) return 'past';
    if (currentMinute >= segmentStartOffset) return 'active';
    return 'future';
}
