import { recoverStalePendingJobs, recoverStaleRunningJobs } from "./db";
import type { Env } from "./types";

/** Must exceed worst-case target HTTP latency; otherwise a slow response looks "stale" and we re-enqueue while the first fetch is still in flight. */
const DEFAULT_STALE_RUNNING_MS = 300_000;
const DEFAULT_RECOVERY_SCAN_LIMIT = 100;
const RECOVERY_CHECK_INTERVAL_MS = 15_000;

/** First queue message never arrived (e.g. send failed) or consumer never claimed the job. */
const DEFAULT_INITIAL_PENDING_MS = 10 * 60 * 1000;
/** Slack after the scheduled delay (`msg.retry` / success fixed delay / error backoff) before treating pending as orphaned. */
const DEFAULT_STALE_PENDING_GRACE_MS = 15 * 60 * 1000;
/** `backoffSeconds` is capped at 300s plus jitter; stay above that when detecting stale error retries. */
const ERROR_RETRY_UPPER_BOUND_MS = 360 * 1000;

let lastRecoveryAt = 0;
let recoveryInFlight: Promise<void> | null = null;

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function getRecoveryConfig(env: Env): {
  staleRunningMs: number;
  scanLimit: number;
} {
  const staleRunningMs =
    parsePositiveInt(env.RECOVERY_STALE_RUNNING_MS) ?? DEFAULT_STALE_RUNNING_MS;
  const scanLimit =
    parsePositiveInt(env.RECOVERY_SCAN_LIMIT) ?? DEFAULT_RECOVERY_SCAN_LIMIT;
  return { staleRunningMs, scanLimit };
}

export async function recoverOrphanedRunningJobs(env: Env): Promise<void> {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_CHECK_INTERVAL_MS) return;
  if (recoveryInFlight) return recoveryInFlight;

  recoveryInFlight = (async () => {
    const { staleRunningMs, scanLimit } = getRecoveryConfig(env);
    const now = Date.now();
    const recoveredRunning = await recoverStaleRunningJobs(env.DB, staleRunningMs, scanLimit);
    if (recoveredRunning.length) {
      console.log(`[recovery] recovered ${recoveredRunning.length} stale running job(s)`);
      for (const row of recoveredRunning) {
        await env.JOB_QUEUE.send({ jobId: row.id, customerId: row.customer_id });
      }
    }
    const recoveredPending = await recoverStalePendingJobs(env.DB, now, {
      initialPendingMs: DEFAULT_INITIAL_PENDING_MS,
      pendingGraceMs: DEFAULT_STALE_PENDING_GRACE_MS,
      errorRetryUpperBoundMs: ERROR_RETRY_UPPER_BOUND_MS,
      limit: scanLimit,
    });
    if (recoveredPending.length) {
      console.log(
        `[recovery] re-queued ${recoveredPending.length} stale pending job(s) (lost/delayed queue delivery)`,
      );
      for (const row of recoveredPending) {
        await env.JOB_QUEUE.send({ jobId: row.id, customerId: row.customer_id });
      }
    }
  })()
    .catch((err) => {
      console.error("[recovery] failed to recover running jobs", err);
    })
    .finally(() => {
      lastRecoveryAt = Date.now();
      recoveryInFlight = null;
    });

  return recoveryInFlight;
}
