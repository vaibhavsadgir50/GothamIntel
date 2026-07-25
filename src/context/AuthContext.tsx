import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  role: UserRole;
  companyName?: string;
  bio?: string;
  savedListingIds: string[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  signup: (payload: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    companyName?: string;
    bio?: string;
  }) => Promise<{ success: boolean; error?: string; user?: User }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  toggleSaveListing: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
  authHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_STORAGE_KEY = 'gotham_active_session_v2';
const TOKEN_STORAGE_KEY = 'gotham_auth_token_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  const persistSession = useCallback((nextUser: User | null, nextToken: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    if (nextUser && nextToken) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser));
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const authHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  // Validate session against server on mount
  useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (!cancelled) persistSession(null, null);
        } else {
          const data = await res.json();
          if (!cancelled) persistSession(data.user, token);
        }
      } catch {
        // keep local session if offline
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    hydrate();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const signup = async (payload: {
    email: string;
    password: string;
    name: string;
    role?: UserRole;
    companyName?: string;
    bio?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to register account.' };
      persistSession(data.user, data.token);
      return { success: true, user: data.user as User };
    } catch {
      return { success: false, error: 'Failed to process account registration.' };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Failed to sign in.' };
      persistSession(data.user, data.token);
      return { success: true, user: data.user as User };
    } catch {
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  };

  const logout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => undefined);
    }
    persistSession(null, null);
  };

  const toggleSaveListing = (listingId: string) => {
    if (!user || !token) return;

    setUser((prevUser) => {
      if (!prevUser) return null;
      const exists = prevUser.savedListingIds.includes(listingId);
      const updatedIds = exists
        ? prevUser.savedListingIds.filter((id) => id !== listingId)
        : [...prevUser.savedListingIds, listingId];
      const next = { ...prevUser, savedListingIds: updatedIds };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(next));

      fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ savedListingIds: updatedIds }),
      }).catch(() => undefined);

      return next;
    });
  };

  const isSaved = (listingId: string) => !!user?.savedListingIds.includes(listingId);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        signup,
        login,
        logout,
        toggleSaveListing,
        isSaved,
        authHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
