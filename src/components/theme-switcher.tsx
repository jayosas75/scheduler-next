'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette } from 'lucide-react';

export const STORAGE_KEY = 'scheduler-theme';

export type ThemeId = 'cyan' | 'matrix' | 'tokyo' | 'yellow' | 'synth' | 'orange';

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
    { id: 'cyan', label: 'Cyber Cyan', swatch: '#00ffff' },
    { id: 'matrix', label: 'Matrix Green', swatch: '#00ff9c' },
    { id: 'tokyo', label: 'Tokyo Pink', swatch: '#ff2e88' },
    { id: 'yellow', label: 'Cyberpunk Yellow', swatch: '#fcee0a' },
    { id: 'synth', label: 'Synth Purple', swatch: '#b026ff' },
    { id: 'orange', label: 'Blood Orange', swatch: '#ff5e1a' },
];

function applyTheme(id: ThemeId) {
    document.documentElement.dataset.theme = id;
}

export default function ThemeSwitcher() {
    const [current, setCurrent] = useState<ThemeId>('cyan');
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Sync state with whatever the no-flash script already applied.
    useEffect(() => {
        const stored = (localStorage.getItem(STORAGE_KEY) as ThemeId) || 'cyan';
        if (THEMES.some((t) => t.id === stored)) setCurrent(stored);
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

    const select = (id: ThemeId) => {
        setCurrent(id);
        applyTheme(id);
        localStorage.setItem(STORAGE_KEY, id);
        setOpen(false);
    };

    const active = THEMES.find((t) => t.id === current) ?? THEMES[0];

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
                    style={{ background: active.swatch, boxShadow: `0 0 8px ${active.swatch}` }}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-cyan-500/40 bg-black/95 backdrop-blur-md glow"
                >
                    <div className="border-b border-cyan-500/20 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                        Neon Accent
                    </div>
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
