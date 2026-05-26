'use client';

// Decorative "end of day" sign-off shown in the empty space after the final
// (23:00) hour row. Pure CSS crescent moon + twinkling stars + neon text.
export default function EndOfNight() {
    return (
        <div className="end-of-night" aria-hidden="true">
            <div className="eon-sky">
                <span className="eon-star" style={{ left: '12%', top: '20%', animationDelay: '0s' }} />
                <span className="eon-star" style={{ left: '28%', top: '60%', animationDelay: '0.8s' }} />
                <span className="eon-star" style={{ left: '70%', top: '25%', animationDelay: '1.4s' }} />
                <span className="eon-star" style={{ left: '85%', top: '55%', animationDelay: '0.4s' }} />
                <span className="eon-star" style={{ left: '50%', top: '12%', animationDelay: '1.1s' }} />
                <span className="eon-moon" />
            </div>
            <div className="eon-title">SEE YOU TOMORROW</div>
            <div className="eon-sub">{'// NEURAL LINK POWERING DOWN'}</div>
        </div>
    );
}
