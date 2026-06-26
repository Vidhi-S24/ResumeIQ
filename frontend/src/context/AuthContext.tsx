import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import {
  loginUser,
  registerUser,
  getCurrentUser,
} from '../api/authApi';

export type UserRole = 'admin' | 'HR' | 'Recruiter';

export interface User {
  id: string;
  name: string;
  email: string;
  company_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    company_name: string;
  }) => Promise<boolean>;

  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');

    if (!token) {
      setIsInitializing(false);
      return;
    }

    getCurrentUser()
      .then((res) => setUser(res))
      .catch(() => {
        localStorage.removeItem('access_token');
        setUser(null);
      })
      .finally(() => setIsInitializing(false));
  }, []);

  // ---------------- LOGIN ----------------
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await loginUser({ email, password });
      localStorage.setItem('access_token', res.access_token);
      setUser(res.user);

      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SIGNUP ----------------
  const signup = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    company_name: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        company_name: data.company_name,
      });

      // auto-login after signup
      const res = await loginUser({
        email: data.email,
        password: data.password,
      });

      localStorage.setItem('access_token', res.access_token);
      setUser(res.user);

      return true;
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Signup failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGOUT ----------------
  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitializing,
        error,
        login,
        signup,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}