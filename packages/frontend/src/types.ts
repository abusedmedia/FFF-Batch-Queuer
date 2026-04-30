export interface Customer {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  name: string;
  descriptionNote: string | null;
  url: string;
  method: string;
  payload: unknown;
  headers: Record<string, string> | null;
  status: "pending" | "running" | "done" | "failed" | "paused";
  attempts: number;
  errorAttempts: number;
  errorAttemptLimit: number;
  successCount: number;
  successLimit: number;
  successRetryDelaySeconds: number;
  createdAt: number;
  updatedAt: number;
  completedAt: number | null;
  lastStatus: number | null;
  lastBody?: string | null;
  lastError?: string | null;
}

export interface Run {
  id: string;
  jobId: string;
  runAt: number;
  responseStatus: number | null;
  responsePayload: string | null;
}
