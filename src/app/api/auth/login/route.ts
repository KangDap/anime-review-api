import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

type LoginBody = {
  email?: unknown;
  password?: unknown;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateLoginInput(body: LoginBody): string | null {
  const { email, password } = body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return 'email and password are required';
  }

  const trimmedEmail = email.trim();
  if (!trimmedEmail || !password) {
    return 'email and password are required';
  }

  const emailPattern = /^[^@]+@[^@]+\.[^@]+$/;
  if (!emailPattern.test(trimmedEmail)) {
    return 'email must be a valid email address';
  }

  return null;
}

// POST /api/auth/login
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginBody;
    const validationError = validateLoginInput(body);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const email = normalizeEmail(body.email as string);
    const password = body.password as string;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const token = signToken({
      userId: safeUser.id,
      role: safeUser.role,
      email: safeUser.email,
    });

    return NextResponse.json(
      {
        message: 'Login successful',
        token,
        user: safeUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
