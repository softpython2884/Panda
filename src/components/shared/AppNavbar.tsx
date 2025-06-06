
"use client";
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { Home, Search as SearchIcon, LogIn, UserPlus, LayoutDashboard, LogOut, Settings, PawPrint, UserCircle, Bell, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AppNavbar() {
  const { user, logout, isCheckingAuthSession } = useAuth();
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const { toast } = useToast();

  const fetchNotificationCount = useCallback(async () => {
    if (!user) {
      setUnreadNotificationsCount(0);
      return;
    }
    // Only set loading if not already loading to prevent visual jitter on rapid calls
    if (!isLoadingNotifications) setIsLoadingNotifications(true);
    try {
      const response = await fetch('/api/notifications'); 
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationsCount(data.unreadCount || 0);
      } else {
        setUnreadNotificationsCount(0);
      }
    } catch (error) {
      setUnreadNotificationsCount(0);
    } finally {
      setIsLoadingNotifications(false);
    }
  }, [user, isLoadingNotifications]); // Added isLoadingNotifications to dependency array

  useEffect(() => {
    if (user) {
      fetchNotificationCount();
      // Optional: set an interval to poll for notification count
      const intervalId = setInterval(fetchNotificationCount, 60000); // e.g., every 1 minute
      return () => clearInterval(intervalId);
    } else {
      setUnreadNotificationsCount(0);
    }
  }, [user, fetchNotificationCount]);


  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
          <PawPrint className="h-7 w-7" />
          <h1 className="text-2xl font-headline font-bold">PANDA</h1>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/search" className="flex items-center gap-1">
              <SearchIcon className="h-4 w-4" /> Search
            </Link>
          </Button>

          {isCheckingAuthSession ? (
             <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : user ? (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard" className="flex items-center gap-1">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/settings/profile" className="flex items-center gap-1">
                  <UserCircle className="h-4 w-4" /> Settings
                </Link>
              </Button>
              <Popover onOpenChange={(open) => { if (open) fetchNotificationCount(); }}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
                    {isLoadingNotifications ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
                    {!isLoadingNotifications && unreadNotificationsCount > 0 && (
                      <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 sm:w-96 p-0" align="end">
                  <NotificationsDropdown setUnreadCount={setUnreadNotificationsCount} />
                </PopoverContent>
              </Popover>
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
    
