
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import ICAL from "ical.js";

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
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ message: "No file provided" }, { status: 400 });
        }

        const text = await file.text();

        // Parse ICS file
        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents("vevent");

        const events = vevents.map((vevent) => {
            const event = new ICAL.Event(vevent);

            return {
                title: event.summary || "Untitled Event",
                description: event.description || null,
                start: event.startDate.toJSDate(),
                end: event.endDate.toJSDate(),
                allDay: Boolean(event.startDate.isDate),
                location: event.location || null,
                userId: user.id,
            };
        });

        // Bulk create events
        const result = await prisma.event.createMany({
            data: events,
        });

        return NextResponse.json(
            {
                message: `Successfully imported ${result.count} events`,
                count: result.count
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Import Error:", error);
        return NextResponse.json(
            { message: "Failed to import calendar", error: String(error) },
            { status: 500 }
        );
    }
}
