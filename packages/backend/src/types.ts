export interface Env {
  DB: D1Database;
  JOB_QUEUE: Queue<JobMessage>;
  OBSERVABILITY_TOKEN?: string;
  CORS_ORIGIN?: string;
  RECOVERY_STALE_RUNNING_MS?: string;
  RECOVERY_SCAN_LIMIT?: string;
  RECOVERY_PENDING_BOOT_REQUEUE_LIMIT?: string;
}

export type JobStatus = "pending" | "running" | "done" | "failed";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface JobMessage {
  jobId: string;
  customerId: string;
}

export interface JobRow {
  id: string;
  customer_id: string;
  name: string;
  url: string;
  method: HttpMethod;
  payload: string | null;
  headers: string | null;
  status: JobStatus;
  attempts: number;
  error_attempts: number;
  max_attempts: number;
  success_count: number;
  success_limit: number;
  success_retry_delay_seconds: number;
  last_status: number | null;
  last_body: string | null;
  last_error: string | null;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

export interface JobInput {
  customerId: string;
  name: string;
  url: string;
  method: HttpMethod;
  payload?: unknown;
  headers?: Record<string, string>;
  errorAttemptLimit?: number;
  successLimit?: number;
  successRetryDelaySeconds?: number;
}

export const QUEUE_NAMES = {
  main: "fff-bq-queue",
  dlq: "fff-bq-dlq",
} as const;

export const MAX_BODY_SNAPSHOT_BYTES = 4096;

export interface CustomerRow {
  id: string;
  name: string;
  token_hash: string;
  is_active: number;
  created_at: number;
  updated_at: number;
}
