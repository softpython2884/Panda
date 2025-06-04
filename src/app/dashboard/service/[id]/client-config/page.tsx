
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ClipboardCopy, Download, AlertTriangleIcon, Info, ExternalLink, Windows, Apple, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_AUTH_TOKEN, FRP_SERVER_BASE_DOMAIN, type FrpServiceType } from '@/lib/schemas';

interface ServiceConfigData {
  name: string;
  frpType: FrpServiceType;
  localPort: number;
  subdomain: string;
}

const PANDA_TUNNELS_CLIENT_EXE_URL_WINDOWS = "https://github.com/softpython2884/Panda-reverse-proxy/releases/download/client/PandaTunnels.exe";
const PANDA_TUNNELS_CLIENT_TAR_URL_LINUX = "https://github.com/fatedier/frp/releases/download/v0.62.1/frp_0.62.1_linux_amd64.tar.gz";
const FRP_OFFICIAL_RELEASES_URL = "https://github.com/fatedier/frp/releases";


function generatePandaConfigToml(config: ServiceConfigData): string {
  // Le contenu du fichier de configuration utilise toujours les noms de paramètres attendus par l'exécutable frp/PandaTunnels.exe
  let pandaconfigToml = `serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT}

auth.method = "token"
auth.token = "${FRP_AUTH_TOKEN}" # This token MUST match the one in your Panda Tunnels Server

log.to = "console" # You can change this to a file path e.g., "./pandaclient.log"
log.level = "info" # Other levels: trace, debug, warn, error
transport.tls.enable = true # Encrypts communication with the Panda Tunnels Server, recommended.

`;

  pandaconfigToml += `
[[proxies]]
name = "${config.name}" # This is an identifier for the proxy
type = "${config.frpType}"
localIP = "127.0.0.1" # Assumes your service runs on the same machine as the Panda Tunnels Client
localPort = ${config.localPort}
`;

  // 'subdomain' est utilisé pour les types http/https et peut être informatif pour les autres,
  // en fonction de la configuration du Panda Tunnels Server (frps).
  if (config.subdomain) {
    pandaconfigToml += `subdomain = "${config.subdomain}"\n`;
  }
  
  if (config.frpType === "stcp" || config.frpType === "xtcp") {
    pandaconfigToml += `# For STCP/XTCP, you might need a secretKey. Add it here if your Panda Tunnels Server requires it:\n`;
    pandaconfigToml += `# secretKey = "your_very_secret_key_here"\n`;
  }

  return pandaconfigToml;
}


const RUN_BAT_CONTENT_TEMPLATE_WINDOWS = `@echo off
title Lancement du tunnel PANDA pour {SERVICE_NAME}
echo ========================================================
echo        Demarrage du tunnel PANDA
echo        Service: {SERVICE_NAME}
echo ========================================================
echo.
echo Configuration:
echo   Serveur PANDA Tunnels: ${FRP_SERVER_ADDR}:${FRP_SERVER_PORT}
echo   Type de tunnel: {FRP_TYPE}
echo   Port Local: {LOCAL_PORT}
echo   Sous-domaine expose: {SUBDOMAIN}.${FRP_SERVER_BASE_DOMAIN}
echo.
echo Lancement de PandaTunnels.exe avec pandaconfig.toml...
echo Si le tunnel ne demarre pas, verifiez:
echo   1. Votre fichier pandaconfig.toml est correct.
echo   2. PandaTunnels.exe est dans ce dossier.
echo   3. Le token dans pandaconfig.toml correspond a celui du serveur PANDA Tunnels.
echo   4. Votre service local sur le port {LOCAL_PORT} est bien demarre.
echo.

REM Lance PandaTunnels.exe avec le fichier de config
PandaTunnels.exe -c pandaconfig.toml

echo.
echo Tunnel arrete.
echo Si une erreur "authentication_failed" apparait, verifiez votre token dans pandaconfig.toml.
echo Si une erreur "proxy [xxx] start error: port already used", un autre programme utilise le port {LOCAL_PORT} ou le port distant sur le serveur est pris.
echo Appuyez sur une touche pour fermer cette fenetre.
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

  const [pandaConfigTomlContent, setPandaConfigTomlContent] = useState('');
  const [runBatSubstituted, setRunBatSubstituted] = useState('');


  useEffect(() => {
    if (!serviceId) return;
    setIsLoading(true);
    fetch(`/api/manager/service/${serviceId}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => { throw new Error(errData.error || 'Failed to fetch service details for config generation')});
        }
        return res.json();
      })
      .then((data: ServiceConfigData) => {
        if (!data.name || !data.frpType || data.localPort === undefined || !data.subdomain) {
            throw new Error('Incomplete service data received from API. Required fields are missing.');
        }
        setServiceConfig(data);
        setPandaConfigTomlContent(generatePandaConfigToml(data));
        
        let batContent = RUN_BAT_CONTENT_TEMPLATE_WINDOWS.replace(/{SERVICE_NAME}/g, data.name);
        batContent = batContent.replace(/{FRP_TYPE}/g, data.frpType.toUpperCase());
        batContent = batContent.replace(/{LOCAL_PORT}/g, String(data.localPort));
        batContent = batContent.replace(/{SUBDOMAIN}/g, data.subdomain);
        setRunBatSubstituted(batContent);

        setError(null);
      })
      .catch(err => {
        console.error("Error fetching service for config:", err);
        setError(err.message || 'Could not load service configuration.');
        toast({ title: "Error Loading Config", description: err.message, variant: "destructive" });
      })
      .finally(() => setIsLoading(false));
  }, [serviceId, toast]);

  const handleCopyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
        .then(() => toast({ title: "Copied!", description: `${label} copied to clipboard.` }))
        .catch(() => toast({ title: "Copy Failed", description: `Could not copy ${label}. Please copy manually.`, variant: "destructive" }));
    } else {
        toast({ title: "Copy Unavailable", description: `Clipboard access is not available in this context (e.g. non-HTTPS). Please copy ${label} manually.`, variant: "destructive" });
        console.warn("navigator.clipboard.writeText is not available.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading Panda Tunnels Client setup...</p>
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Button variant="outline" asChild className="mb-6 print:hidden">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Panda Tunnels Client Setup Guide</CardTitle>
          <CardDescription>
            This guide helps you connect your local service: <strong className="text-primary">{serviceConfig.name}</strong> to the PANDA Network.
            <br />
            Your service will be accessible via: <code className="text-sm bg-muted px-1 rounded">{serviceConfig.subdomain}.{FRP_SERVER_BASE_DOMAIN}</code>
            <br />
            Local Service Details: <code className="text-sm bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> (Type: {serviceConfig.frpType.toUpperCase()})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Antivirus Warning!</AlertTitle>
            <AlertDescription>
              The Panda Tunnels Client (<code className="font-mono bg-destructive-foreground/20 px-1 rounded text-destructive-foreground font-bold text-red-700">PandaTunnels.exe</code> or the Linux equivalent) might be flagged as potentially unwanted software by some antivirus programs.
              This is common for tunneling tools due to their nature. Please ensure you download it from the official links provided and, if necessary, add an exception for the client executable in your antivirus settings.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <Info className="h-5 w-5" />
            <AlertTitle>Important Setup Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1">
                <li>The <code className="font-mono bg-muted px-1 rounded">auth.token</code> in <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code> (below) is crucial. It **must exactly match** the token configured on your Panda Tunnels Server. PANDA uses the `FRP_AUTH_TOKEN` environment variable (defaulting to &quot;supersecret&quot; if not set).</li>
                <li>If you edit this service&apos;s settings in the PANDA dashboard (e.g., change port, subdomain), you **must** come back to this page, copy the updated <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code> content, and **restart your local Panda Tunnels Client** for changes to take effect.</li>
                <li>PANDA generates client configurations; it does not directly control or update running Panda Tunnels Server instances or Panda Tunnels Clients.</li>
                 <li>Ensure your local service (e.g., web server, game server) is running on <code className="font-mono bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> before starting the tunnel.</li>
              </ul>
            </AlertDescription>
          </Alert>


          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 1: Download Panda Tunnels Client</h3>
            <p className="text-sm text-muted-foreground">
              Create a new folder on your computer for this tunnel (e.g., <code className="font-mono bg-muted px-1 rounded">C:\PANDA-Tunnels\{serviceConfig.name}</code>).
              Download the client executable appropriate for your system into this folder.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="default" className="w-full">
                  <a href={PANDA_TUNNELS_CLIENT_EXE_URL_WINDOWS} target="_blank" rel="noopener noreferrer">
                    <Windows className="mr-2 h-5 w-5" /> Download for Windows (<code className="font-mono bg-primary-foreground/20 px-1 rounded text-primary-foreground">PandaTunnels.exe</code>)
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={PANDA_TUNNELS_CLIENT_TAR_URL_LINUX} target="_blank" rel="noopener noreferrer">
                    <MonitorPlay className="mr-2 h-5 w-5" /> Download for Linux (AMD64 .tar.gz)
                  </a>
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2">
                <strong>Linux Users:</strong> After downloading the <code className="font-mono bg-muted px-1 rounded">.tar.gz</code>, extract its contents. You will find several files. You only need the <code className="font-mono bg-muted px-1 rounded">frpc</code> binary. You can rename it to <code className="font-mono bg-muted px-1 rounded">PandaTunnelsClient</code> if you wish. Delete all files related to <code className="font-mono bg-muted px-1 rounded">frps</code> (server files) from the extracted archive as they are not needed for the client. Make the client binary executable (<code className="font-mono bg-muted px-1 rounded">chmod +x ./PandaTunnelsClient</code> or <code className="font-mono bg-muted px-1 rounded">chmod +x ./frpc</code>).
             </p>
            <p className="text-xs text-muted-foreground">
                <strong>macOS Users:</strong> A pre-compiled Panda Tunnels Client for macOS is not currently provided. You may be able to compile <code className="font-mono bg-muted px-1 rounded">frp</code> from source or find compatible binaries on the <a href={FRP_OFFICIAL_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">official frp releases page <ExternalLink className="inline h-3 w-3"/></a>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 2: Create Client Configuration File (<code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>)</h3>
            <p className="text-sm text-muted-foreground">
              In the folder you created, create a new text file named <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>.
              Copy the exact content below and paste it into this file. (Note: The executable `PandaTunnels.exe` or `frpc` expects a config file. If you name it exactly `frpc.toml` in the same directory as the executable, you might not need the `-c` flag when running it, but using `-c pandaconfig.toml` is more explicit.)
            </p>
            <div className="relative p-4 bg-muted rounded-md border max-h-80 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-all"><code>{pandaConfigTomlContent}</code></pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 print:hidden"
                onClick={() => handleCopyToClipboard(pandaConfigTomlContent, 'pandaconfig.toml content')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                For advanced customization options not covered by PANDA's interface, you can manually edit this <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code> file. Refer to the <a href="https://gofrp.org/docs/examples/client/" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">official frp client documentation <ExternalLink className="inline h-3 w-3"/></a> for all available parameters.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 3 (Windows): Create Startup Script (<code className="font-mono bg-muted px-1 rounded">run.bat</code>)</h3>
            <p className="text-sm text-muted-foreground">
              For Windows users, in the same folder, create another new text file named <code className="font-mono bg-muted px-1 rounded">run.bat</code>.
              Copy the content below into this file. This script will start the tunnel using your <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>.
            </p>
             <div className="relative p-4 bg-muted rounded-md border max-h-60 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-all"><code>{runBatSubstituted}</code></pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 print:hidden"
                onClick={() => handleCopyToClipboard(runBatSubstituted, 'run.bat content')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 4: Run the Tunnel</h3>
            <p className="text-sm text-muted-foreground">
             <strong>Windows:</strong> Ensure <code className="font-mono bg-muted px-1 rounded">PandaTunnels.exe</code>, <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>, and <code className="font-mono bg-muted px-1 rounded">run.bat</code> are all in the same folder. Then, simply double-click <code className="font-mono bg-muted px-1 rounded">run.bat</code> to start your Panda Tunnel.
            </p>
             <p className="text-sm text-muted-foreground">
              <strong>Linux:</strong> Navigate to the folder in your terminal. Run the client using the command: <code className="font-mono bg-muted px-1 rounded">./PandaTunnelsClient -c ./pandaconfig.toml</code> (or <code className="font-mono bg-muted px-1 rounded">./frpc -c ./pandaconfig.toml</code> if you kept the original name).
             </p>
            <p className="text-sm text-muted-foreground mt-1">
              A terminal window will open and show the tunnel status and logs. Keep this window open as long as you want your tunnel to be active.
            </p>
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
             <Button onClick={() => typeof window !== 'undefined' && window.print()} variant="outline"><Download className="mr-2 h-4 w-4" /> Print / Save PDF Instructions</Button>
        </CardFooter>
      </Card>
      
    </div>
  );
}


    