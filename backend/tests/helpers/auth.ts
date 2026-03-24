/**
 * JWT token helper for test authentication.
 * Generates valid tokens using the same secret as the application.
 */
import jwt from 'jsonwebtoken';

const TEST_SECRET = process.env.JWT_SECRET ?? 'test-secret';

export type TestRole = 'attendee' | 'organizer' | 'admin';

/**
 * Create a valid JWT token for test requests.
 * @param userId - The user ID to encode as `sub`
 * @param roles  - Array of roles (default: ['attendee'])
 * @param email  - Email claim (default: generated from userId)
 */
export function createTestToken(
  userId: string,
  roles: TestRole[] = ['attendee'],
  email?: string,
): string {
  return jwt.sign(
    {
      sub: userId,
      email: email ?? `${userId}@test.com`,
      roles,
    },
    TEST_SECRET,
    { expiresIn: '1h' },
  );
}

/** Convenience: create a Bearer auth header value */
export function authHeader(userId: string, roles: TestRole[] = ['attendee']): string {
  return `Bearer ${createTestToken(userId, roles)}`;
}
