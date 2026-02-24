import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password, guestId } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    if (username.length < 3 || username.length > 20) {
      return NextResponse.json({ error: 'Username must be 3-20 characters' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 });
    }

    // Check if username already taken
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let user;

    // If guestId provided, upgrade the existing guest user
    if (guestId) {
      const guestUser = await prisma.user.findUnique({ where: { guestId } });
      if (guestUser) {
        user = await prisma.user.update({
          where: { id: guestUser.id },
          data: { username, passwordHash, displayName: username, guestId: null },
        });
      }
    }

    // If no guest upgrade happened, create new user
    if (!user) {
      user = await prisma.user.create({
        data: { username, passwordHash, displayName: username },
      });
    }

    await setAuthCookie({ userId: user.id, username: user.username! });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
