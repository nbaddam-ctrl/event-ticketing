import { getStoredToken, setStoredToken } from './authSession';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

let authToken: string | null = getStoredToken();

export function setAuthToken(token: string | null): void {
  authToken = token;
  setStoredToken(token);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ message: 'Request failed' }));

    // Extract human-readable validation details from Zod-flattened errors
    let message = payload.message ?? 'Request failed';
    if (payload.details) {
      const fieldErrors: Record<string, string[]> = payload.details.fieldErrors ?? {};
      const formErrors: string[] = payload.details.formErrors ?? [];
      const parts: string[] = [];

      for (const [field, msgs] of Object.entries(fieldErrors)) {
        if (Array.isArray(msgs) && msgs.length > 0) {
          parts.push(`${field}: ${msgs.join(', ')}`);
        }
      }
      for (const msg of formErrors) {
        parts.push(msg);
      }
      if (parts.length > 0) {
        message = parts.join('; ');
      }
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
