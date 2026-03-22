import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword, signToken, verifyToken } from '@/lib/auth';

describe('Auth Utils', () => {
  it('should hash password and not return plain value', async () => {
    const password = 'test12345';
    const hash = await hashPassword(password);
    expect(hash).not.toBe(password);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('should compare password correctly for valid password', async () => {
    const password = 'test12345';
    const hash = await hashPassword(password);
    const isMatch = await comparePassword(password, hash);
    expect(isMatch).toBe(true);
  });

  it('should reject wrong password during compare', async () => {
    const hash = await hashPassword('test12345');
    const isMatch = await comparePassword('wrong-password', hash);
    expect(isMatch).toBe(false);
  });

  it('should sign and verify token payload', () => {
    const payload = { userId: 1, email: 'test@example.com', role: 'USER' };
    const token = signToken(payload, '1h');
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(1);
    expect(decoded.email).toBe('test@example.com');
    expect(decoded.role).toBe('USER');
    expect(decoded).toHaveProperty('iat');
    expect(decoded).toHaveProperty('exp');
  });

  it('should throw for invalid token', () => {
    expect(() => verifyToken('invalid.token.value')).toThrow('Invalid or expired token');
  });
});