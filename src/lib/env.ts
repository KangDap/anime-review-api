/**
 * Validate and export environment variables for authentication
 */

const DEFAULT_DEV_JWT_SECRET = 'local-dev-jwt-secret';

function getEnvVariable(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  
  return value || defaultValue || '';
}

export const authEnv = {
  /**
   * JWT secret key for signing and verifying tokens
   * In production, JWT_SECRET must be provided from environment.
   */
  JWT_SECRET: getEnvVariable(
    'JWT_SECRET',
    process.env.NODE_ENV === 'production' 
      ? undefined 
      : DEFAULT_DEV_JWT_SECRET
  ),

  /**
   * JWT token expiration time (default: 24h)
   */
  JWT_EXPIRES_IN: getEnvVariable('JWT_EXPIRES_IN', '24h'),

  /**
   * Database URL for Prisma
   */
  DATABASE_URL: process.env.DATABASE_URL || '',

  /**
   * Environment (development, production, test)
   */
  NODE_ENV: getEnvVariable('NODE_ENV', 'development'),
};

/**
 * Validate that all required auth environment variables are set
 */
export function validateAuthEnv(): void {
  const required = ['DATABASE_URL'];
  const production = ['JWT_SECRET'];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (process.env.NODE_ENV === 'production') {
    const missingProd = production.filter(key => !process.env[key]);
    missing.push(...missingProd);
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}
