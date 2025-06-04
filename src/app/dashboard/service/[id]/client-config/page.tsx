
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ClipboardCopy, Download, AlertTriangleIcon } from 'lucide-react';
import Link from 'next/link';
import { FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_AUTH_TOKEN } from '@/lib/schemas';

interface ServiceConfigData {
  name: string;
  frpType: 'http' | 'https' | 'tcp' | 'udp';
  localPort: number;
  subdomain: string; // This is the 'domain' field from DB, which is the frp subdomain
}

const FRPC_EXE_URL = "https://github.com/softpython2884/Panda-reverse-proxy/releases/download/client/frpc.exe";

function generateFrpcToml(config: ServiceConfigData): string {
  let proxyConfig = `
[[proxies]]
name = "${config.name}"
type = "${config.frpType}"
localIP = "127.0.0.1"
localPort = ${config.localPort}
subdomain = "${config.subdomain}"
transport.tls.enable = true 
`;
  // According to frp docs, 'subdomain' is mainly for http/https.
  // For tcp/udp, frps needs to be configured to map subdomains to specific remote ports,
  // or the client would specify a remotePort. Given user's TOML structure, we assume frps handles it.
  // If frps expects remote_port for TCP/UDP, that logic needs to be added on frps side
  // or client needs to specify a remote_port.

  return `serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT}

auth.method = "token"
auth.token = "${FRP_AUTH_TOKEN}"

log.to = "console"
log.level = "info"
${proxyConfig}
`;
}

const RUN_BAT_CONTENT = `@echo off
title Lancement du tunnel PANDA
echo ==========================================
echo        Demarrage du tunnel Panda
echo ==========================================
echo.
echo Configuration:
echo   Serveur: ${FRP_SERVER_ADDR}:${FRP_SERVER_PORT}
echo.
echo Lancement de frpc.exe avec frpc.toml...
echo Si le tunnel ne demarre pas, verifiez votre fichier frpc.toml et que frpc.exe est dans ce dossier.
echo.

REM Lance frpc avec le fichier de config
frpc.exe -c frpc.toml

echo.
echo Tunnel arrete.
echo Si une erreur "authentication_failed" apparait, verifiez votre token dans frpc.toml et sur le serveur PANDA.
echo Appuyez sur une touche pour fermer.
pause >nul
exit
`;

export default function ClientConfigPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const serviceId = params.id as string;

  const [serviceConfig, setServiceConfig] = useState<ServiceConfigData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frpcTomlContent, setFrpcTomlContent] = useState('');

  useEffect(() => {
    if (!serviceId) return;
    setIsLoading(true);
    fetch(`/api/manager/service/${serviceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch service details for config generation');
        return res.json();
      })
      .then((data: ServiceConfigData) => { // API returns FrpServiceInput structure
        if (!data.name || !data.frpType || !data.localPort || !data.subdomain) {
            throw new Error('Incomplete service data received from API.');
        }
        setServiceConfig(data);
        setFrpcTomlContent(generateFrpcToml(data));
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching service for config:", err);
        setError(err.message || 'Could not load service configuration.');
        toast({ title: "Error", description: err.message, variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [serviceId, toast]);

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: `${label} copied to clipboard.` }))
      .catch(() => toast({ title: "Copy Failed", description: `Could not copy ${label}.`, variant: "destructive" }));
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading client configuration...</p>
      </div>
    );
  }

  if (error || !serviceConfig) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-5 w-5" />
          <AlertTitle>Error Loading Configuration</AlertTitle>
          <AlertDescription>{error || "Service data is unavailable."}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Button variant="outline" asChild className="mb-6">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">PANDA Tunnel Client Configuration</CardTitle>
          <CardDescription>
            Setup instructions for your service: <span className="font-semibold text-primary">{serviceConfig.name}</span> ({serviceConfig.subdomain}.{FRP_SERVER_BASE_DOMAIN})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Antivirus Warning!</AlertTitle>
            <AlertDescription>
              The PANDA Tunnel client (`frpc.exe`) might be flagged by some antivirus software. 
              This is a common issue with tunneling tools. Please add an exception for `frpc.exe` in your antivirus settings if this occurs.
              The software is open-source and its code can be inspected.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 1: Download `frpc.exe`</h3>
            <p className="text-sm text-muted-foreground">
              Download the PANDA Tunnel client executable.
            </p>
            <Button asChild variant="default">
              <a href={FRPC_EXE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download frpc.exe
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 2: Create `frpc.toml`</h3>
            <p className="text-sm text-muted-foreground">
              Create a file named <code className="bg-muted px-1 rounded">frpc.toml</code> in a new folder alongside the downloaded `frpc.exe`. 
              Copy the content below into this file.
            </p>
            <div className="relative p-4 bg-muted rounded-md border max-h-60 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap break-all"><code>{frpcTomlContent}</code></pre>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleCopyToClipboard(frpcTomlContent, 'frpc.toml content')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 3: Create `run.bat` (for Windows)</h3>
            <p className="text-sm text-muted-foreground">
              Create a file named <code className="bg-muted px-1 rounded">run.bat</code> in the same folder. 
              Copy the content below into this file. This script will start the tunnel.
            </p>
             <div className="relative p-4 bg-muted rounded-md border max-h-60 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap break-all"><code>{RUN_BAT_CONTENT}</code></pre>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 h-7 w-7"
                onClick={() => handleCopyToClipboard(RUN_BAT_CONTENT, 'run.bat content')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 4: Run the Tunnel</h3>
            <p className="text-sm text-muted-foreground">
              Ensure `frpc.exe`, `frpc.toml`, and `run.bat` are all in the same folder. Then, simply double-click `run.bat` to start your PANDA Tunnel!
              A command prompt window will open and show the tunnel status.
            </p>
          </div>
           <p className="text-xs text-muted-foreground">
            For Linux/macOS users: Save `frpc.toml`, download the appropriate `frpc` binary for your system from the 
            <a href="https://github.com/fatedier/frp/releases" target="_blank" rel="noopener noreferrer" className="underline"> official frp releases page</a>,
            make it executable (`chmod +x frpc`), and run `./frpc -c ./frpc.toml` in your terminal from the folder.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
