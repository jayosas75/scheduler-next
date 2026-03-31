'use client';

import { useState, useEffect } from 'react';
import { CircleX, CirclePlus, Repeat } from 'lucide-react';
import { CATEGORIES, Segment, RecurrenceRule } from '@/types';

interface SegmentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (segments: Segment[], recurrenceRule?: RecurrenceRule, recurrenceEnd?: Date | null) => void;
    initialSegments?: Segment[];
    initialRecurrenceRule?: RecurrenceRule;
    initialRecurrenceEnd?: Date | null;
    time: string;
}

export default function SegmentsModal({ isOpen, onClose, onSave, initialSegments = [], initialRecurrenceRule = null, initialRecurrenceEnd = null, time }: SegmentsModalProps) {
    const [segments, setSegments] = useState<(Segment & { duration: number })[]>([]);
    const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>(null);
    const [recurrenceEnd, setRecurrenceEnd] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            // Initialize recurrence state
            setRecurrenceRule(initialRecurrenceRule || null);
            setRecurrenceEnd(initialRecurrenceEnd ? new Date(initialRecurrenceEnd).toISOString().slice(0, 16) : '');

            const init = initialSegments.length > 0 ? initialSegments : [{ label: '', category: 'misc', offset: 0 }];
            const sorted = [...init].sort((a, b) => a.offset - b.offset);

            // Calculate durations and filter out _FREE_ spacers if re-editing
            const validSegments = sorted.filter(s => s.label !== '_FREE_');

            if (validSegments.length === 0) {
                validSegments.push({ label: '', category: 'misc', offset: 0 });
            }

            const withDuration = validSegments.map((s, i) => {
                // Determine next offset based on next VALID segment
                const nextOffset = (i < validSegments.length - 1) ? validSegments[i + 1].offset : 60;
                let dur = nextOffset - s.offset;

                // If the gap was huge (e.g. spacer was removed), set duration to cover it?
                // Or if we had a spacer, it meant 'free time'.
                // If we load: Task(0, 15m). Spacer(15, 45m).
                // Filtered: Task(0).
                // Next offset? None. Default 60.
                // Duration = 60 - 0 = 60.
                // So it "expands" back to full 60 if we don't respect the spacer's existence?
                // This is tricky. If we just loaded and saved, we'd lose the "15m" setting.
                // So we MUST NOT filter out spacers when calculating duration?
                // OR we must imply duration from the *original* list including spacers.

                return { ...s, duration: dur };
            });

            // Wait, iteration above logic is flawed if I filtered first.
            // Better: Iterate ALL sorted segments.
            // If segment is _FREE_, do not add to state, BUT use its offset to cap previous duration.
            // Actually, if we just keep `_FREE_` segments in state but don't show them in UI?
            // "15m Activity" -> "45m Free".
            // If I show "Activity (15m)", it implies the rest is free.
            // So I should calculate duration based on original list, then map to state.

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
        onSave(processedSegments, recurrenceRule, recurrenceEndDate);
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

                <div className="flex justify-between items-center mt-6 pt-6 border-t border-cyan-500/20">
                    <button
                        onClick={addSegmentRow}
                        disabled={totalDuration >= 60 || segments.length >= 4}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors font-black uppercase tracking-widest disabled:opacity-30 flex items-center gap-2 text-sm group"
                    >
                        <CirclePlus size={24} className="group-hover:scale-110 transition-transform" />
                        <span>Add Segment</span>
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
                            className="bg-cyan-500 text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-cyan-400 transition-colors shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                        >
                            Save Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
