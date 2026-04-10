import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-dev-secret'
);
const COOKIE_NAME = 'ws_token';

export interface JWTPayload {
  userId: string;
  username?: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(payload: JWTPayload) {
  const token = await signToken(payload);
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
}

export async function clearAuthCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function getAuthFromCookie(): Promise<JWTPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Resolve the current user from JWT cookie or x-guest-id header.
 * For guests, upserts a User row keyed by guestId.
 */
export async function resolveUser(request: Request) {
  // Try JWT cookie first
  const auth = await getAuthFromCookie();
  if (auth) {
    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (user) return user;
  }

  // Fall back to guest ID header
  const guestId = request.headers.get('x-guest-id');
  if (!guestId) return null;

  return prisma.user.upsert({
    where: { guestId },
    update: {},
    create: { guestId },
  });
}
