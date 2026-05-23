import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const KEY = 'unique_visitors';

export async function GET() {
    try {
        const state = await prisma.globalState.findUnique({ where: { key: KEY } });
        return NextResponse.json({ count: state ? parseInt(state.value) : 0 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ count: 0 });
    }
}

export async function POST() {
    try {
        const count = await prisma.$transaction(async (tx) => {
            const state = await tx.globalState.findUnique({ where: { key: KEY } });
            const newValue = (state ? parseInt(state.value) : 0) + 1;
            await tx.globalState.upsert({
                where: { key: KEY },
                update: { value: newValue.toString() },
                create: { key: KEY, value: newValue.toString() },
            });
            return newValue;
        });
        return NextResponse.json({ count });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ count: 0 }, { status: 500 });
    }
}
