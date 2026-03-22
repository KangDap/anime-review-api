import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// GET /api/animes/:id
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const anime = await prisma.anime.findUnique({
      where: { id: animeId },
      include: {
        reviews: {
          include: { user: { select: { id: true, username: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!anime) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    return NextResponse.json(anime, { status: 200 });
  } catch (error) {
    console.error('[GET /api/animes/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/animes/:id
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await prisma.anime.findUnique({ where: { id: animeId } });
    if (!existing) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, synopsis, genre, releaseYear } = body;

    if (releaseYear !== undefined && (typeof releaseYear !== 'number' || releaseYear < 1900 || releaseYear > 2100)) {
      return NextResponse.json({ error: 'releaseYear must be a valid year' }, { status: 400 });
    }

    const anime = await prisma.anime.update({
      where: { id: animeId },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(synopsis !== undefined ? { synopsis } : {}),
        ...(genre !== undefined ? { genre } : {}),
        ...(releaseYear !== undefined ? { releaseYear } : {}),
      },
    });

    return NextResponse.json(anime, { status: 200 });
  } catch (error) {
    console.error('[PUT /api/animes/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/animes/:id
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const animeId = parseInt(id);

    if (isNaN(animeId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const existing = await prisma.anime.findUnique({ where: { id: animeId } });
    if (!existing) {
      return NextResponse.json({ error: 'Anime not found' }, { status: 404 });
    }

    await prisma.anime.delete({ where: { id: animeId } });

    return NextResponse.json({ message: 'Anime deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('[DELETE /api/animes/:id]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
