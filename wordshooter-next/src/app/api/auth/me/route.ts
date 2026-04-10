import { NextResponse } from 'next/server';
import { getAuthFromCookie } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await getAuthFromCookie();
    if (!auth) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, username: true, displayName: true, guestId: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json({ user: null });
  }
}
