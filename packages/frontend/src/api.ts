import type { Customer, Job } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://127.0.0.1:8999";
const OBSERVABILITY_TOKEN = import.meta.env.VITE_OBSERVABILITY_TOKEN?.trim();

function getHeaders(): HeadersInit {
  if (!OBSERVABILITY_TOKEN) return {};
  return { "x-observability-token": OBSERVABILITY_TOKEN };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      ...getHeaders(),
    },
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Request failed (${response.status}): ${body || response.statusText}`,
    );
  }
  return response.json() as Promise<T>;
}

export async function fetchCustomers(): Promise<Customer[]> {
  const payload = await request<{ customers: Customer[] }>("/observability/customers");
  return payload.customers;
}

export async function fetchJobs(customerId?: string): Promise<Job[]> {
  const query = customerId
    ? `/observability/jobs?customerId=${encodeURIComponent(customerId)}`
    : "/observability/jobs";
  const payload = await request<{ jobs: Job[] }>(query);
  return payload.jobs;
}

export async function createJob(input: {
  customerId: string;
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  payload: unknown | null;
  headers: Record<string, string> | null;
  errorAttemptLimit: number;
  successLimit: number;
  successRetryDelaySeconds: number;
}): Promise<{ job: Job }> {
  return request<{ job: Job }>("/observability/jobs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function updateJob(
  jobId: string,
  input: {
    name: string;
    url: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    payload: unknown | null;
    headers: Record<string, string> | null;
    errorAttemptLimit: number;
    successLimit: number;
    successRetryDelaySeconds: number;
  },
): Promise<{ job: Job }> {
  return request<{ job: Job }>(`/observability/jobs/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteJob(jobId: string): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(`/observability/jobs/${encodeURIComponent(jobId)}`, {
    method: "DELETE",
  });
}

export async function updateCustomer(
  customerId: string,
  input: { name: string; isActive: boolean; rotateToken: boolean },
): Promise<{ customer: Customer; newToken: string | null }> {
  return request<{ customer: Customer; newToken: string | null }>(
    `/observability/customers/${encodeURIComponent(customerId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
}

export async function createCustomer(input: {
  name: string;
  isActive: boolean;
}): Promise<{ customer: Customer; newToken: string }> {
  return request<{ customer: Customer; newToken: string }>("/observability/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function deleteCustomer(
  customerId: string,
): Promise<{ deleted: boolean }> {
  return request<{ deleted: boolean }>(
    `/observability/customers/${encodeURIComponent(customerId)}`,
    {
      method: "DELETE",
    },
  );
}
