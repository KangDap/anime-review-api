import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

type Params = { params: Promise<{ id: string }> };

// POST /api/animes/:id/reviews
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'Invalid anime ID' }, { status: 400 });
    }

    const anime = await prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating === undefined || rating === null) {
      return NextResponse.json({ error: 'rating is required' }, { status: 400 });
    }

    if (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
      return NextResponse.json({ error: 'rating must be an integer between 1 and 10' }, { status: 400 });
    }

    if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
      return NextResponse.json({ error: 'comment is required and must not be empty' }, { status: 400 });
    }

    // Check if user already has a review for this anime
    const existingReview = await prisma.review.findFirst({
      where: {
        userId: auth.user.userId,
        animeId: animeId,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this anime. Use PUT to update your review.' },
        { status: 409 }
      );
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment: comment.trim(),
        userId: auth.user.userId,
        animeId: animeId,
      },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('[POST /api/animes/:id/reviews]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/animes/:id/reviews 
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'Invalid anime ID' }, { status: 400 });
    }

    const anime = await prisma.anime.findUnique({ where: { id: animeId } });
    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: 'page must be a positive integer' }, { status: 400 });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'limit must be between 1 and 100' }, { status: 400 });
    }

    const skip = (page - 1) * limit;

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where: { animeId } }),
      prisma.review.findMany({
        where: { animeId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true } },
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
    console.error('[GET /api/animes/:id/reviews]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
