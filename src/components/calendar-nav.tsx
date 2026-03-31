'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getYear, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, format } from 'date-fns';
import { clsx } from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarNav() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const now = new Date();
    const paramYear = searchParams.get('year');
    const paramMonth = searchParams.get('month');

    const currentYear = paramYear ? parseInt(paramYear) : getYear(now);
    const currentMonth = paramMonth ? parseInt(paramMonth) : now.getMonth();

    const date = new Date(currentYear, currentMonth, 1);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const updateParams = (updates: Record<string, string | null>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(updates).forEach(([key, value]) => {
            if (value === null) params.delete(key);
            else params.set(key, value);
        });
        router.push(`${pathname}?${params.toString()}`);
    }

    const handleYearChange = (increment: number) => {
        updateParams({ year: (currentYear + increment).toString() });
    }

    const handleMonthClick = (index: number) => {
        updateParams({ month: index.toString(), week: null }); // Reset week when changing month
    }

    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const weeks = eachWeekOfInterval({
        start: startOfWeek(monthStart),
        end: endOfWeek(monthEnd)
    });

    const paramWeekStart = searchParams.get('week');

    return (
        <div className="flex flex-col space-y-4 p-4 bg-white border-b shadow-md z-40">
            {/* Year Selector */}
            <div className="flex items-center justify-between md:justify-center space-x-4">
                <button onClick={() => handleYearChange(-1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold font-sans tracking-tight text-gray-900">{currentYear}</h2>
                <button onClick={() => handleYearChange(1)} className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Month Tabs */}
            <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar md:justify-center">
                {months.map((m, i) => (
                    <button
                        key={m}
                        onClick={() => handleMonthClick(i)}
                        className={clsx(
                            "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                            currentMonth === i
                                ? "bg-blue-600 text-white shadow-lg scale-105"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                        )}
                    >
                        {m}
                    </button>
                ))}
            </div>

            {/* Week Tabs */}
            <div className="flex overflow-x-auto gap-3 pb-2 pt-2 border-t border-gray-100 no-scrollbar md:justify-center">
                <button
                    onClick={() => updateParams({ week: null })}
                    className={clsx(
                        "flex flex-col items-center justify-center px-4 py-2 rounded-lg text-xs font-medium transition-all border min-w-[100px]",
                        !paramWeekStart
                            ? "bg-violet-50 text-violet-700 border-violet-200 shadow-sm"
                            : "text-gray-500 border-transparent hover:bg-gray-50 hover:border-gray-200"
                    )}
                >
                    <span className="uppercase tracking-wider opacity-90">All Month</span>
                </button>
                {weeks.map((weekStart, i) => {
                    const isSelected = paramWeekStart === weekStart.toISOString();
                    const label = `Week ${i + 1}`;
                    const rangeLabel = `${format(weekStart, 'MMM d')} - ${format(endOfWeek(weekStart), 'd')}`;

                    return (
                        <button
                            key={weekStart.toISOString()}
                            onClick={() => updateParams({ week: weekStart.toISOString() })}
                            className={clsx(
                                "flex flex-col items-center justify-center px-4 py-2 rounded-lg text-xs font-medium transition-all border whitespace-nowrap min-w-[120px]",
                                isSelected
                                    ? "bg-white ring-2 ring-violet-600 text-violet-700 shadow-sm border-transparent"
                                    : "bg-white text-gray-500 border-gray-200 hover:border-gray-300 hover:text-gray-700"
                            )}
                        >
                            <span className="block opacity-60 text-[10px] uppercase font-bold tracking-wider mb-0.5">{label}</span>
                            <span className="text-sm">{rangeLabel}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
