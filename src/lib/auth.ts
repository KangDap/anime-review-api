import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { authEnv } from '@/lib/env';

const JWT_SECRET: string = authEnv.JWT_SECRET;

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token
 * @param payload - Data to encode in the token
 * @param expiresIn - Token expiration time (default: 24h)
 * @returns Signed JWT token
 */
export function signToken(
  payload: Record<string, unknown>,
  expiresIn: string | number = '24h'
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as SignOptions);
}

/**
 * Verify a JWT token
 * @param token - JWT token to verify
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): Record<string, unknown> {
  try {
    return jwt.verify(token, JWT_SECRET) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Invalid or expired token: ${error}`);
  }
}

/**
 * Extract token from Authorization header
 * @param authHeader - Authorization header value (format: "Bearer <token>")
 * @returns Token without "Bearer " prefix
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
}
