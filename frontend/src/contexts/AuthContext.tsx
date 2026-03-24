import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthUser } from '@/services/authSession';
import { getStoredUser, setStoredUser, logout as sessionLogout } from '@/services/authSession';
import { setAuthToken } from '@/services/apiClient';

interface AuthContextValue {
  user: AuthUser | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  const login = useCallback((newUser: AuthUser, token: string) => {
    setAuthToken(token);
    setStoredUser(newUser);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    sessionLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
