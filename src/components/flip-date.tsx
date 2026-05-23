'use client';

import { format } from 'date-fns';

// A single mechanical "flip-clock" card: a small month label sitting above a
// large day number, split by a hinge crease. The card is keyed by its date in
// the parent, so navigating weeks remounts it and replays the fold-in animation
// (see `.flip-card` / `@keyframes flip-in` in globals.css).
function FlipCard({ date }: { date: Date }) {
    return (
        <div className="flip-card">
            <span className="flip-card-month">{format(date, 'MMM').toUpperCase()}</span>
            <span className="flip-card-day">{format(date, 'd')}</span>
        </div>
    );
}

interface FlipDateProps {
    start: Date;
    end: Date;
}

export default function FlipDate({ start, end }: FlipDateProps) {
    return (
        <div
            className="flip-clock"
            aria-label={`Week of ${format(start, 'MMMM d')} to ${format(end, 'MMMM d, yyyy')}`}
        >
            <FlipCard key={format(start, 'yyyy-MM-dd')} date={start} />
            <span className="flip-sep" aria-hidden="true">–</span>
            <FlipCard key={format(end, 'yyyy-MM-dd')} date={end} />
            <span className="flip-year" aria-hidden="true">{format(end, 'yyyy')}</span>
        </div>
    );
}
