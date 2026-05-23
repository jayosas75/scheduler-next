
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const eventSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    start: z.string().datetime(),
    end: z.string().datetime(),
    allDay: z.boolean().optional(),
    location: z.string().optional(),
    category: z.string().optional(),
    recurrenceRule: z.enum(['daily', 'weekly', 'monthly']).optional().nullable(),
    recurrenceEnd: z.string().datetime().optional().nullable(),
    segments: z.array(z.object({
        offset: z.number(),
        label: z.string(),
        category: z.string(),
    })).optional(),
});

const patchSchema = z.object({
    id: z.string().min(1),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    description: z.string().optional(),
});

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Session expired. Please sign in again." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const data = eventSchema.parse(body);

        const eventData: any = {
            title: data.title,
            description: data.description,
            start: new Date(data.start),
            end: new Date(data.end),
            allDay: data.allDay || false,
            location: data.location,
            category: data.category || 'misc',
            recurrenceRule: data.recurrenceRule || null,
            recurrenceEnd: data.recurrenceEnd ? new Date(data.recurrenceEnd) : null,
            userId: user.id,
        };

        if (data.segments && data.segments.length > 0) {
            eventData.segments = {
                create: data.segments.map((s: any) => ({
                    offset: s.offset,
                    label: s.label,
                    category: s.category,
                }))
            };
        }

        const event = await prisma.event.create({
            data: eventData,
            include: {
                segments: true,
            }
        });

        return NextResponse.json(event, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Event Creation Error:", error);
        return NextResponse.json(
            { message: "Failed to create event" },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Session expired. Please sign in again." },
                { status: 401 }
            );
        }

        const events = await prisma.event.findMany({
            where: { userId: user.id },
            include: { segments: true },
            orderBy: { start: 'asc' },
        });

        return NextResponse.json(events);
    } catch (error) {
        console.error("Fetch Events Error:", error);
        return NextResponse.json(
            { message: "Failed to fetch events" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Session expired. Please sign in again." },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ message: "Missing event id" }, { status: 400 });
        }

        // Verify the event belongs to this user before deleting
        const existing = await prisma.event.findFirst({
            where: { id, userId: user.id },
        });

        if (!existing) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        await prisma.event.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Event deleted" });
    } catch (error) {
        console.error("Delete Event Error:", error);
        return NextResponse.json(
            { message: "Failed to delete event" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
        });

        if (!user) {
            return NextResponse.json(
                { message: "Session expired. Please sign in again." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const data = patchSchema.parse(body);

        // Verify the event belongs to this user before updating
        const existing = await prisma.event.findFirst({
            where: { id: data.id, userId: user.id },
        });

        if (!existing) {
            return NextResponse.json({ message: "Event not found" }, { status: 404 });
        }

        const updated = await prisma.event.update({
            where: { id: data.id },
            data: {
                ...(data.start && { start: new Date(data.start) }),
                ...(data.end && { end: new Date(data.end) }),
                ...(data.description !== undefined && { description: data.description }),
            },
            include: { segments: true },
        });

        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Invalid input", errors: error.issues },
                { status: 400 }
            );
        }
        console.error("Patch Event Error:", error);
        return NextResponse.json(
            { message: "Failed to update event" },
            { status: 500 }
        );
    }
}
