import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server.ts';

// Establish API mocking before all tests.
// onUnhandledRequest: 'error' will cause any test making an unmocked API call to fail.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
