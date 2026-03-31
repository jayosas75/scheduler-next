
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getEvents(start: Date, end: Date) {
    const session = await auth();
    if (!session?.user?.email) return [];
    // We need userId. Our config doesn't always populate id in session callback by default unless we add it. 
    // But let's assume we can fetch by email or we updated the session callback.
    // Standard next-auth session usually has user.email.
    // Better to fetch user first.

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
    });

    if (!user) return [];

    const events = await prisma.event.findMany({
        where: {
            userId: user.id,
            start: {
                gte: start,
            },
            end: {
                lte: end, // Overlap logic might be needed but simple range for now
            }
        },
        orderBy: { start: 'asc' },
    });
    return events;
}
