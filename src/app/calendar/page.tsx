
import DailyView from '@/components/daily-view';
import { getEvents } from '@/lib/data';
import { startOfWeek, endOfWeek } from 'date-fns';

export default async function CalendarPage() {
    const now = new Date();

    // Get events for current week
    const start = startOfWeek(now);
    const end = endOfWeek(now);

    const events = await getEvents(start, end);

    return (
        <div className="flex flex-col min-h-[calc(100vh-64px)]">
            <DailyView events={events} initialDate={now} />
        </div>
    );
}
