
"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// This page just redirects to the default settings section (profile)
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings/profile');
  }, [router]);

  return null; // Or a loading spinner, but redirect is usually fast enough
}
