import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/animes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    const releaseYear = searchParams.get('releaseYear');

    const animes = await prisma.anime.findMany({
      where: {
        ...(genre ? { genre: { contains: genre, mode: 'insensitive' } } : {}),
        ...(releaseYear ? { releaseYear: parseInt(releaseYear) } : {}),
      },
      include: {
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(animes, { status: 200 });
  } catch (error) {
    console.error('[GET /api/animes]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/animes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, synopsis, genre, releaseYear } = body;

    if (!title || !synopsis || !genre || !releaseYear) {
      return NextResponse.json(
        { error: 'title, synopsis, genre, and releaseYear are required' },
        { status: 402 }
      );
    }

    if (typeof releaseYear !== 'number' || releaseYear < 1900 || releaseYear > 2100) {
      return NextResponse.json({ error: 'releaseYear must be a valid year' }, { status: 400 });
    }

    const anime = await prisma.anime.create({
      data: { title, synopsis, genre, releaseYear },
    });

    return NextResponse.json(anime, { status: 201 });
  } catch (error) {
    console.error('[POST /api/animes]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
