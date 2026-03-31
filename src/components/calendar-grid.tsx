'use client';

import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { clsx } from 'clsx';
import type { Event } from '@prisma/client';

interface CalendarGridProps {
    events: Event[];
    year: number;
    month: number;
}

export default function CalendarGrid({ events, year, month }: CalendarGridProps) {
    const date = new Date(year, month, 1);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    // Get all days including padding from previous/next month
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Group events by day
    const eventsByDay = new Map<string, Event[]>();
    events.forEach(event => {
        const dayKey = format(event.start, 'yyyy-MM-dd');
        if (!eventsByDay.has(dayKey)) {
            eventsByDay.set(dayKey, []);
        }
        eventsByDay.get(dayKey)!.push(event);
    });

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-blue-50 to-violet-50 border-b border-gray-200">
                {weekDays.map(day => (
                    <div key={day} className="p-3 text-center font-bold text-sm text-gray-700 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr min-h-[600px]">
                {days.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const dayEvents = eventsByDay.get(dayKey) || [];
                    const isCurrentMonth = isSameMonth(day, date);
                    const isCurrentDay = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={clsx(
                                'border-r border-b border-gray-100 p-2 min-h-[120px] transition-all hover:bg-gray-50',
                                !isCurrentMonth && 'bg-gray-50/50 text-gray-400',
                                isCurrentDay && 'bg-blue-50/50 ring-2 ring-inset ring-blue-400'
                            )}
                        >
                            <div className="flex flex-col h-full">
                                <div className={clsx(
                                    'text-sm font-semibold mb-2',
                                    isCurrentDay && 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center',
                                    !isCurrentDay && isCurrentMonth && 'text-gray-900',
                                    !isCurrentMonth && 'text-gray-400'
                                )}>
                                    {format(day, 'd')}
                                </div>

                                <div className="flex-1 space-y-1 overflow-y-auto">
                                    {dayEvents.slice(0, 3).map(event => (
                                        <div
                                            key={event.id}
                                            className="text-xs px-2 py-1 rounded bg-gradient-to-r from-blue-500 to-violet-500 text-white truncate shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                            title={event.title}
                                        >
                                            {event.allDay ? '📅' : format(event.start, 'h:mm a')} {event.title}
                                        </div>
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-xs text-gray-500 font-medium pl-2">
                                            +{dayEvents.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
