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

// The year as its own card — century ("20") stacked over year-of-century
// ("26") — so it reads as prominently as the date cards and fills the space
// a small side-label used to leave empty.
function YearCard({ year }: { year: string }) {
    return (
        <div className="flip-card flip-card--year">
            <span className="flip-card-year-top">{year.slice(0, 2)}</span>
            <span className="flip-card-year-bottom">{year.slice(2)}</span>
        </div>
    );
}

interface FlipDateProps {
    start: Date;
    end: Date;
}

export default function FlipDate({ start, end }: FlipDateProps) {
    const year = format(end, 'yyyy');
    return (
        <div
            className="flip-clock"
            aria-label={`Week of ${format(start, 'MMMM d')} to ${format(end, 'MMMM d, yyyy')}`}
        >
            <FlipCard key={format(start, 'yyyy-MM-dd')} date={start} />
            <span className="flip-sep" aria-hidden="true">–</span>
            <FlipCard key={format(end, 'yyyy-MM-dd')} date={end} />
            <YearCard key={year} year={year} />
        </div>
    );
}
