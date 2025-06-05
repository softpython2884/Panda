
"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, BellOff, CheckCheck, ExternalLink, MailQuestion } from 'lucide-react';
import type { NotificationDisplay, NotificationType } from '@/lib/schemas';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface NotificationsDropdownProps {
  setUnreadCount: (count: number) => void;
}

const notificationTypeIcons: Record<NotificationType, React.ElementType> = {
    info: MailQuestion, // Using MailQuestion as a generic info icon
    warning: MailQuestion, // Update with appropriate icons if available
    success: CheckCheck,
    error: MailQuestion,
    command_update: MailQuestion,
    admin_message: MailQuestion,
    system: MailQuestion,
};

const notificationTypeColors: Record<NotificationType, string> = {
    info: "text-blue-500",
    warning: "text-yellow-500",
    success: "text-green-500",
    error: "text-red-500",
    command_update: "text-purple-500",
    admin_message: "text-gray-600",
    system: "text-gray-500",
};


export default function NotificationsDropdown({ setUnreadCount }: NotificationsDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error: any) {
      toast({ title: "Erreur de Notifications", description: error.message, variant: "destructive" });
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [toast, setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark notification as read');
      }
      await fetchNotifications(); // Refresh notifications
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', { method: 'POST' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to mark all notifications as read');
      }
      await fetchNotifications(); // Refresh notifications
    } catch (error: any) {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  };
  
  const NotificationItem = ({ notif }: { notif: NotificationDisplay }) => {
    const Icon = notificationTypeIcons[notif.type] || MailQuestion;
    const colorClass = notificationTypeColors[notif.type] || "text-gray-500";

    const content = (
        <div className={cn("p-3 hover:bg-muted/50 transition-colors", !notif.isRead && "bg-primary/5")}>
            <div className="flex items-start gap-3">
                <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", colorClass)} />
                <div className="flex-grow">
                    <p className={cn("text-sm", !notif.isRead && "font-semibold")}>{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: fr })}
                    </p>
                </div>
                {!notif.isRead && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                        title="Marquer comme lu"
                    >
                        <CheckCheck className="h-4 w-4 text-primary" />
                    </Button>
                )}
            </div>
        </div>
    );
    
    if (notif.link) {
        return (
            <Link href={notif.link} passHref legacyBehavior>
                <a 
                    className="block cursor-pointer" 
                    onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                    target={notif.link.startsWith('http') ? '_blank' : '_self'}
                    rel={notif.link.startsWith('http') ? 'noopener noreferrer' : ''}
                >
                    {content}
                    {notif.link.startsWith('http') && <ExternalLink className="inline-block h-3 w-3 text-muted-foreground ml-1" />}
                </a>
            </Link>
        );
    }
    return <div onClick={() => !notif.isRead && handleMarkAsRead(notif.id)} className="cursor-pointer">{content}</div>;
  };


  return (
    <div className="w-full">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {notifications.some(n => !n.isRead) && (
             <Button variant="link" size="sm" onClick={handleMarkAllAsRead} className="p-0 h-auto text-xs">
                Tout marquer comme lu
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-2" />
          <p>Chargement des notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-8 flex flex-col items-center justify-center text-muted-foreground">
          <BellOff className="h-10 w-10 mb-3" />
          <p className="text-sm">Vous n'avez aucune notification pour le moment.</p>
        </div>
      ) : (
        <ScrollArea className="h-[300px] sm:h-[400px]">
          {notifications.map((notif, index) => (
            <React.Fragment key={notif.id}>
              <NotificationItem notif={notif} />
              {index < notifications.length - 1 && <Separator />}
            </React.Fragment>
          ))}
        </ScrollArea>
      )}
    </div>
  );
}

    