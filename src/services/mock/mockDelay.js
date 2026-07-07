/**
 * mockDelay.js
 * Simulates async network latency for mock service calls.
 */
export function mockDelay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
