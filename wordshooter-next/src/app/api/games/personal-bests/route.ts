import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const bests = await prisma.gameRecord.groupBy({
      by: ['mode'],
      where: { userId: user.id },
      _max: { score: true, wpm: true, accuracy: true, maxCombo: true },
      _count: { id: true },
    });

    const result = bests.map((b) => ({
      mode: b.mode,
      bestScore: b._max.score,
      bestWpm: b._max.wpm,
      bestAccuracy: b._max.accuracy,
      bestCombo: b._max.maxCombo,
      gamesPlayed: b._count.id,
    }));

    return NextResponse.json({ personalBests: result });
  } catch (error) {
    console.error('Personal bests error:', error);
    return NextResponse.json({ error: 'Failed to get personal bests' }, { status: 500 });
  }
}
