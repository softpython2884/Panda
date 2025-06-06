
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/lib/schemas';

interface User {
  id: string;
  email: string;
  username?: string;
  firstName?: string | null;
  lastName?: string | null;
  role: UserRole;
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
    // Ne pas remettre setIsCheckingAuthSession à true ici si une session est déjà en cours d'établissement par login/register
    // setIsCheckingAuthSession(true); // Initial check is fine
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
      setIsCheckingAuthSession(false); // This is the main point where initial check completes
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, passwordInput: string) => {
    setIsCheckingAuthSession(true); // Indiquer qu'une opération d'auth est en cours
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
        setIsCheckingAuthSession(false); // Fin de l'opération d'auth
        return true;
      } else {
        setUser(null);
        toast({ title: "Login Failed", description: data.error || "Invalid credentials", variant: "destructive" });
        setIsCheckingAuthSession(false); // Fin de l'opération d'auth
        return false;
      }
    } catch (error) {
      setUser(null);
      toast({ title: "Login Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsCheckingAuthSession(false); // Fin de l'opération d'auth
      return false;
    }
  };

  const register = async (username: string, email: string, passwordInput: string) => {
    setIsCheckingAuthSession(true); // Indiquer qu'une opération d'auth est en cours
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password: passwordInput }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user); // Auto-login
        const displayName = data.user.username || data.user.email;
        toast({ title: "Registration Successful", description: `Welcome, ${displayName}! Your account is created and you are now logged in.` });
        setIsCheckingAuthSession(false); // Fin de l'opération d'auth
        return true;
      } else {
        setUser(null);
        toast({ title: "Registration Failed", description: data.error || "Could not register user.", variant: "destructive" });
        setIsCheckingAuthSession(false); // Fin de l'opération d'auth
        return false;
      }
    } catch (error) {
      setUser(null);
      toast({ title: "Registration Error", description: "An unexpected error occurred.", variant: "destructive" });
      setIsCheckingAuthSession(false); // Fin de l'opération d'auth
      return false;
    }
  };

  const logout = async () => {
    setIsCheckingAuthSession(true); // Indiquer qu'une opération d'auth est en cours
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
       toast({ title: "Logout Error", description: "Failed to log out.", variant: "destructive" });
    } finally {
       setIsCheckingAuthSession(false); // Fin de l'opération d'auth
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
