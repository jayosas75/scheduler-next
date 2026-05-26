'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/types';
import { playSound } from '@/lib/sound';

function Toggle({ label, active, onToggle, title }: { label: string, active: boolean, onToggle: () => void, title?: string }) {
    return (
        <div onClick={onToggle} title={title} className="flex items-center gap-2 cursor-pointer group select-none">
            <div className={`w-8 h-4 rounded-full border border-white/50 relative transition-all duration-300 ${active ? 'bg-white/20 shadow-[0_0_10px_white]' : 'bg-black'}`}>
                <div className={`absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white shadow-[0_0_5px_white] transition-all duration-300 ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${active ? 'text-white' : 'text-white/50 group-hover:text-white/80'}`}>
                {label}
            </span>
        </div>
    );
}

export default function Legend() {
    const [showInfo, setShowInfo] = useState(false);
    // Placeholder for the upcoming Monthly view. Toggling has no effect yet.
    const [monthView, setMonthView] = useState(false);

    return (
        <div className="relative bg-black/60 border border-cyan-500/30 rounded-2xl p-4 scanlines mt-4 mb-6">
            <div className="flex flex-wrap gap-4 items-center">
                {Object.entries(CATEGORIES).filter(([k]) => k !== 'misc').map(([key, cat]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${cat.color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`}></span>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-cyan-100/80">{cat.label}</span>
                    </div>
                ))}

                <div className="hidden md:flex gap-4 ml-4 px-4 border-l border-cyan-500/30">
                    <Toggle
                        label="31 Days"
                        active={monthView}
                        onToggle={() => { playSound('toggle'); setMonthView(v => !v); }}
                        title="Monthly view — coming soon"
                    />
                </div>

                <button
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    className="ml-auto text-cyan-400 text-xl font-black cyber-info hover:scale-110 transition-transform"
                    aria-label="Information"
                >
                    ◈
                </button>
            </div>

            {showInfo && (
                <div className="absolute top-full mt-3 left-0 right-0 bg-black border border-cyan-500/40 p-5 rounded-xl text-xs leading-relaxed glow z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="text-cyan-100/90 italic mb-2 font-mono">&quot;Architecting a legendary existence requires balance across the five primary pillars of the Matrix...&quot;</p>
                    <div className="space-y-2">
                        <p>
                            <b className="text-cyan-400 uppercase tracking-tighter">Health</b>: The physical and mental vitality that powers your neural link;
                            without baseline maintenance, the system fails.
                        </p>
                        <p>
                            <b className="text-purple-400 uppercase tracking-tighter">Work</b>: Your professional output and meaningful contribution to the grid;
                            where strategy meets execution.
                        </p>
                        <p>
                            <b className="text-lime-400 uppercase tracking-tighter">Growth</b>: The continuous expansion of your local database;
                            new skills, knowledge, and self-optimization.
                        </p>
                        <p>
                            <b className="text-yellow-400 uppercase tracking-tighter">Relationships</b>: The vital peer-to-peer connections and support clusters
                            shared with your primary users.
                        </p>
                        <p>
                            <b className="text-blue-400 uppercase tracking-tighter">Life Admin</b>: The essential logistical maintenance and infrastructure
                            management that keeps your environment operational.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
