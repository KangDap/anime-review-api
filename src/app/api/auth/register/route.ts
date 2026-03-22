import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

type RegisterBody = {
  username?: unknown;
  email?: unknown;
  password?: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sanitizeUser(user: {
  id: number;
  username: string;
  email: string;
  role: 'USER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateRegisterInput(body: RegisterBody): string | null {
  const { username, email, password } = body;

  if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return 'username, email, and password are required';
  }

  const trimmedUsername = username.trim();
  const trimmedEmail = email.trim();

  if (!trimmedUsername || !trimmedEmail || !password) {
    return 'username, email, and password are required';
  }

  if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
    return 'username must be between 3 and 30 characters';
  }

  const usernamePattern = /^[a-zA-Z0-9_]+$/;
  if (!usernamePattern.test(trimmedUsername)) {
    return 'username can only contain letters, numbers, and underscores';
  }

  const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return 'email must be a valid email address';
  }

  if (password.length < 8 || password.length > 72) {
    return 'password must be between 8 and 72 characters';
  }

  return null;
}

// POST /api/auth/register
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegisterBody;
    const validationError = validateRegisterInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const username = (body.username as string).trim();
    const email = normalizeEmail(body.email as string);
    const password = body.password as string;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return NextResponse.json({ error: 'username is already in use' }, { status: 409 });
      }

      if (existingUser.email === email) {
        return NextResponse.json({ error: 'email is already in use' }, { status: 409 });
      }
    }

    const passwordHash = await hashPassword(password);

    const createdUser = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const safeUser = sanitizeUser(createdUser);
    const token = signToken({ userId: safeUser.id, role: safeUser.role, email: safeUser.email });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user: safeUser,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[POST /api/auth/register]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
