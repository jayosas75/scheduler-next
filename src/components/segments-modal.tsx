'use client';

import { useState, useEffect } from 'react';
import { CircleX, CirclePlus, CircleMinus, Repeat, Mic } from 'lucide-react';
import { clsx } from 'clsx';
import { CATEGORIES, Segment, RecurrenceRule } from '@/types';

interface SegmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (segments: Segment[], recurrenceRule?: RecurrenceRule, recurrenceEnd?: Date | null, details?: string) => void;
    initialSegments?: Segment[];
    initialRecurrenceRule?: RecurrenceRule;
    initialRecurrenceEnd?: Date | null;
    initialDetails?: string;
    time: string;
}

export default function SegmentsModal({ isOpen, onClose, onSave, initialSegments = [], initialRecurrenceRule = null, initialRecurrenceEnd = null, initialDetails = '', time }: SegmentsModalProps) {
    const [segments, setSegments] = useState<(Segment & { duration: number })[]>([]);
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>(null);
    const [recurrenceEnd, setRecurrenceEnd] = useState<string>('');
    const [details, setDetails] = useState<string>('');
    const [isListening, setIsListening] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Initialize recurrence state
            // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally resets form state to the provided props each time the modal opens
            setRecurrenceRule(initialRecurrenceRule || null);
            setRecurrenceEnd(initialRecurrenceEnd ? new Date(initialRecurrenceEnd).toISOString().slice(0, 16) : '');
            setDetails(initialDetails || '');

            const init = initialSegments.length > 0 ? initialSegments : [{ label: '', category: 'misc', offset: 0 }];
            const sorted = [...init].sort((a, b) => a.offset - b.offset);

            // Build state from the original (sorted) list: skip _FREE_ spacers but
            // use their offset to cap the preceding segment's duration.
            const stateSegments: (Segment & { duration: number })[] = [];

            for (let i = 0; i < sorted.length; i++) {
                const s = sorted[i];
                if (s.label === '_FREE_') continue;

                const nextOffset = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
                const dur = nextOffset - s.offset;
                stateSegments.push({ ...s, duration: dur });
            }

            // Fallback if empty
            if (stateSegments.length === 0) {
                stateSegments.push({ label: '', category: 'misc', offset: 0, duration: 60 });
            }

            setSegments(stateSegments);
        }
    }, [isOpen, initialSegments]);

    if (!isOpen) return null;

    const totalDuration = segments.reduce((acc, s) => acc + s.duration, 0);

    const recalculateOffsets = (segs: (Segment & { duration: number })[]) => {
        let currentOffset = 0;
        const validUnshifted: (Segment & { duration: number })[] = [];

        for (const s of segs) {
            if (currentOffset >= 60) break;

            let dur = s.duration;
            if (currentOffset + dur > 60) {
                dur = 60 - currentOffset;
            }

            validUnshifted.push({ ...s, offset: currentOffset, duration: dur });
            currentOffset += dur;
        }

        setSegments(validUnshifted);
    };

    const addSegmentRow = () => {
        if (totalDuration < 60 && segments.length < 4) {
            const remaining = 60 - totalDuration;
            const nextDur = remaining >= 15 ? 15 : remaining;
            const nextOffset = totalDuration;

            setSegments([...segments, {
                label: '',
                category: 'misc',
                offset: nextOffset,
                duration: nextDur
            }]);
        }
    };

    const removeSegmentRow = (index: number) => {
        const newSegments = [...segments];
        newSegments.splice(index, 1);
        recalculateOffsets(newSegments);
    };

    const handleDurationChange = (index: number, newDuration: number) => {
        const newSegments = [...segments];
        newSegments[index].duration = newDuration;
        recalculateOffsets(newSegments);
    };

    const startListening = (index: number) => {
        // @ts-expect-error - SpeechRecognition is a non-standard, vendor-prefixed Web API not in lib.dom types
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice recognition is not supported in this browser.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(index);
        
        recognition.onresult = (event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => {
            const transcript = event.results[0][0].transcript;
            const newSegments = [...segments];
            const currentLabel = newSegments[index].label.trim();
            newSegments[index].label = currentLabel ? `${currentLabel} ${transcript}` : transcript;
            setSegments(newSegments);
        };

        recognition.onerror = (event: { error: string }) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(null);
        };

        recognition.onend = () => setIsListening(null);

        recognition.start();
    };

    const handleSave = () => {
        const processedSegments: Segment[] = [];
        const sorted = [...segments].sort((a, b) => a.offset - b.offset);

        let expectedOffset = 0;

        for (const s of sorted) {
            if (s.offset > expectedOffset) {
                // Insert spacer for gap
                processedSegments.push({
                    label: '_FREE_',
                    category: 'misc',
                    offset: expectedOffset
                });
            }

            processedSegments.push({
                label: s.label,
                category: s.category,
                offset: s.offset
            });

            expectedOffset = s.offset + s.duration;
        }

        if (expectedOffset < 60) {
            processedSegments.push({
                label: '_FREE_',
                category: 'misc',
                offset: expectedOffset
            });
        }

        const recurrenceEndDate = recurrenceEnd ? new Date(recurrenceEnd) : null;
        onSave(processedSegments, recurrenceRule, recurrenceEndDate, details.trim());
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-black border-2 border-cyan-500/40 rounded-2xl p-6 w-full max-w-md glow scanlines animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-black mb-4 text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="text-2xl">⊕</span> Add Segments
                </h3>
                <p className="text-[10px] text-cyan-100/50 uppercase mb-4 tracking-tighter">Time Slot: {time}</p>

                {/* Recurrence Selector */}
                <div className="mb-6 border border-cyan-500/20 rounded-lg p-4 bg-cyan-500/5" data-testid="recurrence-selector">
                    <div className="flex items-center gap-2 mb-3">
                        <Repeat size={16} className="text-cyan-400" />
                        <label className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold">Repeat</label>
                    </div>
                    <select
                        value={recurrenceRule || ''}
                        onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceRule || null)}
                        className="w-full bg-black border border-cyan-500/30 text-sm rounded px-3 py-2 text-cyan-100 font-mono focus:border-cyan-400 outline-none mb-3"
                        data-testid="recurrence-rule-select"
                    >
                        <option value="">Does not repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    {recurrenceRule && (
                        <div>
                            <label className="text-[10px] text-cyan-400/70 uppercase tracking-widest block mb-2">
                                End Date (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                value={recurrenceEnd}
                                onChange={(e) => setRecurrenceEnd(e.target.value)}
                                className="w-full bg-black border border-cyan-500/30 text-sm rounded px-3 py-2 text-cyan-100 font-mono focus:border-cyan-400 outline-none"
                                data-testid="recurrence-end-input"
                            />
                        </div>
                    )}
                </div>

                <div className="space-y-3 mb-6">
                    {segments.map((seg, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <select
                                value={seg.duration}
                                onChange={(e) => handleDurationChange(i, parseInt(e.target.value))}
                                className="bg-black border border-cyan-500/30 text-sm rounded px-2 py-2 text-cyan-400 font-mono focus:border-cyan-400 outline-none w-24 font-bold"
                            >
                                {[15, 30, 45, 60].map(d => (
                                    <option key={d} value={d} disabled={d > (60 - (totalDuration - seg.duration))}>
                                        {d === 60 ? '1 Hr' : `${d}m`}
                                    </option>
                                ))}
                            </select>

                            <div className="text-[10px] text-cyan-500/50 font-mono w-12 pt-2 text-center">
                                :{(seg.offset === 0 ? '00' : seg.offset)}
                            </div>

                            <select
                                value={seg.category}
                                onChange={(e) => {
                                    const newSegments = [...segments];
                                    newSegments[i].category = e.target.value;
                                    setSegments(newSegments);
                                }}
                                className="bg-black border border-cyan-500/30 text-xs rounded px-2 py-2 text-cyan-100 focus:border-cyan-400 outline-none uppercase font-bold w-32"
                            >
                                {Object.entries(CATEGORIES).map(([key, cat]) => (
                                    <option key={key} value={key}>{cat.label}</option>
                                ))}
                            </select>

                            <input
                                value={seg.label}
                                onChange={(e) => {
                                    const newSegments = [...segments];
                                    newSegments[i].label = e.target.value;
                                    setSegments(newSegments);
                                }}
                                placeholder="Activity..."
                                className="flex-1 bg-transparent border-b border-cyan-500/30 text-sm focus:border-cyan-400 outline-none px-2 py-1 text-cyan-100 transition-colors placeholder:text-cyan-500/30"
                            />

                            <button
                                onClick={() => startListening(i)}
                                className={clsx(
                                    "p-1 rounded transition-all duration-300",
                                    isListening === i 
                                        ? "text-cyan-300 bg-cyan-500/20 animate-pulse shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)] scale-110"
                                        : "text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10"
                                )}
                                title="Dictate activity"
                            >
                                <Mic size={18} />
                            </button>

                            {segments.length > 1 && (
                                <button
                                    onClick={() => removeSegmentRow(i)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1 hover:bg-red-400/10 rounded"
                                    title="Remove segment"
                                >
                                    <CircleX size={20} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Event Details */}
                <div className="mb-6">
                    <label className="text-[10px] text-cyan-400 uppercase tracking-widest font-bold block mb-2">
                        Event Details
                    </label>
                    <textarea
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        rows={3}
                        maxLength={1000}
                        placeholder="Add specifics: location, what to bring, links, prep notes…"
                        className="w-full bg-black border border-cyan-500/30 text-sm rounded px-3 py-2 text-cyan-100 font-mono focus:border-cyan-400 outline-none resize-none placeholder:text-cyan-500/30"
                        data-testid="event-details-input"
                    />
                    <p className="text-[9px] text-cyan-100/40 mt-1.5 tracking-wide">
                        Drop the intel future-you will want — where, what to bring, who to ping.
                    </p>
                </div>

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-cyan-500/20">
                    <button
                        onClick={addSegmentRow}
                        disabled={totalDuration >= 60 || segments.length >= 4}
                        className={clsx(
                            "transition-all duration-300 font-black uppercase tracking-widest flex items-center gap-2 text-sm group",
                            totalDuration >= 60 
                                ? "text-red-500 cursor-not-allowed opacity-80" 
                                : "text-cyan-400 hover:text-cyan-300"
                        )}
                        title={totalDuration >= 60 
                            ? "🚨 TEMPORAL CAPACITY REACHED! No more chronos can be squeezed into this slot, Captain!" 
                            : "Add Segment"
                        }
                    >
                        {totalDuration >= 60 ? (
                            <CircleMinus size={24} className="text-red-500 animate-pulse" />
                        ) : (
                            <CirclePlus size={24} className="group-hover:scale-110 transition-transform" />
                        )}
                        <span>{totalDuration >= 60 ? "Hour Saturated" : "Add Segment"}</span>
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="bg-black border border-cyan-500/30 text-cyan-400 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-cyan-500/10 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
                        >
                            Save Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
