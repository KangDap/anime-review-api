import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) return Number.NaN;
  return parsed;
}

// GET /api/users
export async function GET(request: NextRequest) {
  try {
    // Policy: any logged-in user can access user list.
    const auth = requireAuth(request);
    if (auth.response) {
      return auth.response;
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

    const [total, users] = await Promise.all([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return NextResponse.json(
      {
        data: users,
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
    console.error('[GET /api/users]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
