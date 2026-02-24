import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'words';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const records = await prisma.gameRecord.findMany({
      where: { mode },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        user: {
          select: { username: true, displayName: true },
        },
      },
    });

    const leaderboard = records.map((r, i) => ({
      rank: i + 1,
      score: r.score,
      wpm: r.wpm,
      accuracy: r.accuracy,
      maxCombo: r.maxCombo,
      displayName: r.user.displayName || r.user.username || 'Guest',
      playedAt: r.playedAt,
    }));

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Failed to get leaderboard' }, { status: 500 });
  }
}
