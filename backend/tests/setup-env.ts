// Set environment variables BEFORE any app modules load.
// This file is referenced in jest.config.cjs `setupFiles`.
process.env.DATABASE_URL = ':memory:';
process.env.JWT_SECRET = 'test-secret';

// Suppress console noise from errorHandler and fire-and-forget logging during tests.
// Tests assert HTTP status codes and response bodies directly — console output is noise.
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
