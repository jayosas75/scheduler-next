'use client';

import { useEffect, useState } from 'react';

const VISIT_FLAG = 'yosas-visited';

export default function VisitorCounter() {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const visited = localStorage.getItem(VISIT_FLAG) === 'true';
                const res = await fetch('/api/visitors', { method: visited ? 'GET' : 'POST' });
                const data = await res.json();
                if (!visited) localStorage.setItem(VISIT_FLAG, 'true');
                if (!cancelled) setCount(typeof data.count === 'number' ? data.count : 0);
            } catch {
                if (!cancelled) setCount(0);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const digits = (count ?? 0).toString().padStart(6, '0').split('');

    return (
        <div
            className="inline-flex items-center gap-3 rounded-xl px-3 py-2 select-none"
            style={{
                background: 'linear-gradient(160deg, #f6ecd4 0%, #e7d4ab 55%, #d9c08c 100%)',
                border: '2px solid #9c7a3c',
                boxShadow:
                    '0 4px 14px rgba(0,0,0,0.5), inset 0 2px 0 rgba(255,255,255,0.7), inset 0 -3px 6px rgba(120,90,40,0.4)',
            }}
            title="Unique visitors since launch"
        >
            {/* Atomic starburst + label */}
            <div className="flex flex-col items-start leading-none">
                <span
                    className="text-[15px]"
                    style={{ color: '#0e8d8d', textShadow: '0 1px 0 rgba(255,255,255,0.6)' }}
                    aria-hidden
                >
                    ✦
                </span>
                <span
                    className="mt-0.5 text-[8px] font-black uppercase"
                    style={{ color: '#b5471f', letterSpacing: '0.18em', fontFamily: 'var(--font-geist-mono)' }}
                >
                    Unique
                    <br />
                    Visitors
                </span>
            </div>

            {/* Odometer digit windows */}
            <div className="flex gap-[3px]" aria-label={`${count ?? 0} unique visitors`}>
                {digits.map((d, i) => (
                    <span
                        key={i}
                        className="relative flex h-7 w-[18px] items-center justify-center overflow-hidden rounded-[3px] font-black tabular-nums"
                        style={{
                            background: 'linear-gradient(180deg, #2a1d0c 0%, #120c05 50%, #2a1d0c 100%)',
                            border: '1px solid #6b5326',
                            color: '#ffbf57',
                            fontFamily: 'var(--font-geist-mono)',
                            fontSize: '17px',
                            textShadow: '0 0 6px rgba(255,170,50,0.7)',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
                        }}
                    >
                        {d}
                        {/* flip-clock seam */}
                        <span className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/55" />
                    </span>
                ))}
            </div>
        </div>
    );
}
