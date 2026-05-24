'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';

export const STORAGE_KEY = 'scheduler-theme';

export type ThemeId = 'cyan' | 'matrix' | 'tokyo' | 'yellow' | 'synth' | 'orange' | 'white';
// A stored preference can also be 'auto', which resolves to the current
// weekday's color at load time (CSS can't pick a color by weekday).
export type ThemePref = ThemeId | 'auto';

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
    { id: 'cyan', label: 'Cyber Cyan', swatch: '#00ffff' },
    { id: 'matrix', label: 'Matrix Green', swatch: '#00ff9c' },
    { id: 'tokyo', label: 'Tokyo Pink', swatch: '#ff2e88' },
    { id: 'yellow', label: 'Cyberpunk Yellow', swatch: '#fcee0a' },
    { id: 'synth', label: 'Synth Purple', swatch: '#b026ff' },
    { id: 'orange', label: 'Blood Orange', swatch: '#ff5e1a' },
    { id: 'white', label: 'Glow White', swatch: '#ffffff' },
];

// Weekday (0=Sun … 6=Sat) → theme id. Must stay in sync with the per-day tab
// colors in daily-view.tsx so the "Auto" accent matches the highlighted day.
export const DAY_THEME_IDS: ThemeId[] = ['cyan', 'matrix', 'tokyo', 'yellow', 'synth', 'orange', 'white'];

export function resolveThemeId(pref: ThemePref): ThemeId {
    return pref === 'auto' ? DAY_THEME_IDS[new Date().getDay()] : pref;
}

const ALL_PREFS: ThemePref[] = [...THEMES.map((t) => t.id), 'auto'];

function applyTheme(pref: ThemePref) {
    document.documentElement.dataset.theme = resolveThemeId(pref);
}

// Rainbow swatch used for the Auto option, signalling that it shifts.
const AUTO_SWATCH = 'conic-gradient(from 90deg, #00ffff, #00ff9c, #fcee0a, #ff5e1a, #ff2e88, #b026ff, #ffffff, #00ffff)';

export default function ThemeSwitcher() {
    const [current, setCurrent] = useState<ThemePref>('cyan');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Sync state with the saved preference, and re-assert it on the document.
    // The pre-paint inline script in layout.tsx normally applies it first
    // (no flash); re-applying here is a safety net so the selection still
    // survives a refresh even if that inline script is ever blocked (e.g. by
    // CSP in production).
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY) as ThemePref | null;
        if (stored && ALL_PREFS.includes(stored)) {
            setCurrent(stored);
            applyTheme(stored);
        }
    }, []);

    // Close on outside click or Escape.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const select = (pref: ThemePref) => {
        setCurrent(pref);
        applyTheme(pref);
        localStorage.setItem(STORAGE_KEY, pref);
        setOpen(false);
    };

    const resolvedId = resolveThemeId(current);
    const resolvedTheme = THEMES.find((t) => t.id === resolvedId) ?? THEMES[0];
    // When Auto is active the button shows today's resolved color.
    const buttonSwatch = current === 'auto' ? AUTO_SWATCH : resolvedTheme.swatch;

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label="Change neon theme"
                aria-haspopup="menu"
                aria-expanded={open}
                className="flex items-center gap-2 rounded-md border border-cyan-500/40 bg-black/40 px-2.5 py-1.5 text-cyan-300 transition hover:border-cyan-400 hover:text-cyan-200"
            >
                <Palette size={16} />
                <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: buttonSwatch, boxShadow: `0 0 8px ${resolvedTheme.swatch}` }}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-cyan-500/40 bg-black/95 backdrop-blur-md glow"
                >
                    <div className="border-b border-cyan-500/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                        Neon Accent
                    </div>

                    {/* Auto / Daily Shift */}
                    <button
                        role="menuitemradio"
                        aria-checked={current === 'auto'}
                        onClick={() => select('auto')}
                        className={`flex w-full items-center gap-3 border-b border-cyan-500/20 px-3 py-2 text-left text-xs uppercase tracking-wider transition hover:bg-cyan-500/10 ${
                            current === 'auto' ? 'text-cyan-200' : 'text-cyan-400/70'
                        }`}
                    >
                        <span
                            className="h-3.5 w-3.5 shrink-0 rounded-full"
                            style={{ background: AUTO_SWATCH, boxShadow: `0 0 8px ${resolvedTheme.swatch}` }}
                        />
                        <span className="flex flex-col leading-tight">
                            <span>Auto · Daily Shift</span>
                            <span className="text-[9px] normal-case tracking-normal opacity-60">
                                Today: {THEMES.find((t) => t.id === resolveThemeId('auto'))?.label}
                            </span>
                        </span>
                        {current === 'auto' && <span className="ml-auto text-cyan-300">●</span>}
                    </button>

                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            role="menuitemradio"
                            aria-checked={t.id === current}
                            onClick={() => select(t.id)}
                            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-xs uppercase tracking-wider transition hover:bg-cyan-500/10 ${
                                t.id === current ? 'text-cyan-200' : 'text-cyan-400/70'
                            }`}
                        >
                            <span
                                className="h-3.5 w-3.5 shrink-0 rounded-full"
                                style={{ background: t.swatch, boxShadow: `0 0 8px ${t.swatch}` }}
                            />
                            {t.label}
                            {t.id === current && <span className="ml-auto text-cyan-300">●</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
