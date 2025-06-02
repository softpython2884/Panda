
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isCheckingAuthSession: boolean; // Renamed from isLoading
  login: (email: string, passsword: string) => Promise<boolean>;
  register: (email: string, passsword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuthSession, setIsCheckingAuthSession] = useState(true); // Tracks initial session check
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
    // This function's own loading state for UI elements (like buttons)
    // should be handled locally in the component calling it.
    // It directly sets the user state upon success.
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        toast({ title: "Login Successful", description: `Welcome back, ${data.user.email}!` });
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

  const register = async (email: string, passwordInput: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        // Do not show "You can now log in" here, as we will attempt auto-login.
        // The login function will show its own success/failure toasts.
        return true;
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
      setUser(null); // Clear user state
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
