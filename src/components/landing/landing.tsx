'use client';

import { useRef } from 'react';
import Link from 'next/link';
import {
    Move,
    Repeat,
    Mic,
    Download,
    Activity,
    Palette,
    ArrowRight,
    ChevronDown,
} from 'lucide-react';
import ThemeSwitcher from '@/components/theme-switcher';
import Footer from '@/components/footer';
import { useParallax, useScrollReveal } from './use-landing-motion';

const STICKERS = [
    { label: '⚡ DRAG & DROP', top: '18%', left: '8%', tilt: '-8deg', drift: '7s', delay: '0s', depth: 2 },
    { label: '🎤 VOICE READY', top: '26%', left: '78%', tilt: '7deg', drift: '8.5s', delay: '0.6s', depth: 3 },
    { label: '♻ RECURRING', top: '64%', left: '12%', tilt: '6deg', drift: '6.5s', delay: '1.1s', depth: 1.5 },
    { label: '🎨 6 NEON THEMES', top: '70%', left: '74%', tilt: '-6deg', drift: '9s', delay: '0.3s', depth: 2.5 },
];

const FEATURES = [
    { icon: Move, title: 'Drag & Drop', body: 'Reschedule with a flick. Grab any event and drop it into a new slot — instant, intuitive, zero friction.' },
    { icon: Repeat, title: 'Recurring Events', body: 'Daily, weekly, monthly routines that schedule themselves. Set the rhythm once and let the matrix handle it.' },
    { icon: Mic, title: 'Voice Interface', body: 'Hands-free entry. Speak your plans and watch them materialize on the grid — no keyboard required.' },
    { icon: Download, title: 'iCal Export', body: 'Beam your schedule anywhere. Export to iCal and sync with the legacy calendars of the old world.' },
    { icon: Activity, title: 'Live Hour Progress', body: 'A real-time scanline tracks the current hour, pulsing through your day so you never lose the beat.' },
    { icon: Palette, title: 'Neon Themes', body: 'Six hand-tuned neon palettes. Recolor the entire interface in one tap — try the swatch up top right now.' },
];

export default function Landing({ isAuthed }: { isAuthed: boolean }) {
    const parallaxRef = useParallax<HTMLElement>();
    const revealRef = useScrollReveal<HTMLDivElement>();

    return (
        <div ref={revealRef} className="relative w-full overflow-x-hidden">
            {/* ===================== HERO ===================== */}
            <section
                ref={parallaxRef}
                className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center"
            >
                {/* Perspective grid floor (reuses login-page grid) */}
                <div className="cyber-grid-wrapper">
                    <div className="cyber-grid" />
                </div>

                {/* Parallax glow orbs */}
                <div className="parallax-layer" style={{ ['--depth' as string]: -1.2, ['--scroll-depth' as string]: 0.12 }}>
                    <span className="glow-orb left-[8%] top-[14%] h-72 w-72" style={{ background: 'rgba(var(--accent-rgb), 0.6)' }} />
                    <span className="glow-orb right-[6%] bottom-[16%] h-80 w-80 bg-fuchsia-600/40" />
                    <span className="glow-orb left-[40%] top-[55%] h-64 w-64 bg-cyan-400/20" />
                </div>

                {/* Floating sticker badges */}
                <div className="parallax-layer" style={{ ['--depth' as string]: 1.6 }}>
                    {STICKERS.map((s) => (
                        <span
                            key={s.label}
                            className="sticker absolute select-none rounded-full border border-cyan-400/60 bg-black/70 px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest text-cyan-200 backdrop-blur-sm"
                            style={{
                                top: s.top,
                                left: s.left,
                                ['--tilt' as string]: s.tilt,
                                ['--drift' as string]: s.drift,
                                ['--delay' as string]: s.delay,
                                ['--depth' as string]: s.depth,
                            }}
                        >
                            {s.label}
                        </span>
                    ))}
                </div>

                {/* Theme switcher — let visitors play with the neon palettes */}
                <div className="absolute right-5 top-5 z-30">
                    <ThemeSwitcher />
                </div>

                {/* Hero content */}
                <div className="relative z-20 flex flex-col items-center">
                    <p className="mb-5 rounded-full border border-cyan-500/40 bg-black/50 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-300 backdrop-blur-sm">
                        ⊙ Protocol v1.3.0 // System Online
                    </p>
                    <h1 className="landing-title font-orbitron text-6xl font-black uppercase leading-[0.95] tracking-tighter sm:text-7xl md:text-8xl">
                        Schedule
                        <br />
                        the Future
                    </h1>
                    <p className="mt-6 max-w-xl font-mono text-sm leading-relaxed text-cyan-100/70 sm:text-base">
                        A high-performance, mobile-first calendar for the neon-drenched streets of 2026.
                        Drag, speak, repeat — and never miss a beat.
                    </p>

                    <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
                        {isAuthed ? (
                            <Link href="/calendar" className="cta-primary">
                                ⊕ Enter Calendar <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="cta-primary">
                                    ⊕ Jack In <ArrowRight size={18} />
                                </Link>
                                <Link href="/register" className="cta-secondary">
                                    Create Account
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                <ChevronDown className="scroll-cue absolute bottom-8 left-1/2 z-20 -translate-x-1/2 text-cyan-400" size={28} />
            </section>

            {/* ===================== MARQUEE ===================== */}
            <section className="marquee-mask relative overflow-hidden border-y border-cyan-500/30 bg-black/50 py-4">
                <div className="marquee-track font-orbitron text-2xl font-black uppercase tracking-widest text-cyan-300/80" style={{ ['--marquee-speed' as string]: '32s' }}>
                    <MarqueeRow />
                    <MarqueeRow />
                </div>
                <div className="marquee-track marquee-reverse mt-2 font-orbitron text-2xl font-black uppercase tracking-widest text-fuchsia-400/40" style={{ ['--marquee-speed' as string]: '26s' }}>
                    <MarqueeRow alt />
                    <MarqueeRow alt />
                </div>
            </section>

            {/* ===================== FEATURES ===================== */}
            <section className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
                <div className="reveal mb-16 text-center">
                    <h2 className="font-orbitron text-4xl font-black uppercase tracking-tight text-cyan-100 sm:text-5xl">
                        Built for <span className="title-shine">Netrunners</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl font-mono text-sm text-cyan-100/60">
                        Every feature tuned for speed and built to feel alive.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((f, i) => (
                        <TiltCard key={f.title} delay={`${(i % 3) * 0.08}s`}>
                            <div className="w-12 h-12 mb-5 flex items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-500/20 text-cyan-300">
                                <f.icon className="h-6 w-6" />
                            </div>
                            <h3 className="mb-2 font-orbitron text-lg font-black uppercase tracking-widest text-cyan-100">
                                {f.title}
                            </h3>
                            <p className="font-mono text-xs leading-relaxed text-cyan-100/60">{f.body}</p>
                        </TiltCard>
                    ))}
                </div>
            </section>

            {/* ===================== LIVE PREVIEW ===================== */}
            <section className="relative overflow-hidden px-6 py-24">
                <span className="glow-orb left-1/4 top-1/3 h-80 w-80" style={{ background: 'rgba(var(--accent-rgb), 0.25)' }} />
                <div className="reveal mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
                    <div>
                        <h2 className="font-orbitron text-4xl font-black uppercase tracking-tight text-cyan-100 sm:text-5xl">
                            Your day,
                            <br />
                            <span className="landing-title">in real time</span>
                        </h2>
                        <p className="mt-5 max-w-md font-mono text-sm leading-relaxed text-cyan-100/60">
                            A live scanline pulses through the current hour. Past events dim, the
                            active block glows — the grid breathes with the clock so you always
                            know exactly where you are.
                        </p>
                        {!isAuthed && (
                            <Link href="/register" className="cta-primary mt-8 inline-flex">
                                Start Scheduling <ArrowRight size={18} />
                            </Link>
                        )}
                    </div>
                    <PreviewPanel />
                </div>
            </section>

            {/* ===================== RHYTHM STATS ===================== */}
            <section className="relative border-y border-cyan-500/20 bg-black/40 py-16">
                <div className="reveal mx-auto grid max-w-4xl grid-cols-1 gap-10 px-6 text-center sm:grid-cols-3">
                    <Stat value="6" label="Neon Themes" beat="0s" />
                    <Stat value="∞" label="Events" beat="0.4s" />
                    <Stat value="100%" label="Local & Private" beat="0.8s" />
                </div>
            </section>

            {/* ===================== CLOSING CTA ===================== */}
            <section className="relative overflow-hidden px-6 py-28 text-center">
                <span className="glow-orb left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2" style={{ background: 'rgba(var(--accent-rgb), 0.3)' }} />
                <div className="reveal relative z-10 mx-auto max-w-2xl">
                    <h2 className="landing-title font-orbitron text-5xl font-black uppercase tracking-tighter sm:text-6xl">
                        Jack into 2026
                    </h2>
                    <p className="mx-auto mt-5 max-w-md font-mono text-sm text-cyan-100/60">
                        No corporate oversight. No tracking. Just you and a calendar built for the future.
                    </p>
                    <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                        {isAuthed ? (
                            <Link href="/calendar" className="cta-primary">
                                ⊕ Enter Calendar <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <>
                                <Link href="/register" className="cta-primary">
                                    ⊕ Create Account <ArrowRight size={18} />
                                </Link>
                                <Link href="/login" className="cta-secondary">
                                    Log In
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

const MARQUEE_ITEMS = ['Winter is Brewing', 'Drag & Drop', 'Voice Interface', 'Recurring Events', 'Live Hour Progress', 'iCal Export', 'Neon Themes'];

function MarqueeRow({ alt = false }: { alt?: boolean }) {
    return (
        <span aria-hidden className="inline-flex shrink-0">
            {MARQUEE_ITEMS.map((item, i) => (
                <span key={i} className="mx-6 inline-flex items-center gap-6">
                    {item}
                    <span className={alt ? 'text-cyan-500/40' : 'text-fuchsia-400/60'}>◆</span>
                </span>
            ))}
        </span>
    );
}

function TiltCard({ children, delay }: { children: React.ReactNode; delay: string }) {
    const ref = useRef<HTMLDivElement>(null);

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 12;
        const rx = -((e.clientY - r.top) / r.height - 0.5) * 12;
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    };
    const onLeave = () => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
    };

    return (
        <div className="tilt-scene reveal" style={{ ['--reveal-delay' as string]: delay }}>
            <div
                ref={ref}
                onPointerMove={onMove}
                onPointerLeave={onLeave}
                className="tilt-3d group h-full rounded-2xl border border-cyan-500/20 bg-black/50 p-6 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/5"
            >
                {children}
            </div>
        </div>
    );
}

function PreviewPanel() {
    const rows = [
        { time: '09:00', label: 'Stand-up // Sync', state: 'past' },
        { time: '10:00', label: 'Deep Work Block', state: 'past' },
        { time: '11:00', label: 'Latte Protocol ☕', state: 'active' },
        { time: '12:00', label: 'Lunch // Offline', state: 'future' },
        { time: '13:00', label: 'Design Review', state: 'future' },
    ];

    return (
        <div className="tilt-scene">
            <div className="rounded-2xl border-2 border-cyan-500/40 bg-black/80 p-5 glow scanlines">
                <div className="mb-4 flex items-center justify-between border-b border-cyan-500/20 pb-3">
                    <span className="font-orbitron text-sm font-black uppercase tracking-widest text-cyan-300">
                        Daily // 2026
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-cyan-400/60">Live</span>
                </div>
                <div className="space-y-1.5">
                    {rows.map((r) => (
                        <div
                            key={r.time}
                            className={[
                                'flex items-center gap-3 rounded-md border px-3 py-2.5 font-mono text-xs',
                                r.state === 'active'
                                    ? 'event-active border-cyan-400/60 bg-cyan-500/10 text-cyan-100'
                                    : r.state === 'past'
                                      ? 'event-past border-cyan-500/10 text-cyan-100'
                                      : 'border-cyan-500/15 text-cyan-100/80',
                            ].join(' ')}
                        >
                            <span className={r.state === 'active' ? 'time-label-active text-cyan-300' : 'text-cyan-400/50'}>
                                {r.time}
                            </span>
                            <span className="flex-1">{r.label}</span>
                            {r.state === 'active' && <span className="scanline-now h-2 w-2 rounded-full bg-cyan-300" />}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function Stat({ value, label, beat }: { value: string; label: string; beat: string }) {
    return (
        <div>
            <div className="rhythm font-orbitron text-5xl font-black text-cyan-300 sm:text-6xl" style={{ ['--beat-delay' as string]: beat }}>
                {value}
            </div>
            <div className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan-100/50">{label}</div>
        </div>
    );
}
