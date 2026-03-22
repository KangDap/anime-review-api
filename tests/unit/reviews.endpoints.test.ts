import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  anime: {
    findUnique: vi.fn(),
  },
  review: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

describe('Review Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/animes/:id/reviews - Create Review', () => {
    it('should create review successfully', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.anime.findUnique.mockResolvedValueOnce({
        id: 1,
        title: 'Attack on Titan',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2013,
        createdAt: new Date(),
      });

      prismaMock.review.findFirst.mockResolvedValueOnce(null);

      prismaMock.review.create.mockResolvedValueOnce({
        id: 1,
        rating: 9,
        comment: 'Great anime!',
        createdAt: new Date('2026-03-20T12:00:00Z'),
        updatedAt: new Date('2026-03-20T12:00:00Z'),
        userId: 1,
        animeId: 1,
        user: { id: 1, username: 'testuser' },
      });

      const req = new Request('http://localhost/api/animes/1/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 9,
          comment: 'Great anime!',
        }),
      });

      const res = await createReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toMatchObject({
        id: 1,
        rating: 9,
        comment: 'Great anime!',
        user: { id: 1, username: 'testuser' },
      });
    });

    it('should return 404 when anime not found', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.anime.findUnique.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/animes/9999/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 8,
          comment: 'Test',
        }),
      });

      const res = await createReview(req as never, {
        params: Promise.resolve({ id: '9999' }),
      });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toMatchObject({
        error: 'Anime not found',
      });
    });

    it('should return 401 when unauthorized', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');

      const req = new Request('http://localhost/api/animes/1/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          rating: 8,
          comment: 'Test',
        }),
      });

      const res = await createReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 409 when user already reviewed anime', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.anime.findUnique.mockResolvedValueOnce({
        id: 1,
        title: 'Attack on Titan',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2013,
        createdAt: new Date(),
      });

      prismaMock.review.findFirst.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Already reviewed',
        userId: 1,
        animeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new Request('http://localhost/api/animes/1/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 9,
          comment: 'Another review',
        }),
      });

      const res = await createReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(409);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('already reviewed'),
      });
    });

    it('should return 400 with invalid rating', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      const testCases = [
        { rating: 0, description: 'rating below 1' },
        { rating: 11, description: 'rating above 10' },
        { rating: 5.5, description: 'non-integer rating' },
        { rating: 'invalid', description: 'string rating' },
        { rating: null, description: 'null rating' },
      ];

      for (const testCase of testCases) {
                prismaMock.anime.findUnique.mockResolvedValueOnce({
                  id: 1,
                  title: 'Test Anime',
                  synopsis: 'Test',
                  genre: 'Action',
                  releaseYear: 2013,
                  createdAt: new Date(),
                });

        const req = new Request('http://localhost/api/animes/1/reviews', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            rating: testCase.rating,
            comment: 'Test comment',
          }),
        });

        const res = await createReview(req as never, {
          params: Promise.resolve({ id: '1' }),
        });

        expect(res.status).toBe(400);
      }
    });

    it('should return 400 with empty comment', async () => {
      const { POST: createReview } = await import('@/app/api/animes/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.anime.findUnique.mockResolvedValueOnce({
        id: 1,
        title: 'Test Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2013,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost/api/animes/1/reviews', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 8,
          comment: '',
        }),
      });

      const res = await createReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('comment'),
      });
    });
  });

  describe('GET /api/animes/:id/reviews - List Reviews Per Anime', () => {
    it('should get reviews list with pagination', async () => {
      const { GET: getReviews } = await import('@/app/api/animes/[id]/reviews/route');

      prismaMock.anime.findUnique.mockResolvedValueOnce({
        id: 1,
        title: 'Test Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2013,
        createdAt: new Date(),
      });

      prismaMock.review.count.mockResolvedValueOnce(2);
      prismaMock.review.findMany.mockResolvedValueOnce([
        {
          id: 1,
          rating: 9,
          comment: 'Amazing!',
          createdAt: new Date('2026-03-20T12:00:00Z'),
          updatedAt: new Date('2026-03-20T12:00:00Z'),
          userId: 1,
          animeId: 1,
          user: { id: 1, username: 'user1' },
        },
        {
          id: 2,
          rating: 8,
          comment: 'Great!',
          createdAt: new Date('2026-03-19T12:00:00Z'),
          updatedAt: new Date('2026-03-19T12:00:00Z'),
          userId: 2,
          animeId: 1,
          user: { id: 2, username: 'user2' },
        },
      ]);

      const req = new Request('http://localhost/api/animes/1/reviews?page=1&limit=10');

      const res = await getReviews(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
      expect(body.data[0]).toMatchObject({
        id: 1,
        rating: 9,
        comment: 'Amazing!',
        user: { id: 1, username: 'user1' },
      });
    });

    it('should return 404 when anime not found', async () => {
      const { GET: getReviews } = await import('@/app/api/animes/[id]/reviews/route');

      prismaMock.anime.findUnique.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/animes/9999/reviews');

      const res = await getReviews(req as never, {
        params: Promise.resolve({ id: '9999' }),
      });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toMatchObject({
        error: 'Anime not found',
      });
    });

    it('should validate pagination parameters', async () => {
      const { GET: getReviews } = await import('@/app/api/animes/[id]/reviews/route');

      prismaMock.anime.findUnique.mockResolvedValueOnce({
        id: 1,
        title: 'Test Anime',
        synopsis: 'Test',
        genre: 'Action',
        releaseYear: 2013,
        createdAt: new Date(),
      });

      const req = new Request('http://localhost/api/animes/1/reviews?page=invalid&limit=999');

      const res = await getReviews(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/reviews/:id - Get Review Detail', () => {
    it('should get review detail successfully', async () => {
      const { GET: getReview } = await import('@/app/api/reviews/[id]/route');

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 9,
        comment: 'Amazing anime!',
        createdAt: new Date('2026-03-20T12:00:00Z'),
        updatedAt: new Date('2026-03-20T12:00:00Z'),
        userId: 1,
        animeId: 1,
        user: { id: 1, username: 'testuser' },
        anime: { id: 1, title: 'Attack on Titan' },
      });

      const req = new Request('http://localhost/api/reviews/1');

      const res = await getReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        id: 1,
        rating: 9,
        comment: 'Amazing anime!',
        user: { id: 1, username: 'testuser' },
        anime: { id: 1, title: 'Attack on Titan' },
      });
    });

    it('should return 404 when review not found', async () => {
      const { GET: getReview } = await import('@/app/api/reviews/[id]/route');

      prismaMock.review.findUnique.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/reviews/9999');

      const res = await getReview(req as never, {
        params: Promise.resolve({ id: '9999' }),
      });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toMatchObject({
        error: 'Review not found',
      });
    });

    it('should return 400 for invalid review id', async () => {
      const { GET: getReview } = await import('@/app/api/reviews/[id]/route');

      const req = new Request('http://localhost/api/reviews/invalid-id');

      const res = await getReview(req as never, {
        params: Promise.resolve({ id: 'invalid-id' }),
      });

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({
        error: 'Invalid review ID',
      });
    });
  });

  describe('PUT /api/reviews/:id - Update Review', () => {
    it('should update review for owner', async () => {
      const { PUT: updateReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Old comment',
        createdAt: new Date('2026-03-19T12:00:00Z'),
        updatedAt: new Date('2026-03-19T12:00:00Z'),
        userId: 1,
        animeId: 1,
      });

      prismaMock.review.update.mockResolvedValueOnce({
        id: 1,
        rating: 9,
        comment: 'Updated comment',
        createdAt: new Date('2026-03-19T12:00:00Z'),
        updatedAt: new Date('2026-03-20T12:00:00Z'),
        userId: 1,
        animeId: 1,
        user: { id: 1, username: 'testuser' },
        anime: { id: 1, title: 'Test Anime' },
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 9,
          comment: 'Updated comment',
        }),
      });

      const res = await updateReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        id: 1,
        rating: 9,
        comment: 'Updated comment',
      });
    });

    it('should update review for admin', async () => {
      const { PUT: updateReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const adminToken = signToken({
        userId: 99,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Old comment',
        createdAt: new Date('2026-03-19T12:00:00Z'),
        updatedAt: new Date('2026-03-19T12:00:00Z'),
        userId: 1,
        animeId: 1,
      });

      prismaMock.review.update.mockResolvedValueOnce({
        id: 1,
        rating: 10,
        comment: 'Admin updated',
        createdAt: new Date('2026-03-19T12:00:00Z'),
        updatedAt: new Date('2026-03-20T12:00:00Z'),
        userId: 1,
        animeId: 1,
        user: { id: 1, username: 'testuser' },
        anime: { id: 1, title: 'Test Anime' },
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          rating: 10,
        }),
      });

      const res = await updateReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-owner updates', async () => {
      const { PUT: updateReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 2,
        email: 'user2@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Original comment',
        createdAt: new Date('2026-03-19T12:00:00Z'),
        updatedAt: new Date('2026-03-19T12:00:00Z'),
        userId: 1,
        animeId: 1,
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Hacked comment',
        }),
      });

      const res = await updateReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('can only update'),
      });
    });

    it('should validate updated rating', async () => {
      const { PUT: updateReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test',
        userId: 1,
        animeId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          rating: 15,
        }),
      });

      const res = await updateReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(400);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('rating'),
      });
    });
  });

  describe('DELETE /api/reviews/:id - Delete Review', () => {
    it('should delete review for owner', async () => {
      const { DELETE: deleteReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        animeId: 1,
      });

      prismaMock.review.delete.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        animeId: 1,
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await deleteReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toMatchObject({
        message: expect.stringContaining('deleted'),
      });
    });

    it('should delete review for admin', async () => {
      const { DELETE: deleteReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const adminToken = signToken({
        userId: 99,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        animeId: 1,
      });

      prismaMock.review.delete.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        animeId: 1,
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await deleteReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
    });

    it('should return 403 when non-owner deletes', async () => {
      const { DELETE: deleteReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 2,
        email: 'user2@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce({
        id: 1,
        rating: 8,
        comment: 'Test comment',
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 1,
        animeId: 1,
      });

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await deleteReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('can only delete'),
      });
    });

    it('should return 401 when unauthorized', async () => {
      const { DELETE: deleteReview } = await import('@/app/api/reviews/[id]/route');

      const req = new Request('http://localhost/api/reviews/1', {
        method: 'DELETE',
      });

      const res = await deleteReview(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(401);
    });

    it('should return 404 when review not found', async () => {
      const { DELETE: deleteReview } = await import('@/app/api/reviews/[id]/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.review.findUnique.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/reviews/9999', {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await deleteReview(req as never, {
        params: Promise.resolve({ id: '9999' }),
      });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toMatchObject({
        error: 'Review not found',
      });
    });
  });

  describe('GET /api/reviews - Global Reviews List (Admin Only)', () => {
    it('should get all reviews for admin with pagination', async () => {
      const { GET: getAllReviews } = await import('@/app/api/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const adminToken = signToken({
        userId: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      prismaMock.review.count.mockResolvedValueOnce(5);
      prismaMock.review.findMany.mockResolvedValueOnce([
        {
          id: 1,
          rating: 9,
          comment: 'Great!',
          createdAt: new Date('2026-03-20T12:00:00Z'),
          updatedAt: new Date('2026-03-20T12:00:00Z'),
          userId: 1,
          animeId: 1,
          user: { id: 1, username: 'user1' },
          anime: { id: 1, title: 'Anime 1' },
        },
      ]);

      const req = new Request('http://localhost/api/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getAllReviews(req as never);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 5,
      });
      expect(Array.isArray(body.data)).toBe(true);
    });

    it('should return 403 when non-admin accesses', async () => {
      const { GET: getAllReviews } = await import('@/app/api/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      const req = new Request('http://localhost/api/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await getAllReviews(req as never);

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('admin'),
      });
    });

    it('should return 401 when unauthorized', async () => {
      const { GET: getAllReviews } = await import('@/app/api/reviews/route');

      const req = new Request('http://localhost/api/reviews?page=1&limit=10');

      const res = await getAllReviews(req as never);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id/reviews - User Reviews', () => {
    it('should get own reviews', async () => {
      const { GET: getUserReviews } = await import('@/app/api/users/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 1,
        username: 'testuser',
        email: 'user@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.review.count.mockResolvedValueOnce(2);
      prismaMock.review.findMany.mockResolvedValueOnce([
        {
          id: 1,
          rating: 9,
          comment: 'Great!',
          createdAt: new Date('2026-03-20T12:00:00Z'),
          updatedAt: new Date('2026-03-20T12:00:00Z'),
          userId: 1,
          animeId: 1,
          anime: { id: 1, title: 'Anime 1' },
        },
        {
          id: 2,
          rating: 8,
          comment: 'Good!',
          createdAt: new Date('2026-03-19T12:00:00Z'),
          updatedAt: new Date('2026-03-19T12:00:00Z'),
          userId: 1,
          animeId: 2,
          anime: { id: 2, title: 'Anime 2' },
        },
      ]);

      const req = new Request('http://localhost/api/users/1/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await getUserReviews(req as never, {
        params: Promise.resolve({ id: '1' }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data).toHaveLength(2);
      expect(body.pagination).toMatchObject({
        total: 2,
        page: 1,
        limit: 10,
      });
    });

    it('should return 403 when accessing other user reviews (non-admin)', async () => {
      const { GET: getUserReviews } = await import('@/app/api/users/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const userToken = signToken({
        userId: 1,
        email: 'user@example.com',
        role: 'USER',
      });

      const req = new Request('http://localhost/api/users/2/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${userToken}`,
        },
      });

      const res = await getUserReviews(req as never, {
        params: Promise.resolve({ id: '2' }),
      });

      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toMatchObject({
        error: expect.stringContaining('can only view your own'),
      });
    });

    it('admin should access any user reviews', async () => {
      const { GET: getUserReviews } = await import('@/app/api/users/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const adminToken = signToken({
        userId: 99,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 2,
        username: 'otheruser',
        email: 'other@example.com',
        role: 'USER',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      prismaMock.review.count.mockResolvedValueOnce(1);
      prismaMock.review.findMany.mockResolvedValueOnce([
        {
          id: 1,
          rating: 7,
          comment: 'Okay',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: 2,
          animeId: 1,
          anime: { id: 1, title: 'Anime 1' },
        },
      ]);

      const req = new Request('http://localhost/api/users/2/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getUserReviews(req as never, {
        params: Promise.resolve({ id: '2' }),
      });

      expect(res.status).toBe(200);
    });

    it('should return 404 when user not found', async () => {
      const { GET: getUserReviews } = await import('@/app/api/users/[id]/reviews/route');
      const { signToken } = await import('@/lib/auth');

      const adminToken = signToken({
        userId: 99,
        email: 'admin@example.com',
        role: 'ADMIN',
      });

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      const req = new Request('http://localhost/api/users/9999/reviews?page=1&limit=10', {
        method: 'GET',
        headers: {
          authorization: `Bearer ${adminToken}`,
        },
      });

      const res = await getUserReviews(req as never, {
        params: Promise.resolve({ id: '9999' }),
      });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toMatchObject({
        error: 'User not found',
      });
    });
  });
});
