
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TimeSlot } from '@/types';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const day = searchParams.get('day');

    if (!day) {
        return NextResponse.json({ error: 'Day is required' }, { status: 400 });
    }

    try {
        const schedule = await prisma.daySchedule.findUnique({
            where: { dayName: day },
            include: {
                slots: {
                    include: { segments: true },
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!schedule) {
            return NextResponse.json([]);
        }

        const formattedSlots = schedule.slots.map(slot => ({
            id: slot.id,
            time: slot.time,
            label: slot.label || '',
            category: slot.category,
            deleted: slot.deleted,
            segments: slot.segments.map(s => ({
                id: s.id,
                offset: s.offset,
                label: s.label,
                category: s.category
            })).sort((a, b) => a.offset - b.offset)
        }));

        return NextResponse.json(formattedSlots);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { day, slots } = body;

        if (!day || !slots) {
            return NextResponse.json({ error: 'Missing day or slots' }, { status: 400 });
        }

        await prisma.$transaction(async (tx) => {
            let daySchedule = await tx.daySchedule.findUnique({
                where: { dayName: day }
            });

            if (!daySchedule) {
                daySchedule = await tx.daySchedule.create({
                    data: { dayName: day }
                });
            }

            // Delete existing slots
            const existingSlots = await tx.timeSlot.findMany({
                where: { dayScheduleId: daySchedule.id },
                select: { id: true }
            });
            const slotIds = existingSlots.map(s => s.id);

            if (slotIds.length > 0) {
                await tx.segment.deleteMany({
                    where: { timeSlotId: { in: slotIds } }
                });
                await tx.timeSlot.deleteMany({
                    where: { id: { in: slotIds } }
                });
            }

            // Create new
            for (const slot of slots) {
                const createdSlot = await tx.timeSlot.create({
                    data: {
                        time: slot.time,
                        label: slot.label,
                        category: slot.category || 'misc',
                        deleted: slot.deleted || false,
                        dayScheduleId: daySchedule.id
                    }
                });

                if (slot.segments && slot.segments.length > 0) {
                    await tx.segment.createMany({
                        data: slot.segments.map((seg: any) => ({
                            offset: seg.offset,
                            label: seg.label,
                            category: seg.category || 'misc',
                            timeSlotId: createdSlot.id
                        }))
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
    }
}
