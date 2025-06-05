
"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

type VerificationStatus = 'verifying' | 'success' | 'error' | 'already_verified';

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<VerificationStatus>('verifying');
  const [message, setMessage] = useState<string>('Verifying your email address...');

  useEffect(() => {
    if (token) {
      fetch(\`/api/auth/verify-email/\${token}\`)
        .then(async (res) => {
          const data = await res.json();
          if (res.ok) {
            if (data.message.includes('already verified')) {
                setStatus('already_verified');
            } else {
                setStatus('success');
            }
            setMessage(data.message);
          } else {
            setStatus('error');
            setMessage(data.error || 'An unknown error occurred during verification.');
          }
        })
        .catch((err) => {
          setStatus('error');
          setMessage('Failed to connect to the server for verification.');
          console.error("Verification fetch error:", err);
        });
    } else {
        setStatus('error');
        setMessage('Verification token is missing.');
    }
  }, [token]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">Email Verification</CardTitle>
          <CardDescription>
            {status === 'verifying' && 'Please wait while we verify your email...'}
            {status === 'success' && 'Your email has been successfully verified!'}
            {status === 'already_verified' && 'This email address has already been verified.'}
            {status === 'error' && 'There was a problem verifying your email.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'verifying' && (
            <div className="flex flex-col items-center">
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground">{message}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-green-600">{message}</p>
              <Button asChild className="mt-6">
                <Link href="/auth/login">Proceed to Login</Link>
              </Button>
            </div>
          )}
          {status === 'already_verified' && (
            <div className="flex flex-col items-center">
              <CheckCircle className="h-16 w-16 text-primary mb-4" />
              <p className="text-primary">{message}</p>
              <Button asChild className="mt-6">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="flex flex-col items-center">
              <XCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-destructive">{message}</p>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>If the problem persists, please ensure the link is correct or try registering again.</p>
              </div>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/auth/register">Register Again</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
