
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface AuthContextType {
  user: User | null;
  isCheckingAuthSession: boolean;
  login: (email: string, passsword: string) => Promise<boolean>;
  register: (username: string, email: string, passsword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuthSession, setIsCheckingAuthSession] = useState(true);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    setIsCheckingAuthSession(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user", error);
      setUser(null);
    } finally {
      setIsCheckingAuthSession(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, passwordInput: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        const displayName = data.user.username || data.user.email;
        toast({ title: "Login Successful", description: `Welcome back, ${displayName}!` });
        return true;
      } else {
        toast({ title: "Login Failed", description: data.error || "Invalid credentials", variant: "destructive" });
        return false;
      }
    } catch (error) {
      toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
      return false;
    }
  };

  const register = async (username: string, email: string, passwordInput: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        // After successful registration, log the user in to populate the user context
        // and trigger fetchUser which is listened by other components.
        // This also ensures the user object in context includes all fields like username.
        // const loginSuccess = await login(email, passwordInput);
        // return loginSuccess; // Or just return true and let login handle toasts
        return true; // Caller will handle login
      } else {
        toast({ title: "Registration Failed", description: data.error || "Could not register user.", variant: "destructive" });
        return false;
      }
    } catch (error) {
      toast({ title: "Registration Error", description: "An unexpected error occurred.", variant: "destructive" });
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
       toast({ title: "Logout Error", description: "Failed to log out.", variant: "destructive" });
    }
  };


  return (
    <AuthContext.Provider value={{ user, isCheckingAuthSession, login, register, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
