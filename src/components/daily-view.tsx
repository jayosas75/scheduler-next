'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { format, addDays, startOfWeek, eachHourOfInterval, isSameDay, isToday as isDateToday } from 'date-fns';
import { clsx } from 'clsx';
import type { Event as PrismaEvent } from '@prisma/client';
import { ChevronLeft, ChevronRight, Trash2, Pencil, CirclePlus, Settings, Repeat, CalendarDays } from 'lucide-react';
import { CATEGORIES, Segment, RecurrenceRule } from '@/types';
import Legend from './legend';
import SegmentsModal from './segments-modal';
import { generateEventTitle, generateBorderGradient, getButtonState, generateDaySummary } from '@/lib/calendar';
import { expandEvents } from '@/lib/recurrence-utils';
import { Share2 } from 'lucide-react';
import { playSound } from '@/lib/sound';
import FlipDate from './flip-date';
import EndOfNight from './end-of-night';

interface Event extends Omit<PrismaEvent, 'recurrenceRule' | 'recurrenceEnd' | 'start' | 'end'> {
    start: Date | string;
    end: Date | string;
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

    // Auto-scroll: bring the current hour near the top of the grid on load.
    const scrollRef = useRef<HTMLDivElement>(null);
    const currentHourRef = useRef<HTMLDivElement>(null);
    // Trailing space below the final hour so the current hour can sit near the
    // top (often 0 — see the measure effect). `ready` gates the scroll until
    // that space has been measured and applied.
    const [bottomSpacer, setBottomSpacer] = useState(0);
    const [scrollReady, setScrollReady] = useState(false);

    // Live Hour Progress state
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        // Update current time every 15 seconds for smooth progress
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 15000);
        return () => clearInterval(timer);
    }, []);

    // Add only as much trailing space as the current hour actually needs to
    // reach the top — no fixed buffer, so there's minimal dead space (e.g.
    // early-morning hours need none, since plenty of hours sit below them).
    useEffect(() => {
        const container = scrollRef.current;
        const row = currentHourRef.current;
        if (!container || !row) return;
        const gap = 12; // small "near top" offset, matches the scroll effect
        const rowTop =
            row.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop;
        // Extra space needed beyond the natural content (rows + sign-off art).
        const needed = rowTop - gap + container.clientHeight - container.scrollHeight;
        setBottomSpacer(Math.max(0, needed));
        setScrollReady(true);
    }, []);

    // Once the trailing space is applied, scroll the current hour near the top.
    useEffect(() => {
        if (!scrollReady) return;
        const container = scrollRef.current;
        const row = currentHourRef.current;
        if (!container || !row) return;
        const top =
            row.getBoundingClientRect().top -
            container.getBoundingClientRect().top +
            container.scrollTop -
            12; // small gap above so it reads as "near top", not flush
        container.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }, [scrollReady]);

    // The server seeds only the current week; fetch the full event set so
    // navigating to any week shows its one-off events and Export All covers everything.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/events');
                if (res.status === 401) {
                    alert("Your session has expired. Please sign in again.");
                    await signOut({ callbackUrl: '/login' });
                    return;
                }
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setEvents(data);
            } catch (err) {
                console.error('Failed to load events:', err);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const weekStart = startOfWeek(currentDate);
    const daysArr = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate 24 hours
    const hours = eachHourOfInterval({
        start: new Date(2024, 0, 1, 0, 0),
        end: new Date(2024, 0, 1, 23, 0),
    });

    const selectedDate = daysArr[selectedDay];

    // Live Hour Progress derived values
    const viewingToday = isDateToday(selectedDate);
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const progressPercent = (currentMinute / 60) * 100;

    // Determine if an event is past/active/future within the current hour
    const getEventTimeState = useCallback((event: { start: Date | string; segments?: Segment[] }): 'past' | 'active' | 'future' => {
        if (!viewingToday) return 'future'; // Not today, no dimming
        const eventStart = new Date(event.start);
        if (eventStart.getHours() !== currentHour) return 'future';

        const eventStartMinute = eventStart.getMinutes();

        // Calculate event end minute from segments
        let eventEndMinute = 60; // default: assume fills to end of hour
        if (event.segments && event.segments.length > 0) {
            const sorted = [...event.segments].sort((a, b) => a.offset - b.offset);
            const firstOffset = sorted[0].offset;
            const lastSeg = sorted[sorted.length - 1];
            // End = last segment offset + its duration (to next segment or 60)
            const lastDuration = 60 - lastSeg.offset;
            eventEndMinute = lastSeg.offset + lastDuration;
            // But also consider the event might not start at offset 0
            // The event occupies from its first segment offset to end
            if (currentMinute >= eventEndMinute) return 'past';
            if (currentMinute >= firstOffset) return 'active';
            return 'future';
        }

        // No segments — use the event start minute
        if (currentMinute >= eventStartMinute + 60) return 'past';
        if (currentMinute >= eventStartMinute) return 'active';
        return 'future';
    }, [viewingToday, currentHour, currentMinute]);

    // Filter events for selected day (including segments and expanded recurring instances)
    const expandedEvents = expandEvents(events as any, weekStart, addDays(weekStart, 7));
    const dayEvents = expandedEvents.filter(event =>
        isSameDay(new Date(event.start), selectedDate) && !event.deleted
    );

    const goToPreviousWeek = () => { playSound('click'); setCurrentDate(addDays(currentDate, -7)); };
    const goToNextWeek = () => { playSound('click'); setCurrentDate(addDays(currentDate, 7)); };
    const goToToday = () => {
        playSound('click');
        const today = new Date();
        setCurrentDate(today);
        setSelectedDay(today.getDay());
    };

    const openSegmentsModal = (hour: Date, existingSegments: Segment[] = [], eventId: string | null = null, recurrenceRule: RecurrenceRule = null, recurrenceEnd: Date | null = null) => {
        playSound('open');
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
            playSound('error');
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
                playSound('save');
            } else if (res.status === 401) {
                // Stale/orphaned session (e.g. user row removed after a DB reset):
                // the JWT is still valid but no longer maps to a user. Clear it and re-auth.
                alert("Your session has expired. Please sign in again.");
                await signOut({ callbackUrl: '/login' });
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
        playSound('pickup');
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

        playSound('drop');

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

    const handleShare = () => {
        playSound('click');
        const summary = generateDaySummary(selectedDate, dayEvents);
        navigator.clipboard.writeText(summary).then(() => {
            alert('✓ Day summary copied to clipboard!\n\nReady for neural broadcast.');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('✗ Error jacking into clipboard.');
        });
    };

    // One designated color per weekday (Sun → Sat). Aligned to the six neon
    // theme accents plus a glowing white, for seven distinct day colors.
    const dayColors = [
        // Sun — Cyber Cyan
        { activeBg: 'bg-[#00ffff]', activeText: 'text-black', activeBorder: 'border-[#00ffff]', shadow: 'shadow-[0_0_15px_rgba(0,255,255,0.45)]', inactiveText: 'text-[#00ffff]', inactiveBorder: 'border-[#00ffff]/30', hoverBg: 'hover:bg-[#00ffff]/10' },
        // Mon — Matrix Green
        { activeBg: 'bg-[#00ff9c]', activeText: 'text-black', activeBorder: 'border-[#00ff9c]', shadow: 'shadow-[0_0_15px_rgba(0,255,156,0.45)]', inactiveText: 'text-[#00ff9c]', inactiveBorder: 'border-[#00ff9c]/30', hoverBg: 'hover:bg-[#00ff9c]/10' },
        // Tue — Tokyo Pink
        { activeBg: 'bg-[#ff2e88]', activeText: 'text-black', activeBorder: 'border-[#ff2e88]', shadow: 'shadow-[0_0_15px_rgba(255,46,136,0.45)]', inactiveText: 'text-[#ff2e88]', inactiveBorder: 'border-[#ff2e88]/30', hoverBg: 'hover:bg-[#ff2e88]/10' },
        // Wed — Cyberpunk Yellow
        { activeBg: 'bg-[#fcee0a]', activeText: 'text-black', activeBorder: 'border-[#fcee0a]', shadow: 'shadow-[0_0_15px_rgba(252,238,10,0.45)]', inactiveText: 'text-[#fcee0a]', inactiveBorder: 'border-[#fcee0a]/30', hoverBg: 'hover:bg-[#fcee0a]/10' },
        // Thu — Synth Purple
        { activeBg: 'bg-[#b026ff]', activeText: 'text-white', activeBorder: 'border-[#b026ff]', shadow: 'shadow-[0_0_15px_rgba(176,38,255,0.45)]', inactiveText: 'text-[#b026ff]', inactiveBorder: 'border-[#b026ff]/30', hoverBg: 'hover:bg-[#b026ff]/10' },
        // Fri — Blood Orange
        { activeBg: 'bg-[#ff5e1a]', activeText: 'text-black', activeBorder: 'border-[#ff5e1a]', shadow: 'shadow-[0_0_15px_rgba(255,94,26,0.45)]', inactiveText: 'text-[#ff5e1a]', inactiveBorder: 'border-[#ff5e1a]/30', hoverBg: 'hover:bg-[#ff5e1a]/10' },
        // Sat — Glow White
        { activeBg: 'bg-white', activeText: 'text-black', activeBorder: 'border-white', shadow: 'shadow-[0_0_18px_rgba(255,255,255,0.6)]', inactiveText: 'text-white', inactiveBorder: 'border-white/40', hoverBg: 'hover:bg-white/10' },
    ];

    const getColor = (idx: number) => dayColors[idx % dayColors.length];

    return (
        <div className="flex flex-col min-h-full bg-transparent p-4 lg:p-6">
            {/* Legend & Intro */}
            <Legend />

            {/* Week Navigation */}
            <div className={clsx(
                "grid grid-cols-[1fr_auto_1fr] items-center mb-4 border bg-black/80 rounded-2xl p-4 glow transition-colors duration-500",
                getColor(selectedDay).inactiveBorder
            )}>
                {/* Left controls */}
                <div className="flex items-center gap-1 justify-self-start">
                    <button onClick={goToToday} className={clsx("p-2 transition-colors", getColor(selectedDay).inactiveText, getColor(selectedDay).hoverBg.replace('bg-', 'text-'))} title="Jump to Today">
                        <CalendarDays className="w-6 h-6 border rounded-lg border-current" />
                    </button>
                    <button onClick={goToPreviousWeek} className={clsx("p-2 transition-colors", getColor(selectedDay).inactiveText, getColor(selectedDay).hoverBg.replace('bg-', 'text-'))} title="Previous week">
                        <ChevronLeft className="w-6 h-6 border rounded-lg border-current" />
                    </button>
                </div>

                {/* Centered Temporal Range + flip clock */}
                <div className="text-center px-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-white mb-2">Temporal Range</h2>
                    <FlipDate start={weekStart} end={addDays(weekStart, 6)} />
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-2 justify-self-end">
                    <button onClick={goToNextWeek} className={clsx("p-2 transition-colors", getColor(selectedDay).inactiveText, getColor(selectedDay).hoverBg.replace('bg-', 'text-'))} title="Next week">
                        <ChevronRight className="w-6 h-6 border rounded-lg border-current" />
                    </button>
                    <button
                        onClick={handleShare}
                        className="p-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                        title="Share Day Summary"
                    >
                        <Share2 className="w-6 h-6 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/10" />
                    </button>
                </div>
            </div>

            {/* Day Tabs */}
            <nav className="flex overflow-x-auto gap-2 mb-6 no-scrollbar pb-2">
                {daysArr.map((day, idx) => {
                    const c = getColor(idx);
                    return (
                        <button
                            key={day.toISOString()}
                            onClick={() => { playSound('click'); setSelectedDay(idx); }}
                            className={clsx(
                                'flex-1 min-w-[70px] px-3 py-3 rounded-xl text-center transition-all duration-300 border',
                                selectedDay === idx
                                    ? `${c.activeBg} ${c.activeText} ${c.activeBorder} ${c.shadow}`
                                    : `bg-black/60 ${c.inactiveText} ${c.inactiveBorder} ${c.hoverBg}`
                            )}
                        >
                            <div className="text-[10px] font-black uppercase tracking-widest font-orbitron">{dayNames[idx]}</div>
                            <div className="text-lg font-mono font-bold leading-tight mt-1">{format(day, 'd')}</div>
                        </button>
                    );
                })}
            </nav>

            {/* Schedule View */}
            <div ref={scrollRef} className={clsx(
                "neon-scroll flex-1 bg-black/60 border rounded-3xl glow scanlines overflow-y-auto h-[65vh] max-h-[650px] transition-colors duration-500",
                getColor(selectedDay).inactiveBorder
            )}>
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
                            ref={hourNum === currentHour ? currentHourRef : null}
                            className={clsx(
                                'group border-b border-cyan-500/10 transition-all duration-200 relative overflow-hidden',
                                dragOverHour === hourNum && isDragging
                                    ? 'bg-cyan-500/15 ring-1 ring-cyan-400/60 ring-inset shadow-[inset_0_0_12px_rgba(var(--accent-rgb),0.15)]'
                                    : 'hover:bg-cyan-500/5',
                                viewingToday && hourNum === currentHour && 'hour-progress-active'
                            )}
                            onDragOver={(e) => handleDragOver(e, hourNum)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, hour)}
                        >
                            {/* Live Hour Progress Overlay + Scanline */}
                            {viewingToday && hourNum === currentHour && (
                                <>
                                    {/* Progress sweep - fills from top */}
                                    <div
                                        className="absolute inset-x-0 top-0 pointer-events-none z-[1] transition-all duration-[15s] ease-linear"
                                        style={{
                                            height: `${progressPercent}%`,
                                            background: 'linear-gradient(to bottom, rgba(var(--accent-rgb), 0.06) 0%, rgba(var(--accent-rgb), 0.03) 70%, rgba(var(--accent-rgb), 0.08) 100%)',
                                        }}
                                    />
                                    {/* Scanline - the "now" marker */}
                                    <div
                                        className="absolute inset-x-0 h-[2px] pointer-events-none z-[2] scanline-now transition-all duration-[15s] ease-linear"
                                        style={{
                                            top: `${progressPercent}%`,
                                            background: 'linear-gradient(90deg, transparent 0%, rgba(var(--accent-rgb), 0.3) 10%, rgba(var(--accent-rgb), 1) 30%, rgba(255, 255, 255, 1) 50%, rgba(var(--accent-rgb), 1) 70%, rgba(var(--accent-rgb), 0.3) 90%, transparent 100%)',
                                        }}
                                    />
                                </>
                            )}

                            <div className="flex px-4 py-4 gap-4 items-start relative z-[3]">
                                <div className={clsx(
                                    "w-20 text-sm font-bold tracking-tight pt-1 whitespace-nowrap font-mono transition-colors duration-300",
                                    timeColorClass,
                                    viewingToday && hourNum === currentHour && 'time-label-active'
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
                                                            : 'opacity-100',
                                                        // Live Hour Progress: dim past, highlight active
                                                        viewingToday && hourNum === currentHour && getEventTimeState(event) === 'past' && 'event-past',
                                                    )}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, event.id)}
                                                    onDragEnd={handleDragEnd}
                                                    title="Drag to reschedule"
                                                >
                                                    <div className={clsx(
                                                        'rounded-r-lg p-3 bg-black/40 border border-cyan-500/30 relative overflow-hidden',
                                                        viewingToday && hourNum === currentHour && getEventTimeState(event) === 'active' && 'event-active',
                                                    )}>
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
                                                                    onClick={() => { playSound('delete'); handleDeleteEvent(event.id); }}
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
                                    ) : null}
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
                {/* End-of-night sign-off, then only as much trailing space as the
                    current hour needs to reach the top (often zero). */}
                <EndOfNight />
                <div aria-hidden="true" style={{ height: bottomSpacer }} />
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
