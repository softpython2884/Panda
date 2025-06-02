
"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Home, Search as SearchIcon, LogIn, UserPlus, LayoutDashboard, LogOut, Settings, ShieldCheck } from 'lucide-react';

export default function AppNavbar() {
  const { user, logout, isLoading } = useAuth();

  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-7 w-7" />
          <h1 className="text-2xl font-headline font-bold">PANDA</h1>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search" className="flex items-center gap-1">
              <SearchIcon className="h-4 w-4" /> Search
            </Link>
          </Button>

          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>Loading...</Button>
          ) : user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/manager" className="flex items-center gap-1">
                  <Settings className="h-4 w-4" /> Manage
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-1">
                <LogOut className="h-4 w-4" /> Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login" className="flex items-center gap-1">
                  <LogIn className="h-4 w-4" /> Login
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link href="/auth/register" className="flex items-center gap-1">
                  <UserPlus className="h-4 w-4" /> Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
