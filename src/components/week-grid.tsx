'use client';

import { eachHourOfInterval, format, addDays } from 'date-fns';
import type { Event } from '@prisma/client';

interface WeekGridProps {
    events: Event[];
    startDate: Date;
}

export default function WeekGrid({ events, startDate }: WeekGridProps) {
    // Generate 7 days starting from startDate
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    // Generate hours (6 AM to 10 PM)
    const hours = eachHourOfInterval({
        start: new Date(2024, 0, 1, 6, 0),
        end: new Date(2024, 0, 1, 22, 0),
    });

    // Group events by day and hour
    const eventsByDayHour = new Map<string, Event[]>();
    events.forEach(event => {
        const key = `${format(event.start, 'yyyy-MM-dd')}-${format(event.start, 'HH')}`;
        if (!eventsByDayHour.has(key)) {
            eventsByDayHour.set(key, []);
        }
        eventsByDayHour.get(key)!.push(event);
    });

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header with Days */}
            <div className="grid grid-cols-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-violet-50 sticky top-0 z-10">
                <div className="p-4 border-r border-gray-200 font-bold text-sm text-gray-500">Time</div>
                {days.map(day => (
                    <div key={day.toISOString()} className="p-4 text-center border-r border-gray-200 last:border-r-0">
                        <div className="font-bold text-gray-900">{format(day, 'EEE')}</div>
                        <div className="text-2xl font-bold text-gray-700 mt-1">{format(day, 'd')}</div>
                        <div className="text-xs text-gray-500">{format(day, 'MMM')}</div>
                    </div>
                ))}
            </div>

            {/* Time Grid */}
            <div className="overflow-auto max-h-[calc(100vh-300px)]">
                {hours.map(hour => (
                    <div key={hour.toISOString()} className="grid grid-cols-8 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                        <div className="p-3 border-r border-gray-200 text-sm font-medium text-gray-600 bg-gray-50/50">
                            {format(hour, 'h:mm a')}
                        </div>
                        {days.map(day => {
                            const key = `${format(day, 'yyyy-MM-dd')}-${format(hour, 'HH')}`;
                            const hourEvents = eventsByDayHour.get(key) || [];

                            return (
                                <div
                                    key={`${day.toISOString()}-${hour.toISOString()}`}
                                    className="p-2 border-r border-gray-100 last:border-r-0 min-h-[60px] relative group"
                                >
                                    {hourEvents.map(event => (
                                        <div
                                            key={event.id}
                                            className="mb-1 text-xs px-2 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-violet-500 text-white shadow-sm hover:shadow-md transition-all cursor-pointer truncate"
                                            title={`${event.title}\n${event.description || ''}`}
                                        >
                                            <div className="font-semibold">{event.title}</div>
                                            {event.location && (
                                                <div className="text-[10px] opacity-90 truncate">📍 {event.location}</div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Hover state for adding events */}
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                        <div className="w-full h-full border-2 border-dashed border-blue-300 rounded"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
}
