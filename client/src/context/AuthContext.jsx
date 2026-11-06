import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY, USER_KEY } from '../lib/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  const storeSession = useCallback((token, nextUser) => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (nextUser) {
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setUser(nextUser);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => storeSession(null, data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeSession]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      storeSession(data.token, data.user);
      return data.user;
    },
    [storeSession]
  );

  const register = useCallback(
    async (payload) => {
      const { data } = await api.post('/auth/register', payload);
      storeSession(data.token, data.user);
      return data.user;
    },
    [storeSession]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Session is stateless on the server; local cleanup is still required.
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    storeSession(null, data.user);
    return data.user;
  }, [storeSession]);

  const updateUser = useCallback((nextUser) => storeSession(null, nextUser), [storeSession]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refresh, updateUser }),
    [user, loading, login, register, logout, refresh, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const homeFor = (role) =>
  role === 'ADMIN' ? '/admin' : role === 'OFFICER' ? '/officer' : '/app/dashboard';
