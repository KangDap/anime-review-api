import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

export type AuthUserPayload = {
  userId: number;
  email?: string;
  role?: 'USER' | 'ADMIN';
  iat?: number;
  exp?: number;
};

type RequireAuthOptions = {
  adminOnly?: boolean;
};

type RequireAuthResult =
  | { user: AuthUserPayload; response?: never }
  | { user?: never; response: NextResponse };

function unauthorized(message: string): RequireAuthResult {
  return {
    response: NextResponse.json({ error: message }, { status: 401 }),
  };
}

export function requireAuth(
  request: NextRequest,
  options: RequireAuthOptions = {}
): RequireAuthResult {
  const authorization = request.headers.get('authorization') ?? undefined;
  const token = extractTokenFromHeader(authorization);

  if (!token) {
    return unauthorized('Unauthorized: missing or invalid Authorization header');
  }

  try {
    const payload = verifyToken(token);

    if (typeof payload.userId !== 'number') {
      return unauthorized('Unauthorized: invalid token payload');
    }

    const user: AuthUserPayload = {
      userId: payload.userId,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      role: payload.role === 'ADMIN' || payload.role === 'USER' ? payload.role : undefined,
      iat: typeof payload.iat === 'number' ? payload.iat : undefined,
      exp: typeof payload.exp === 'number' ? payload.exp : undefined,
    };

    if (options.adminOnly && user.role !== 'ADMIN') {
      return {
        response: NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 }),
      };
    }

    return { user };
  } catch {
    return unauthorized('Unauthorized: invalid or expired token');
  }
}
