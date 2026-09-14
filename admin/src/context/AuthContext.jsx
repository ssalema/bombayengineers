import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { refreshSession, setSessionExpiredHandler, tokenStore } from '../api/http';
import { authApi } from '../api/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | guest

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus('guest');
    // Drop cached private data; keep public settings for the login screen.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'settings' });
  }, [queryClient]);

  // Restore the session from the httpOnly refresh cookie on first load.
  useEffect(() => {
    let active = true;
    refreshSession()
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setStatus('authenticated');
      })
      .catch(() => active && setStatus('guest'));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(clearSession);
  }, [clearSession]);

  const login = useCallback(async (credentials) => {
    const { data } = await authApi.login(credentials);
    tokenStore.set(data.accessToken);
    setUser(data.user);
    setStatus('authenticated');
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  /** Applies a response carrying a fresh access token. */
  const applySession = useCallback(({ user: nextUser, accessToken }) => {
    if (accessToken) tokenStore.set(accessToken);
    if (nextUser) setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({ user, status, isAuthenticated: status === 'authenticated', login, logout, applySession }),
    [user, status, login, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
