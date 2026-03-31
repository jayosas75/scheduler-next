
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TimeSlot, Segment, CATEGORIES, CategoryKey } from '@/types';
import { Plus, Disc, RefreshCw, X, Info, ThumbsUp } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_TIMES = ['09:00AM', '10:00AM', '11:00AM', '12:00PM', '01:00PM', '02:00PM', '03:00PM', '04:00PM', '05:00PM', '06:00PM'];

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

export default function SchedulerApp() {
    const [day, setDay] = useState(DAYS[0]);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    // Segment Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeSlotIndex, setActiveSlotIndex] = useState<number | null>(null);
    const [modalSegments, setModalSegments] = useState<Segment[]>([]);

    // Likes
    const [totalLikes, setTotalLikes] = useState(0);
    const [liked, setLiked] = useState(false);
    const [justLiked, setJustLiked] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    const fetchDay = useCallback(async (d: string) => {
        try {
            const res = await fetch(`/api/schedule?day=${d}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setSlots(data);
            } else {
                // Default slots
                setSlots(DEFAULT_TIMES.map(t => ({
                    time: t,
                    label: '',
                    category: 'misc',
                    deleted: false,
                    segments: []
                })));
            }
        } catch (e) {
            console.error(e);
            // Fallback
            setSlots(DEFAULT_TIMES.map(t => ({
                time: t,
                label: '',
                category: 'misc',
                deleted: false,
                segments: []
            })));
        }
    }, []);

    useEffect(() => {
        fetchDay(day);
    }, [day, fetchDay]);

    useEffect(() => {
        // Likes
        const savedLike = localStorage.getItem('yosas-user-liked') === 'true';
        setLiked(savedLike);

        fetch('/api/likes').then(res => res.json()).then(data => {
            setTotalLikes(data.count);
        }).catch(console.error);
    }, []);

    const saveDay = async (currentSlots: TimeSlot[]) => {
        try {
            await fetch('/api/schedule', {
                method: 'POST',
                body: JSON.stringify({ day, slots: currentSlots }),
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (e) {
            console.error('Failed to save', e);
        }
    };

    const handleSlotChange = (index: number, field: keyof TimeSlot, value: any) => {
        const newSlots = [...slots];
        newSlots[index] = { ...newSlots[index], [field]: value };
        setSlots(newSlots);
        saveDay(newSlots);
    };

    const toggleDelete = (index: number) => {
        const newSlots = [...slots];
        newSlots[index].deleted = !newSlots[index].deleted;
        setSlots(newSlots);
        saveDay(newSlots);
    };

    const openModal = (index: number) => {
        setActiveSlotIndex(index);
        const slot = slots[index];
        if (slot.segments && slot.segments.length > 0) {
            setModalSegments(JSON.parse(JSON.stringify(slot.segments)));
        } else {
            setModalSegments([{ label: '', category: 'misc', offset: 0 }]);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setActiveSlotIndex(null);
    };

    const saveSegments = () => {
        if (activeSlotIndex === null) return;
        const validSegments = modalSegments.filter(s => s.label.trim() !== '');

        const newSlots = [...slots];
        newSlots[activeSlotIndex].segments = validSegments;
        setSlots(newSlots);
        saveDay(newSlots);
        closeModal();
    };

    const addSegmentRow = () => {
        if (modalSegments.length < 4) {
            setModalSegments([...modalSegments, {
                label: '',
                category: 'misc',
                offset: modalSegments.length * 15
            }]);
        }
    };

    const removeSegmentRow = (index: number) => {
        const newSegs = modalSegments.filter((_, i) => i !== index).map((s, i) => ({
            ...s,
            offset: i * 15
        }));
        setModalSegments(newSegs);
    };

    const handleLike = async () => {
        if (liked) return;
        setLiked(true);
        setJustLiked(true);
        setTotalLikes(prev => prev + 1);
        localStorage.setItem('yosas-user-liked', 'true');

        try {
            await fetch('/api/likes', { method: 'POST' });
        } catch {
            // ignore
        }
        setTimeout(() => setJustLiked(false), 300);
    };

    const confirmReset = async () => {
        // Reset current view and user preference
        localStorage.removeItem('yosas-user-liked');
        setLiked(false);

        // Reset data for all days in backend (simulated by just resetting current view and waiting for user to overwrite)
        const clearedSlots = DEFAULT_TIMES.map(t => ({
            time: t,
            label: '',
            category: 'misc',
            deleted: false,
            segments: []
        }));
        setSlots(clearedSlots);

        // Ideally we'd send a clear request to API
        saveDay(clearedSlots);

        setIsResetModalOpen(false);
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 pb-8">
            {/* Title */}
            <h1 className="text-center text-2xl md:text-4xl font-black tracking-widest title-shine mb-6">
                YOSAS // NEON TIME MATRIX 2026
            </h1>

            {/* Days Nav */}
            <nav className="flex overflow-x-auto gap-2 border border-cyan-500/30 rounded-xl p-2 bg-black/60 glow">
                {DAYS.map(d => (
                    <button key={d} onClick={() => setDay(d)}
                        className={cn(
                            "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition",
                            day === d ? "bg-cyan-500 text-black" : "bg-black text-cyan-400 hover:bg-cyan-500/20"
                        )}>
                        {d}
                    </button>
                ))}
            </nav>

            {/* Legend */}
            <div className="relative bg-black/60 border border-cyan-500/30 rounded-2xl p-4 scanlines mt-6">
                <div className="flex flex-wrap gap-4 items-center">
                    {Object.entries(CATEGORIES).map(([key, cat]) => (
                        <div key={key} className="flex items-center gap-2">
                            <span className={cn("w-3 h-3 rounded-full", cat.color)}></span>
                            <span className="text-xs uppercase tracking-wider text-cyan-100">{cat.label}</span>
                        </div>
                    ))}

                    <button
                        onMouseEnter={() => setShowInfo(true)}
                        onMouseLeave={() => setShowInfo(false)}
                        className="ml-auto text-cyan-400 text-xl font-black cyber-info">
                        <Info className="w-6 h-6" />
                    </button>
                </div>

                <div className={cn(
                    "absolute top-full mt-3 left-0 right-0 bg-black border border-cyan-500/40 p-4 rounded-xl text-xs leading-relaxed glow z-10 text-cyan-100 transition-all duration-200",
                    showInfo ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
                )}>
                    A flourishing life is built upon <b className="text-cyan-400">Health</b>, the physical and mental vitality that powers your daily existence;
                    <b className="text-purple-400"> Work</b>, the meaningful contribution and professional purpose you offer the world;
                    <b className="text-lime-400"> Personal Growth</b>, the continuous pursuit of new knowledge, skills, and self-awareness;
                    <b className="text-yellow-400"> Relationships</b>, the deep emotional bonds and support systems shared with family and significant others;
                    and <b className="text-blue-400"> Life Admin</b>, the essential logistical management that keeps your personal infrastructure running smoothly.
                </div>
            </div>

            {/* Schedule */}
            <div className="bg-black/60 border border-cyan-500/30 rounded-3xl overflow-hidden glow mt-6">
                {slots.map((slot, idx) => (
                    <div key={idx} className={cn(
                        "p-3 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition",
                        slot.deleted && "row-disabled"
                    )}>
                        <div className="flex items-center gap-4">
                            <div className="w-16 text-xs text-cyan-400 font-bold">{slot.time}</div>

                            <select
                                value={slot.category}
                                onChange={(e) => handleSlotChange(idx, 'category', e.target.value)}
                                disabled={slot.deleted}
                                className="bg-black border border-cyan-500/30 rounded px-2 py-1 text-xs text-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed text-white">
                                {Object.entries(CATEGORIES).map(([k, c]) => (
                                    <option key={k} value={k}>{c.label}</option>
                                ))}
                            </select>

                            <input
                                value={slot.label}
                                onChange={(e) => handleSlotChange(idx, 'label', e.target.value)}
                                disabled={slot.deleted}
                                placeholder="Activity…"
                                className="flex-1 bg-transparent border-b border-cyan-500/30 focus:outline-none text-sm text-cyan-100 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-cyan-500/30"
                            />

                            {/* Segments Btn */}
                            {!slot.deleted && (
                                <button onClick={() => openModal(idx)} className="text-cyan-400 hover:text-cyan-300 transition hover:scale-110">
                                    {slot.segments && slot.segments.length > 0 ? <Disc size={20} /> : <Plus size={20} />}
                                </button>
                            )}

                            {/* Delete Toggle */}
                            <button onClick={() => toggleDelete(idx)} className={cn(
                                "transition hover:scale-110",
                                slot.deleted ? "text-green-400 hover:text-green-300" : "text-red-400 hover:text-red-300"
                            )}>
                                {slot.deleted ? <RefreshCw size={20} /> : <X size={20} />}
                            </button>
                        </div>

                        {/* Segments Display */}
                        {!slot.deleted && slot.segments && slot.segments.length > 0 && (
                            <div className="ml-16 mt-2 space-y-1">
                                {slot.segments.map((seg, i) => (
                                    <div key={i} className="text-xs flex gap-2 items-center">
                                        <span className="text-cyan-400">{slot.time} +{seg.offset}m</span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-black font-semibold",
                                            CATEGORIES[seg.category as CategoryKey]?.color
                                        )}>
                                            {seg.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <footer className="bg-black/95 border-t border-cyan-500/30 rounded-t-2xl mt-8 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs mb-3">
                    <div className="flex items-center gap-4">
                        <span className="text-cyan-400/60">v2.0.0-Next</span>
                        <span className="text-cyan-500/30">|</span>
                        <button onClick={() => setIsResetModalOpen(true)} className="text-red-400 hover:text-red-300 transition underline">
                            Reset All Data
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={handleLike} disabled={liked} className={cn(
                            "flex items-center gap-2 px-3 py-1 rounded border transition",
                            liked ? "border-yellow-400/30 text-yellow-400/50 cursor-not-allowed" : "border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 hover:scale-105"
                        )}>
                            <ThumbsUp size={14} />
                            <span>{liked ? 'Liked!' : 'Like'}</span>
                        </button>

                        <div className="flex items-center gap-2 px-3 py-1 bg-yellow-400/10 border border-yellow-400/30 rounded">
                            <span className={cn("text-yellow-400 font-bold", justLiked && "counter-pulse")}>
                                {totalLikes.toLocaleString()}
                            </span>
                            <span className="text-yellow-400/60">global likes</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-cyan-400/40 text-center pt-2 border-t border-cyan-500/10">
                    <span>Loaded: {totalLikes} likes from shared storage (DB)</span>
                </div>
            </footer>

            {/* Modal - Segments */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-black border-2 border-cyan-500/40 rounded-2xl p-6 w-full max-w-md glow" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-cyan-400 flex items-center gap-2">
                            <Plus size={20} /> Add 15-Minute Segments
                        </h3>

                        <div className="space-y-2 mb-4">
                            {modalSegments.map((seg, i) => (
                                <div key={i} className="flex gap-2">
                                    <select
                                        value={seg.category}
                                        onChange={e => {
                                            const newSegs = [...modalSegments];
                                            newSegs[i].category = e.target.value;
                                            setModalSegments(newSegs);
                                        }}
                                        className="bg-black border border-cyan-500/30 text-xs rounded px-2 py-1 text-cyan-100 text-white">
                                        {Object.entries(CATEGORIES).map(([k, c]) => (
                                            <option key={k} value={k}>{c.label}</option>
                                        ))}
                                    </select>
                                    <input
                                        value={seg.label}
                                        onChange={e => {
                                            const newSegs = [...modalSegments];
                                            newSegs[i].label = e.target.value;
                                            setModalSegments(newSegs);
                                        }}
                                        className="flex-1 bg-transparent border-b border-cyan-500/30 text-sm focus:outline-none px-2 py-1 text-cyan-100"
                                        placeholder="Activity"
                                    />
                                    {modalSegments.length > 1 && (
                                        <button onClick={() => removeSegmentRow(i)} className="text-red-400 hover:text-red-300">
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-cyan-500/20">
                            <button onClick={addSegmentRow} className="text-cyan-400 text-sm hover:text-cyan-300 transition flex items-center gap-1">
                                <Plus size={14} /> Add segment
                            </button>
                            <div className="flex gap-2">
                                <button onClick={closeModal} className="bg-black border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded font-bold text-sm hover:bg-cyan-500/10 transition">
                                    Cancel
                                </button>
                                <button onClick={saveSegments} className="bg-cyan-500 text-black px-4 py-2 rounded font-bold text-sm hover:bg-cyan-400 transition">
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal - Reset */}
            {isResetModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setIsResetModalOpen(false)}>
                    <div className="bg-black border-2 border-red-500/60 rounded-2xl p-6 w-full max-w-md glow custom-alert" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-red-400 flex items-center gap-2">
                            ⚠ Reset All Data?
                        </h3>
                        <p className="text-sm text-cyan-100 mb-6 leading-relaxed">
                            This will permanently delete <b>all schedule data</b> for all days and reset your like status.
                            This action <b className="text-red-400">cannot be undone</b>.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsResetModalOpen(false)} className="bg-black border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded font-bold text-sm hover:bg-cyan-500/10 transition">
                                Cancel
                            </button>
                            <button onClick={confirmReset} className="bg-red-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-red-400 transition">
                                Reset Everything
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
