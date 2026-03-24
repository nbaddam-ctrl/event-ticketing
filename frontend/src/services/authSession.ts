export interface AuthUser {
  id: string;
  email: string;
  roles: string[];
}

const tokenKey = 'event_ticketing_token';
const userKey = 'event_ticketing_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(tokenKey);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(tokenKey, token);
    return;
  }

  localStorage.removeItem(tokenKey);
}

export function setStoredUser(user: AuthUser | null): void {
  if (user) {
    localStorage.setItem(userKey, JSON.stringify(user));
    return;
  }

  localStorage.removeItem(userKey);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(userKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}

export function hasRole(role: string): boolean {
  const user = getStoredUser();
  if (!user) {
    return false;
  }

  return user.roles.includes(role);
}

export function logout(): void {
  localStorage.removeItem(tokenKey);
  localStorage.removeItem(userKey);
}
