import { listResumablePendingJobs, recoverStaleRunningJobs } from "./db";
import type { Env } from "./types";

const DEFAULT_STALE_RUNNING_MS = 30_000;
const DEFAULT_RECOVERY_SCAN_LIMIT = 100;
const DEFAULT_PENDING_BOOT_REQUEUE_LIMIT = 100;
const RECOVERY_CHECK_INTERVAL_MS = 15_000;

let lastRecoveryAt = 0;
let recoveryInFlight: Promise<void> | null = null;
let pendingBootRequeueDone = false;

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function getRecoveryConfig(env: Env): {
  staleRunningMs: number;
  scanLimit: number;
  pendingBootRequeueLimit: number;
} {
  const staleRunningMs =
    parsePositiveInt(env.RECOVERY_STALE_RUNNING_MS) ?? DEFAULT_STALE_RUNNING_MS;
  const scanLimit =
    parsePositiveInt(env.RECOVERY_SCAN_LIMIT) ?? DEFAULT_RECOVERY_SCAN_LIMIT;
  const pendingBootRequeueLimit =
    parsePositiveInt(env.RECOVERY_PENDING_BOOT_REQUEUE_LIMIT) ??
    DEFAULT_PENDING_BOOT_REQUEUE_LIMIT;
  return { staleRunningMs, scanLimit, pendingBootRequeueLimit };
}

export async function recoverOrphanedRunningJobs(env: Env): Promise<void> {
  const now = Date.now();
  if (now - lastRecoveryAt < RECOVERY_CHECK_INTERVAL_MS) return;
  if (recoveryInFlight) return recoveryInFlight;

  recoveryInFlight = (async () => {
    const { staleRunningMs, scanLimit, pendingBootRequeueLimit } = getRecoveryConfig(env);
    const recovered = await recoverStaleRunningJobs(env.DB, staleRunningMs, scanLimit);
    if (recovered.length) {
      console.log(`[recovery] recovered ${recovered.length} stale running job(s)`);
      for (const row of recovered) {
        await env.JOB_QUEUE.send({ jobId: row.id, customerId: row.customer_id });
      }
    }

    if (!pendingBootRequeueDone) {
      const pendingRows = await listResumablePendingJobs(env.DB, pendingBootRequeueLimit);
      if (pendingRows.length) {
        console.log(
          `[recovery] boot re-enqueueing ${pendingRows.length} pending job(s)`,
        );
        for (const row of pendingRows) {
          await env.JOB_QUEUE.send({ jobId: row.id, customerId: row.customer_id });
        }
      }
      pendingBootRequeueDone = true;
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
