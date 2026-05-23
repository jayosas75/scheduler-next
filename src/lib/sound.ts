// Retro-cyberpunk UI sound engine.
//
// Sounds are synthesized on the fly with the Web Audio API rather than loaded
// from audio files — this keeps the feature self-contained (no binary assets),
// works offline, and is CSP-safe (nothing is fetched, so the production
// `default-src 'self'` policy is never tripped).
//
// The AudioContext is created lazily on the first play, which must happen inside
// a user gesture (click/drag) to satisfy browser autoplay policies.

export const MUTE_STORAGE_KEY = 'scheduler-muted';

export type SoundName =
    | 'click'
    | 'toggle'
    | 'open'
    | 'close'
    | 'pickup'
    | 'drop'
    | 'save'
    | 'delete'
    | 'error';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let muted = false;
let initialized = false;

function readMuted(): boolean {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
        return false;
    }
}

function init() {
    if (initialized) return;
    muted = readMuted();
    initialized = true;
}

function ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.18; // soft overall volume
        masterGain.connect(ctx.destination);
    }
    // The context can start (or get) suspended under autoplay rules; resuming
    // here works because playSound is always called from a user gesture.
    if (ctx.state === 'suspended') {
        void ctx.resume().catch(() => {});
    }
    return ctx;
}

interface BlipOptions {
    type?: OscillatorType;
    freq: number;
    toFreq?: number;
    duration: number;
    gain?: number;
    delay?: number;
}

function blip(opts: BlipOptions) {
    if (!ctx || !masterGain) return;
    const start = ctx.currentTime + (opts.delay ?? 0);
    const dur = opts.duration;
    const peak = opts.gain ?? 0.5;

    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(opts.freq, start);
    if (opts.toFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.toFreq), start + dur);
    }

    // Fast attack, exponential decay envelope. Ramps target tiny non-zero
    // values because exponentialRampToValueAtTime can't hit exactly 0.
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(g);
    g.connect(masterGain);
    osc.start(start);
    osc.stop(start + dur + 0.02);
}

export function playSound(name: SoundName) {
    if (typeof window === 'undefined') return;
    init();
    if (muted) return;
    if (!ensureContext()) return;

    switch (name) {
        case 'click':
            blip({ type: 'square', freq: 660, toFreq: 880, duration: 0.06, gain: 0.32 });
            break;
        case 'toggle':
            blip({ type: 'triangle', freq: 520, toFreq: 760, duration: 0.09, gain: 0.5 });
            break;
        case 'open': // modal slide-in: quick upward sweep + sparkle
            blip({ type: 'sawtooth', freq: 300, toFreq: 900, duration: 0.18, gain: 0.3 });
            blip({ type: 'sine', freq: 1040, duration: 0.12, gain: 0.22, delay: 0.07 });
            break;
        case 'close':
            blip({ type: 'sawtooth', freq: 720, toFreq: 240, duration: 0.16, gain: 0.28 });
            break;
        case 'pickup': // drag start: low pluck
            blip({ type: 'square', freq: 220, toFreq: 340, duration: 0.07, gain: 0.4 });
            break;
        case 'drop': // reschedule confirm: two-note up
            blip({ type: 'square', freq: 440, duration: 0.06, gain: 0.36 });
            blip({ type: 'square', freq: 680, duration: 0.1, gain: 0.42, delay: 0.05 });
            break;
        case 'save': // ascending triad
            blip({ type: 'triangle', freq: 523, duration: 0.09, gain: 0.4 });
            blip({ type: 'triangle', freq: 659, duration: 0.09, gain: 0.4, delay: 0.07 });
            blip({ type: 'triangle', freq: 784, duration: 0.14, gain: 0.45, delay: 0.14 });
            break;
        case 'delete': // descending zap
            blip({ type: 'sawtooth', freq: 480, toFreq: 120, duration: 0.18, gain: 0.38 });
            break;
        case 'error': // harsh double low buzz
            blip({ type: 'square', freq: 160, duration: 0.12, gain: 0.4 });
            blip({ type: 'square', freq: 130, duration: 0.16, gain: 0.4, delay: 0.13 });
            break;
    }
}

export function isMuted(): boolean {
    init();
    return muted;
}

export function setMuted(value: boolean) {
    muted = value;
    initialized = true;
    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(MUTE_STORAGE_KEY, value ? '1' : '0');
        } catch {
            /* storage unavailable — fall back to in-memory state */
        }
    }
    // Unmuting happens inside the toggle's click handler, so this is a valid
    // moment to warm up (and resume) the AudioContext.
    if (!value) ensureContext();
}
