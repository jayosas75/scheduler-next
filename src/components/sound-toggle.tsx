'use client';

import { useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { isMuted, setMuted, playSound } from '@/lib/sound';

export default function SoundToggle() {
    // Start unmuted to match the server render; sync to the stored value after
    // mount to avoid a hydration mismatch.
    const [muted, setMutedState] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage read after mount, deliberately avoids a hydration mismatch
        setMutedState(isMuted());
    }, []);

    const toggle = () => {
        const next = !muted;
        setMuted(next);
        setMutedState(next);
        // Give audible feedback only when turning sound ON.
        if (!next) playSound('toggle');
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={muted ? 'Unmute UI sounds' : 'Mute UI sounds'}
            aria-pressed={muted}
            title={muted ? 'Sound off' : 'Sound on'}
            className={`flex items-center justify-center rounded-md border bg-black/40 px-2.5 py-1.5 transition ${
                muted
                    ? 'border-white/20 text-white/40 hover:border-white/40 hover:text-white/70'
                    : 'border-cyan-500/40 text-cyan-300 hover:border-cyan-400 hover:text-cyan-200'
            }`}
        >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
    );
}
