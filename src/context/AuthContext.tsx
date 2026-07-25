import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  savedListingIds: string[];
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  toggleSaveListing: (listingId: string) => void;
  isSaved: (listingId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_STORAGE_KEY = 'gotham_users_db_v1';
const SESSION_STORAGE_KEY = 'gotham_active_session_v1';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      return storedSession ? JSON.parse(storedSession) : null;
    } catch {
      return null;
    }
  });

  // Sync session state to LocalStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      // Update persistent DB user record
      try {
        const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};
        if (users[user.email.toLowerCase()]) {
          users[user.email.toLowerCase()].savedListingIds = user.savedListingIds;
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      } catch (e) {
        console.error('Failed to sync user storage:', e);
      }
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [user]);

  const signup = async (email: string, password: string, name: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password || !name) {
      return { success: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

      if (users[cleanEmail]) {
        return { success: false, error: 'An account with this email already exists.' };
      }

      const avatarSeed = encodeURIComponent(name);
      const newUser: User = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: cleanEmail,
        name: name.trim(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
        savedListingIds: [],
        createdAt: new Date().toISOString(),
      };

      users[cleanEmail] = {
        ...newUser,
        password, // stored locally for prototype authentication
      };

      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Failed to process account registration.' };
    }
  };

  const login = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both email and password.' };
    }

    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const users: Record<string, any> = usersRaw ? JSON.parse(usersRaw) : {};

      const existingUser = users[cleanEmail];
      if (!existingUser || existingUser.password !== password) {
        return { success: false, error: 'Invalid email or password.' };
      }

      const sessionUser: User = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        avatarUrl: existingUser.avatarUrl,
        savedListingIds: existingUser.savedListingIds || [],
        createdAt: existingUser.createdAt,
      };

      setUser(sessionUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Authentication failed. Please try again.' };
    }
  };

  const logout = () => {
    setUser(null);
  };

  const toggleSaveListing = (listingId: string) => {
    if (!user) return;

    setUser((prevUser) => {
      if (!prevUser) return null;
      const exists = prevUser.savedListingIds.includes(listingId);
      const updatedIds = exists
        ? prevUser.savedListingIds.filter((id) => id !== listingId)
        : [...prevUser.savedListingIds, listingId];

      return { ...prevUser, savedListingIds: updatedIds };
    });
  };

  const isSaved = (listingId: string) => {
    return !!user?.savedListingIds.includes(listingId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        signup,
        login,
        logout,
        toggleSaveListing,
        isSaved,
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
