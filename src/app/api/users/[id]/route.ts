import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

type Params = { params: Promise<{ id: string }> };

// GET /api/users/:id
// Policy: admin can read any user, regular users can read only their own profile.
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(_request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const userId = Number.parseInt(id, 10);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    const isAdmin = auth.user.role === 'ADMIN';
    const isSelf = auth.user.userId === userId;

    if (!isAdmin && !isSelf) {
      return NextResponse.json(
        { error: 'Forbidden: you can only access your own profile' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('[GET /api/users/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
