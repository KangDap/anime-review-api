import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

type Params = { params: Promise<{ id: string }> };

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
}

// GET /api/users/:id/reviews
// Policy: Admin or user itself
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(request);
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
        { error: 'Forbidden: you can only view your own reviews' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parsePositiveInt(searchParams.get('page'), 1);
    const limit = parsePositiveInt(searchParams.get('limit'), 10);

    if (Number.isNaN(page) || Number.isNaN(limit)) {
      return NextResponse.json(
        { error: 'page and limit must be positive integers' },
        { status: 400 }
      );
    }

    if (limit > 100) {
      return NextResponse.json(
        { error: 'limit must be less than or equal to 100' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { userId } }),
      prisma.review.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          anime: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json(
      {
        data: reviews,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[GET /api/users/:id/reviews]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
