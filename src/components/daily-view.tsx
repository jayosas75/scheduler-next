'use client';

import { useState, useRef } from 'react';
import { format, addDays, startOfWeek, eachHourOfInterval, isSameDay } from 'date-fns';
import { clsx } from 'clsx';
import type { Event as PrismaEvent } from '@prisma/client';
import { ChevronLeft, ChevronRight, Trash2, Pencil, CirclePlus, Settings, Download, Repeat } from 'lucide-react';
import { CATEGORIES, Segment, RecurrenceRule } from '@/types';
import Legend from './legend';
import SegmentsModal from './segments-modal';
import { generateEventTitle, generateBorderGradient, getButtonState, generateICal, generateDaySummary } from '@/lib/calendar';
import { expandEvents } from '@/lib/recurrence-utils';
import { Share2 } from 'lucide-react';

interface Event extends Omit<PrismaEvent, 'recurrenceRule' | 'recurrenceEnd'> {
    segments?: Segment[];
    recurrenceRule?: string | null;
    recurrenceEnd?: Date | string | null;
}

interface DailyViewProps {
    events: Event[];
    initialDate?: Date;
}

export default function DailyView({ events: initialEvents, initialDate = new Date() }: DailyViewProps) {
    const [currentDate, setCurrentDate] = useState(initialDate);
    const [selectedDay, setSelectedDay] = useState(initialDate.getDay()); // Default to the correct current weekday (0-6)
    const [events, setEvents] = useState<Event[]>(initialEvents);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeHour, setActiveHour] = useState<Date | null>(null);
    const [activeSegments, setActiveSegments] = useState<Segment[]>([]);
    const [activeEventId, setActiveEventId] = useState<string | null>(null);
    const [activeRecurrenceRule, setActiveRecurrenceRule] = useState<RecurrenceRule>(null);
    const [activeRecurrenceEnd, setActiveRecurrenceEnd] = useState<Date | null>(null);

    // Drag & Drop state
    const dragEventIdRef = useRef<string | null>(null);
    const [dragOverHour, setDragOverHour] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const weekStart = startOfWeek(currentDate);
    const daysArr = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate hours (9 AM to 6 PM like original)
    const hours = eachHourOfInterval({
        start: new Date(2024, 0, 1, 9, 0),
        end: new Date(2024, 0, 1, 18, 0),
    });

    const selectedDate = daysArr[selectedDay];

    // Filter events for selected day (including segments and expanded recurring instances)
    const expandedEvents = expandEvents(events as any, weekStart, addDays(weekStart, 7));
    const dayEvents = expandedEvents.filter(event =>
        isSameDay(new Date(event.start), selectedDate) && !event.deleted
    );

    const goToPreviousWeek = () => setCurrentDate(addDays(currentDate, -7));
    const goToNextWeek = () => setCurrentDate(addDays(currentDate, 7));

    const openSegmentsModal = (hour: Date, existingSegments: Segment[] = [], eventId: string | null = null, recurrenceRule: RecurrenceRule = null, recurrenceEnd: Date | null = null) => {
        setActiveHour(hour);
        setActiveSegments(existingSegments);
        setActiveEventId(eventId);
        setActiveRecurrenceRule(recurrenceRule);
        setActiveRecurrenceEnd(recurrenceEnd);
        setModalOpen(true);
    };

    const handleSaveSegments = async (segments: Segment[], recurrenceRule?: RecurrenceRule, recurrenceEnd?: Date | null) => {
        if (!activeHour) return;

        // Calculate duration of NEW segments
        const newDuration = segments.reduce((acc, s, i) => {
            if (s.label === '_FREE_') return acc;
            const nextOffset = (i < segments.length - 1) ? segments[i + 1].offset : 60;
            return acc + (nextOffset - s.offset);
        }, 0);

        // Check availability in the hour
        const hourNum = activeHour.getHours();
        const existingEventsInHour = dayEvents.filter(e =>
            new Date(e.start).getHours() === hourNum &&
            e.id !== activeEventId // Exclude the one we are editing
        );

        let occupiedDuration = 0;
        existingEventsInHour.forEach(e => {
            if (e.segments && e.segments.length > 0) {
                const sorted = [...e.segments].sort((a, b) => a.offset - b.offset);
                sorted.forEach((s, i) => {
                    if (s.label === '_FREE_') return;
                    const next = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
                    occupiedDuration += (next - s.offset);
                });
            } else {
                occupiedDuration += 60; // Assume full if no segments
            }
        });

        if (occupiedDuration + newDuration > 60) {
            alert(`⚠️ Time Conflict!\n\nThis hour already has ${occupiedDuration}m of activities.\nYou are trying to add ${newDuration}m, which exceeds the 60m limit.`);
            return;
        }

        // Proceed to Save

        // If editing, delete original first
        if (activeEventId) {
            await handleDeleteEvent(activeEventId);
        }

        // Combine selectedDate with activeHour time
        const start = new Date(selectedDate);
        start.setHours(activeHour.getHours());
        start.setMinutes(activeHour.getMinutes());

        const end = new Date(start);
        end.setHours(start.getHours() + 1);

        const newEvent = {
            title: generateEventTitle(segments),
            description: `Segments: ${segments.map(s => s.label).join(', ')}`,
            start: start.toISOString(),
            end: end.toISOString(),
            category: segments[0].category,
            segments: segments,
            recurrenceRule: recurrenceRule || null,
            recurrenceEnd: recurrenceEnd ? recurrenceEnd.toISOString() : null,
        };

        try {
            const res = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent),
            });

            if (res.ok) {
                const savedEvent = await res.json();
                setEvents(prev => [...prev, savedEvent]);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Failed to save event:", res.status, errorData);
                alert(`Failed to save event: ${errorData.message || res.statusText}`);
            }
        } catch (error) {
            console.error("Failed to save event:", error);
        }

        setModalOpen(false);
        setActiveEventId(null);
    };

    const handleDeleteEvent = async (id: string) => {
        const [realId, dateIso] = id.includes('_') ? id.split('_') : [id, null];
        const dateOnly = dateIso ? dateIso.split('T')[0] : null;

        // Save current state for rollback
        const previousEvents = [...events];

        // Optimistic UI update
        if (dateOnly) {
            // Recurring instance: update parent's description locally
            setEvents(prev => prev.map(e => {
                if (e.id === realId) {
                    const existingDesc = e.description || '';
                    const newExclusion = existingDesc.includes('EXCLUDE:') 
                        ? (existingDesc.includes(dateOnly) ? existingDesc : `${existingDesc},${dateOnly}`)
                        : `${existingDesc} EXCLUDE:${dateOnly}`.trim();
                    return { ...e, description: newExclusion };
                }
                return e;
            }));
        } else {
            // Single event: remove completely
            setEvents(prev => prev.filter(e => e.id !== id));
        }

        try {
            if (dateOnly) {
                const parentEvent = previousEvents.find(e => e.id === realId);
                if (parentEvent) {
                    let newDesc = parentEvent.description || '';
                    if (newDesc.includes('EXCLUDE:')) {
                        if (!newDesc.includes(dateOnly)) {
                            newDesc = newDesc.replace(/EXCLUDE:([\d\-,]*)/, (m, p1) => `EXCLUDE:${p1 ? p1 + ',' : ''}${dateOnly}`);
                        }
                    } else {
                        newDesc = `${newDesc} EXCLUDE:${dateOnly}`.trim();
                    }

                    const res = await fetch(`/api/events`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: realId, description: newDesc }),
                    });

                    if (!res.ok) throw new Error("API Failure");
                }
            } else {
                const res = await fetch(`/api/events?id=${id}`, { method: 'DELETE' });
                if (!res.ok) throw new Error("API Failure");
            }
        } catch (error) {
            console.error("Delete Error:", error);
            setEvents(previousEvents); // Rollback
            alert("Matrix glitch: Failed to delete. Reverting...");
        }
    };

    // --- Drag & Drop Handlers ---

    const handleDragStart = (e: React.DragEvent, eventId: string) => {
        dragEventIdRef.current = eventId;
        setIsDragging(true);
        e.dataTransfer.effectAllowed = 'move';
        // Store ID as text for cross-component compat
        e.dataTransfer.setData('text/plain', eventId);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        setDragOverHour(null);
        dragEventIdRef.current = null;
    };

    const handleDragOver = (e: React.DragEvent, hourNum: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverHour(hourNum);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if leaving the row entirely (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverHour(null);
        }
    };

    const handleDrop = async (e: React.DragEvent, targetHour: Date) => {
        e.preventDefault();
        setDragOverHour(null);
        setIsDragging(false);

        const eventId = dragEventIdRef.current;
        if (!eventId) return;

        const event = events.find(ev => ev.id === eventId);
        if (!event) return;

        const oldStart = new Date(event.start);
        const oldEnd = new Date(event.end);

        // Don't do anything if dropped on the same hour
        if (oldStart.getHours() === targetHour.getHours() && isSameDay(oldStart, selectedDate)) return;

        // Build new start/end preserving duration
        const duration = oldEnd.getTime() - oldStart.getTime();
        const newStart = new Date(selectedDate);
        newStart.setHours(targetHour.getHours(), 0, 0, 0);
        const newEnd = new Date(newStart.getTime() + duration);

        // Optimistic UI update
        const previousEvents = [...events];
        setEvents(prev =>
            prev.map(ev =>
                ev.id === eventId
                    ? { ...ev, start: newStart.toISOString(), end: newEnd.toISOString() }
                    : ev
            )
        );

        try {
            const res = await fetch('/api/events', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: eventId,
                    start: newStart.toISOString(),
                    end: newEnd.toISOString(),
                }),
            });

            if (!res.ok) {
                // Rollback on failure
                setEvents(previousEvents);
                console.error('Failed to reschedule event');
            }
        } catch (err) {
            // Rollback on network error
            setEvents(previousEvents);
            console.error('Network error rescheduling event:', err);
        }

        dragEventIdRef.current = null;
    };

    const exportToICal = () => {
        const icalContent = generateICal(events);
        const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `calendar-export-${format(currentDate, 'yyyy-MM-dd')}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = () => {
        const summary = generateDaySummary(selectedDate, dayEvents);
        navigator.clipboard.writeText(summary).then(() => {
            alert('✓ Day summary copied to clipboard!\n\nReady for neural broadcast.');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('✗ Error jacking into clipboard.');
        });
    };

    return (
        <div className="flex flex-col min-h-full bg-transparent p-4 lg:p-6">
            {/* Legend & Intro */}
            <Legend />

            {/* Week Navigation */}
            <div className="flex items-center justify-between mb-4 border border-cyan-500/30 bg-black/80 rounded-2xl p-4 glow">
                <button onClick={goToPreviousWeek} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <ChevronLeft className="w-6 h-6 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10" />
                </button>
                <div className="text-center">
                    <h2 className="text-sm font-black text-cyan-400 uppercase tracking-[0.3em]">Temporal Range</h2>
                    <p className="text-xs text-cyan-100/60 font-mono mt-1">
                        {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </p>
                </div>
                <button onClick={goToNextWeek} className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                    <ChevronRight className="w-6 h-6 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10" />
                </button>
                <button
                    onClick={exportToICal}
                    className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors ml-2"
                    title="Export All to iCal"
                >
                    <Download className="w-6 h-6 border border-yellow-500/20 rounded-lg hover:bg-yellow-500/10" />
                </button>
                <button
                    onClick={handleShare}
                    className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors ml-2"
                    title="Share Day Summary"
                >
                    <Share2 className="w-6 h-6 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10" />
                </button>
            </div>

            {/* Day Tabs */}
            <nav className="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-2">
                {daysArr.map((day, idx) => (
                    <button
                        key={day.toISOString()}
                        onClick={() => setSelectedDay(idx)}
                        className={clsx(
                            'flex-1 min-w-[70px] px-3 py-3 rounded-xl text-center transition-all duration-300 border',
                            selectedDay === idx
                                ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                                : 'bg-black/60 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/10'
                        )}
                    >
                        <div className="text-[10px] font-black uppercase tracking-widest font-orbitron">{dayNames[idx]}</div>
                        <div className="text-lg font-mono font-bold leading-tight mt-1">{format(day, 'd')}</div>
                    </button>
                ))}
            </nav>

            {/* Schedule View */}
            <div className="flex-1 bg-black/60 border border-cyan-500/30 rounded-3xl glow scanlines">
                {hours.map(hour => {
                    const hourNum = hour.getHours();
                    const hourEvents = dayEvents.filter(e => new Date(e.start).getHours() === hourNum);

                    // Calculate dominant category
                    const categoryDurations: Record<string, number> = {};
                    hourEvents.forEach(e => {
                        if (e.segments && e.segments.length > 0) {
                            e.segments.forEach((s, i) => {
                                const nextOffset = e.segments![i + 1]?.offset ?? 60;
                                const dur = nextOffset - s.offset;
                                categoryDurations[s.category] = (categoryDurations[s.category] || 0) + dur;
                            });
                        } else {
                            // Assume full hour or whatever if no segments, but usually we have segments or 1 block
                            const cat = e.category || 'misc';
                            categoryDurations[cat] = (categoryDurations[cat] || 0) + 60;
                        }
                    });

                    let dominantCategory = 'misc';
                    let maxDuration = -1;
                    Object.entries(categoryDurations).forEach(([cat, dur]) => {
                        if (dur > maxDuration) {
                            maxDuration = dur;
                            dominantCategory = cat;
                        }
                    });

                    // If no events, default to misc/cyan
                    if (hourEvents.length === 0) dominantCategory = 'health'; // Use health (cyan) as default "empty" or just keep default styling

                    const catConfig = (CATEGORIES as any)[dominantCategory];
                    const timeColorClass = hourEvents.length > 0 ? catConfig.text : 'text-cyan-400';
                    const shadowColor = hourEvents.length > 0 ? (catConfig.hex) : 'rgba(34,211,238,0.5)';

                    return (
                        <div
                            key={hour.toISOString()}
                            className={clsx(
                                'group border-b border-cyan-500/10 transition-all duration-200',
                                dragOverHour === hourNum && isDragging
                                    ? 'bg-cyan-500/15 ring-1 ring-cyan-400/60 ring-inset shadow-[inset_0_0_12px_rgba(0,255,255,0.15)]'
                                    : 'hover:bg-cyan-500/5'
                            )}
                            onDragOver={(e) => handleDragOver(e, hourNum)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, hour)}
                        >
                            <div className="flex px-4 py-4 gap-4 items-start">
                                <div className={clsx(
                                    "w-20 text-sm font-black tracking-tighter pt-1 whitespace-nowrap font-orbitron transition-colors duration-300",
                                    timeColorClass
                                )}
                                    style={{
                                        filter: `drop-shadow(0 0 5px ${shadowColor})`
                                    }}
                                >
                                    {format(hour, 'hh:mm a')}
                                </div>

                                <div className="flex-1 flex flex-col gap-2">
                                    {hourEvents.length > 0 ? (
                                        hourEvents.map(event => {
                                            // Calculate gradient border logic
                                            // Handle legacy events (no segments) by synthesizing one
                                            const hasSegments = event.segments && event.segments.length > 0;
                                            const segmentsForBorder = hasSegments
                                                ? event.segments!
                                                : [{ label: event.title, category: event.category || 'misc', offset: 0 }];
                                            const borderGradient = generateBorderGradient(segmentsForBorder);

                                            // Generate dynamic display title with specific durations
                                            // e.g. "Meeting (45m) / Break (15m)"
                                            // If legacy (no segments), assume 60m? Or just show Title.
                                            let displayTitle = event.title;
                                            if (hasSegments) {
                                                const sorted = [...event.segments!].sort((a, b) => a.offset - b.offset);
                                                const parts: string[] = [];

                                                sorted.forEach((s, i) => {
                                                    if (s.label === '_FREE_') return;

                                                    const next = (i < sorted.length - 1) ? sorted[i + 1].offset : 60;
                                                    const dur = next - s.offset;

                                                    // Only append duration if it's not the full 60 (redundant?) 
                                                    // User said "keep the time on there".
                                                    parts.push(`${s.label} (${dur}m)`);
                                                });

                                                if (parts.length > 0) displayTitle = parts.join(' / ');
                                            }

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={clsx(
                                                        'relative animate-in slide-in-from-left-2 duration-300',
                                                        'cursor-grab active:cursor-grabbing',
                                                        dragEventIdRef.current === event.id
                                                            ? 'opacity-40 scale-95'
                                                            : 'opacity-100'
                                                    )}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, event.id)}
                                                    onDragEnd={handleDragEnd}
                                                    title="Drag to reschedule"
                                                >
                                                    <div className="rounded-r-lg p-3 bg-black/40 border border-cyan-500/30 relative overflow-hidden">
                                                        {/* Gradient Border Strip */}
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 w-1.5"
                                                            style={{ background: borderGradient }}
                                                        />

                                                        <div className="flex justify-between items-center pl-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="text-xs font-black text-cyan-100 uppercase tracking-wider font-orbitron">
                                                                    {displayTitle}
                                                                </div>
                                                                {event.recurrenceRule && (
                                                                    <span title={`Repeats ${event.recurrenceRule}`}>
                                                                        <Repeat size={14} className="text-cyan-400/70" data-testid="recurring-indicator" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex gap-1 ml-4">
                                                                <button
                                                                    onClick={() => openSegmentsModal(
                                                                        hour,
                                                                        hasSegments
                                                                            ? event.segments!
                                                                            : [{ label: event.title, category: event.category || 'misc', offset: 0 }],
                                                                        event.id,
                                                                        event.recurrenceRule as RecurrenceRule,
                                                                        event.recurrenceEnd ? new Date(event.recurrenceEnd) : null
                                                                    )}
                                                                    className="text-cyan-400/50 hover:text-cyan-400 transition-colors"
                                                                    title="Edit Subroutine"
                                                                >
                                                                    <Pencil size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                    className="text-red-400/50 hover:text-red-400 transition-colors"
                                                                    title="Delete Subroutine"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="text-sm font-bold text-cyan-400/30 italic font-mono py-2 opacity-50">
                                            // No data found for this temporal slot
                                        </div>
                                    )}
                                </div>

                                {/* Only show Add button if NOT full */}
                                {getButtonState(hourEvents.flatMap(e =>
                                    (e.segments && e.segments.length > 0)
                                        ? e.segments
                                        : [{ label: e.title || '', category: e.category || 'misc', offset: 0 }]
                                )) !== 'edit' && (
                                        <button
                                            onClick={() => openSegmentsModal(hour, [], null)}
                                            className={clsx(
                                                "transition-all duration-300 px-2 self-center hover:scale-110 active:scale-95 group-hover:block text-cyan-400"
                                            )}
                                            title="Add Segments"
                                        >
                                            <CirclePlus size={24} />
                                        </button>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            <SegmentsModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveSegments}
                initialSegments={activeSegments}
                initialRecurrenceRule={activeRecurrenceRule}
                initialRecurrenceEnd={activeRecurrenceEnd}
                time={activeHour ? format(activeHour, 'hh:mm a') : ''}
            />
        </div>
    );
}
