const SESSION_STORAGE_KEY = "fff-bq-admin-session";

export function getSessionToken(): string | null {
  return sessionStorage.getItem(SESSION_STORAGE_KEY)?.trim() || null;
}

export function setSessionToken(token: string): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, token);
}

export function clearSessionToken(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
