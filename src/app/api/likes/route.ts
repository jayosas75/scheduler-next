
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const state = await prisma.globalState.findUnique({
            where: { key: 'total_likes' }
        });
        return NextResponse.json({ count: state ? parseInt(state.value) : 0 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ count: 0 });
    }
}

export async function POST(request: Request) {
    try {
        // Increment atomically not fully supported by standard find/update logic easily without raw SQL or proper transaction logic for concurrency, 
        // but for this app simple read-modify-write in transaction is okay, or just trust the latest write.
        // Better: atomic update if prisma supports it.
        // Prisma support atomic increment on Int fields, but we stored value as String in schema.
        // Let's just do read-write.

        const count = await prisma.$transaction(async (tx) => {
            const state = await tx.globalState.findUnique({
                where: { key: 'total_likes' }
            });
            const current = state ? parseInt(state.value) : 0;
            const newValue = current + 1;

            await tx.globalState.upsert({
                where: { key: 'total_likes' },
                update: { value: newValue.toString() },
                create: { key: 'total_likes', value: newValue.toString() }
            });

            return newValue;
        });

        return NextResponse.json({ count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
