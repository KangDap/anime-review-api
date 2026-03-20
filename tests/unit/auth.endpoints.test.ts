import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findFirst: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    count: vi.fn(),
    findMany: vi.fn(),
  },
};

vi.mock('@/lib/prisma', () => ({
  default: prismaMock,
}));

describe('Auth Endpoint Main Paths', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register success + duplicate', async () => {
    const { POST: registerPost } = await import('@/app/api/auth/register/route');

    prismaMock.user.findFirst.mockResolvedValueOnce(null);
    prismaMock.user.create.mockResolvedValueOnce({
      id: 1,
      username: 'admin_user',
      email: 'admin@example.com',
      role: 'ADMIN',
      createdAt: new Date('2026-03-19T00:00:00Z'),
      updatedAt: new Date('2026-03-19T00:00:00Z'),
    });

    const successReq = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_user',
        email: 'admin@example.com',
        password: 'password123',
      }),
    });

    const successRes = await registerPost(successReq as never);
    expect(successRes.status).toBe(201);

    const successBody = await successRes.json();
    expect(successBody.user).toMatchObject({
      id: 1,
      username: 'admin_user',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(successBody.user.passwordHash).toBeUndefined();
    expect(typeof successBody.token).toBe('string');

    prismaMock.user.findFirst.mockResolvedValueOnce({
      id: 99,
      username: 'admin_user',
      email: 'other@example.com',
    });

    const duplicateReq = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        username: 'admin_user',
        email: 'new@example.com',
        password: 'password123',
      }),
    });

    const duplicateRes = await registerPost(duplicateReq as never);
    expect(duplicateRes.status).toBe(409);
    await expect(duplicateRes.json()).resolves.toMatchObject({
      error: 'username is already in use',
    });
  });

  it('login success + wrong password', async () => {
    const { POST: loginPost } = await import('@/app/api/auth/login/route');
    const { hashPassword } = await import('@/lib/auth');

    const validPasswordHash = await hashPassword('password123');
    const anotherPasswordHash = await hashPassword('another-password-123');

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 5,
      username: 'user_login',
      email: 'user@login.dev',
      role: 'USER',
      passwordHash: validPasswordHash,
      createdAt: new Date('2026-03-19T00:00:00Z'),
      updatedAt: new Date('2026-03-19T00:00:00Z'),
    });

    const successReq = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'user@login.dev',
        password: 'password123',
      }),
    });

    const successRes = await loginPost(successReq as never);
    expect(successRes.status).toBe(200);

    const successBody = await successRes.json();
    expect(successBody.user).toMatchObject({
      id: 5,
      username: 'user_login',
      email: 'user@login.dev',
      role: 'USER',
    });
    expect(successBody.user.passwordHash).toBeUndefined();
    expect(typeof successBody.token).toBe('string');

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 6,
      username: 'user_wrong_pass',
      email: 'wrong@pass.dev',
      role: 'USER',
      passwordHash: anotherPasswordHash,
      createdAt: new Date('2026-03-19T00:00:00Z'),
      updatedAt: new Date('2026-03-19T00:00:00Z'),
    });

    const wrongPasswordReq = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'wrong@pass.dev',
        password: 'definitely-wrong-password',
      }),
    });

    const wrongPasswordRes = await loginPost(wrongPasswordReq as never);
    expect(wrongPasswordRes.status).toBe(401);
    await expect(wrongPasswordRes.json()).resolves.toMatchObject({
      error: 'Invalid email or password',
    });
  });

  it('get users unauthorized + authorized', async () => {
    const { GET: usersGet } = await import('@/app/api/users/route');
    const { signToken } = await import('@/lib/auth');

    const unauthorizedReq = new Request('http://localhost/api/users?page=1&limit=10', {
      method: 'GET',
    });

    const unauthorizedRes = await usersGet(unauthorizedReq as never);
    expect(unauthorizedRes.status).toBe(401);

    prismaMock.user.count.mockResolvedValueOnce(2);
    prismaMock.user.findMany.mockResolvedValueOnce([
      {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        role: 'ADMIN',
        createdAt: new Date('2026-03-19T00:00:00Z'),
        updatedAt: new Date('2026-03-19T00:00:00Z'),
      },
      {
        id: 2,
        username: 'member',
        email: 'member@example.com',
        role: 'USER',
        createdAt: new Date('2026-03-19T00:00:00Z'),
        updatedAt: new Date('2026-03-19T00:00:00Z'),
      },
    ]);

    const adminToken = signToken({
      userId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    const authorizedReq = new Request('http://localhost/api/users?page=1&limit=10', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    const authorizedRes = await usersGet(authorizedReq as never);
    expect(authorizedRes.status).toBe(200);

    const authorizedBody = await authorizedRes.json();
    expect(Array.isArray(authorizedBody.data)).toBe(true);
    expect(authorizedBody.pagination).toMatchObject({
      page: 1,
      limit: 10,
      total: 2,
      totalPages: 1,
    });
    expect(authorizedBody.data[0].passwordHash).toBeUndefined();
  });

  it('get user by id unauthorized + self + forbidden + admin', async () => {
    const { GET: getUserById } = await import('@/app/api/users/[id]/route');
    const { signToken } = await import('@/lib/auth');

    const unauthorizedReq = new Request('http://localhost/api/users/2', {
      method: 'GET',
    });

    const unauthorizedRes = await getUserById(unauthorizedReq as never, {
      params: Promise.resolve({ id: '2' }),
    });
    expect(unauthorizedRes.status).toBe(401);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 2,
      username: 'member_2',
      email: 'member2@example.com',
      role: 'USER',
      createdAt: new Date('2026-03-20T00:00:00Z'),
      updatedAt: new Date('2026-03-20T00:00:00Z'),
    });

    const selfToken = signToken({
      userId: 2,
      email: 'member2@example.com',
      role: 'USER',
    });

    const selfReq = new Request('http://localhost/api/users/2', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${selfToken}`,
      },
    });

    const selfRes = await getUserById(selfReq as never, {
      params: Promise.resolve({ id: '2' }),
    });
    expect(selfRes.status).toBe(200);

    const selfBody = await selfRes.json();
    expect(selfBody).toMatchObject({
      id: 2,
      username: 'member_2',
      email: 'member2@example.com',
      role: 'USER',
    });
    expect(selfBody.passwordHash).toBeUndefined();

    const otherUserToken = signToken({
      userId: 3,
      email: 'member3@example.com',
      role: 'USER',
    });

    const forbiddenReq = new Request('http://localhost/api/users/2', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${otherUserToken}`,
      },
    });

    const forbiddenRes = await getUserById(forbiddenReq as never, {
      params: Promise.resolve({ id: '2' }),
    });
    expect(forbiddenRes.status).toBe(403);

    prismaMock.user.findUnique.mockResolvedValueOnce({
      id: 2,
      username: 'member_2',
      email: 'member2@example.com',
      role: 'USER',
      createdAt: new Date('2026-03-20T00:00:00Z'),
      updatedAt: new Date('2026-03-20T00:00:00Z'),
    });

    const adminToken = signToken({
      userId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    const adminReq = new Request('http://localhost/api/users/2', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    const adminRes = await getUserById(adminReq as never, {
      params: Promise.resolve({ id: '2' }),
    });
    expect(adminRes.status).toBe(200);

    const adminBody = await adminRes.json();
    expect(adminBody).toMatchObject({
      id: 2,
      username: 'member_2',
      email: 'member2@example.com',
      role: 'USER',
    });
    expect(adminBody.passwordHash).toBeUndefined();
  });

  it('get user by id invalid id returns 400', async () => {
    const { GET: getUserById } = await import('@/app/api/users/[id]/route');
    const { signToken } = await import('@/lib/auth');

    const userToken = signToken({
      userId: 2,
      email: 'member2@example.com',
      role: 'USER',
    });

    const req = new Request('http://localhost/api/users/not-a-number', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${userToken}`,
      },
    });

    const res = await getUserById(req as never, {
      params: Promise.resolve({ id: 'not-a-number' }),
    });

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      error: 'Invalid user id',
    });
  });

  it('get user by id returns 404 when user not found', async () => {
    const { GET: getUserById } = await import('@/app/api/users/[id]/route');
    const { signToken } = await import('@/lib/auth');

    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    const adminToken = signToken({
      userId: 1,
      email: 'admin@example.com',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost/api/users/9999', {
      method: 'GET',
      headers: {
        authorization: `Bearer ${adminToken}`,
      },
    });

    const res = await getUserById(req as never, {
      params: Promise.resolve({ id: '9999' }),
    });

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({
      error: 'User not found',
    });
  });
});
