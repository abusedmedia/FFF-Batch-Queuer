const BASE_MS = 5_000;
const MAX_MS = 300_000;

/**
 * Exponential backoff with jitter, capped at 5 minutes.
 *
 * Resulting waits (no jitter): 5s, 10s, 20s, 40s, 80s, 160s, 300s, 300s, ...
 *
 * `attempt` is 1-based: pass the attempt number that just failed.
 */
export function backoffSeconds(attempt: number): number {
  const safeAttempt = Math.max(1, Math.floor(attempt));
  const exp = Math.min(MAX_MS, BASE_MS * 2 ** (safeAttempt - 1));
  const jitter = Math.floor(Math.random() * 1000);
  return Math.max(1, Math.ceil((exp + jitter) / 1000));
}
