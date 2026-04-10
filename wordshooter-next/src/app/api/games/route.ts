import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { resolveUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const {
      mode,
      score,
      durationMs,
      totalChars = 0,
      correctChars = 0,
      incorrectAttempts = 0,
      missedWords = 0,
      maxCombo = 0,
      mathSolved = 0,
      mathTotalTime = 0,
      journeyStats = null,
      wpm = 0,
      accuracy = 0,
      isMultiplayer = false,
      playerName,
    } = body;

    if (!mode || score === undefined || !durationMs) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Update displayName if provided
    if (playerName && typeof playerName === 'string' && playerName.trim()) {
      await prisma.user.update({
        where: { id: user.id },
        data: { displayName: playerName.trim() },
      });
    }

    const record = await prisma.gameRecord.create({
      data: {
        userId: user.id,
        mode,
        score,
        durationMs,
        totalChars,
        correctChars,
        incorrectAttempts,
        missedWords,
        maxCombo,
        mathSolved,
        mathTotalTime,
        journeyStats: journeyStats ? JSON.stringify(journeyStats) : null,
        wpm,
        accuracy,
        isMultiplayer,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (error) {
    console.error('Save game error:', error);
    return NextResponse.json({ error: 'Failed to save game' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const records = await prisma.gameRecord.findMany({
      where: {
        userId: user.id,
        ...(mode ? { mode } : {}),
      },
      orderBy: { playedAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Get games error:', error);
    return NextResponse.json({ error: 'Failed to get games' }, { status: 500 });
  }
}
