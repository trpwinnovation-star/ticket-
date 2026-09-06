'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role } from '@prisma/client';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  jobTitle?: string;
  avatar?: string;
  teamId?: string;
}

interface AuthContextType {
  currentUser: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: Role, jobTitle?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserSession: (updatedData: Partial<UserProfile>) => void;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from server cookie & localStorage on app load
  useEffect(() => {
    let isMounted = true;
    const restoreSession = async () => {
      try {
        const savedUser = localStorage.getItem('tp_user');
        localStorage.removeItem('tp_token');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        const res = await fetch('/api/v1/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('tp_user', JSON.stringify(data.user));
          }
        } else {
          if (isMounted) {
            setCurrentUser(null);
            localStorage.removeItem('tp_user');
          }
        }
      } catch (e) {
        if (isMounted) {
          setCurrentUser(null);
          localStorage.removeItem('tp_user');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Login failed. Please check your credentials.');
    }

    setCurrentUser(data.user);
    setToken(data.token);
    localStorage.setItem('tp_user', JSON.stringify(data.user));
  };

  const signup = async (name: string, email: string, password: string, role?: Role, jobTitle?: string) => {
    const res = await fetch('/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, jobTitle }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Signup failed.');
    }

    setCurrentUser(data.user);
    setToken(data.token);
    localStorage.setItem('tp_user', JSON.stringify(data.user));
  };

  const logout = async () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('tp_user');
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' });
    } catch {
      // ignore network errors on logout
    }
    window.location.href = '/login';
  };

  const updateUserSession = (updatedData: Partial<UserProfile>) => {
    if (!currentUser) return;
    const newProfile = { ...currentUser, ...updatedData };
    setCurrentUser(newProfile);
    localStorage.setItem('tp_user', JSON.stringify(newProfile));
  };

  const getAuthHeaders = (): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        isLoading,
        login,
        signup,
        logout,
        updateUserSession,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
