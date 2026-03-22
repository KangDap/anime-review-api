import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-guard';

type Params = { params: Promise<{ id: string }> };

// GET /api/reviews/:id
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, username: true } },
        anime: { select: { id: true, title: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error('[GET /api/reviews/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/reviews/:id
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const isOwner = auth.user.userId === review.userId;
    const isAdmin = auth.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: you can only update your own review' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { rating, comment } = body;

    if (rating !== undefined && rating !== null) {
      if (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating)) {
        return NextResponse.json({ error: 'rating must be an integer between 1 and 10' }, { status: 400 });
      }
    }

    if (comment !== undefined && comment !== null) {
      if (typeof comment !== 'string' || comment.trim().length === 0) {
        return NextResponse.json({ error: 'comment must not be empty' }, { status: 400 });
      }
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating !== undefined ? { rating } : {}),
        ...(comment !== undefined ? { comment: comment.trim() } : {}),
      },
      include: {
        user: { select: { id: true, username: true } },
        anime: { select: { id: true, title: true } },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/reviews/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reviews/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const auth = requireAuth(_request);
    if (auth.response) {
      return auth.response;
    }

    const { id } = await params;
    const reviewId = parseInt(id);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: 'Invalid review ID' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const isOwner = auth.user.userId === review.userId;
    const isAdmin = auth.user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: you can only delete your own review' },
        { status: 403 }
      );
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/reviews/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
