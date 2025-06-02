
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
  isLoading: boolean;
  login: (email: string, passsword: string) => Promise<boolean>;
  register: (email: string, passsword: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, passwordInput: string) => {
    setIsLoading(true);
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
        setIsLoading(false);
        return true;
      } else {
        toast({ title: "Login Failed", description: data.error || "Invalid credentials", variant: "destructive" });
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, passwordInput: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok) {
        // Optionally log in user directly after registration
        // For now, just show success and let them log in.
        toast({ title: "Registration Successful", description: "You can now log in." });
        setIsLoading(false);
        return true;
      } else {
        toast({ title: "Registration Failed", description: data.error || "Could not register user.", variant: "destructive" });
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      toast({ title: "Registration Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
       toast({ title: "Logout Error", description: "Failed to log out.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, fetchUser }}>
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

