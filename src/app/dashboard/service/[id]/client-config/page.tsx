
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ClipboardCopy, Download, AlertTriangleIcon, Info } from 'lucide-react';
import Link from 'next/link';
import { FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_AUTH_TOKEN, FRP_SERVER_BASE_DOMAIN } from '@/lib/schemas';

interface ServiceConfigData {
  name: string;
  frpType: 'http' | 'https' | 'tcp' | 'udp' | 'stcp' | 'xtcp';
  localPort: number;
  subdomain: string;
}

const FRPC_EXE_URL = "https://github.com/softpython2884/Panda-reverse-proxy/releases/download/client/frpc.exe";
// Note: frpc binaries for other OS (Linux, macOS) are available at https://github.com/fatedier/frp/releases

function generateFrpcToml(config: ServiceConfigData): string {
  // Base configuration, always included
  let frpcToml = `serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT}

auth.method = "token"
auth.token = "${FRP_AUTH_TOKEN}" # This token MUST match the one in your frps.toml on the server

log.to = "console" # You can change this to a file path e.g., "./frpc.log"
log.level = "info" # Other levels: trace, debug, warn, error
transport.tls.enable = true # Encrypts communication between frpc and frps, recommended

`;

  // Proxy specific configuration
  frpcToml += `
[[proxies]]
name = "${config.name}" # This is an identifier for the proxy
type = "${config.frpType}"
localIP = "127.0.0.1" # Assumes your service runs on the same machine as frpc
localPort = ${config.localPort}
`;

  // Subdomain is primarily for http and https. For other types, it might require specific frps setup (e.g. tcpmux)
  // or frps might ignore it if not configured for subdomain-based routing for these types.
  // However, as per user's desired TOML structure, we include it.
  if (config.subdomain) {
    frpcToml += `subdomain = "${config.subdomain}"\n`;
  }

  // Add advanced options here if they were part of FrpServiceInput and collected from user
  // Example (if these fields were in ServiceConfigData):
  // if (config.useEncryption) {
  //   frpcToml += `transport.useEncryption = true\n`;
  // }
  // if (config.useCompression) {
  //   frpcToml += `transport.useCompression = true\n`;
  // }
  // if (config.frpType === "http" && config.locations) {
  //   frpcToml += `customDomains = "${config.subdomain}.${FRP_SERVER_BASE_DOMAIN}"\n`; // customDomains is often used with locations
  //   frpcToml += `locations = "${config.locations}"\n`;
  // }
  // if (config.frpType === "http" && config.hostHeaderRewrite) {
  //    frpcToml += `hostHeaderRewrite = "${config.hostHeaderRewrite}"\n`;
  // }


  // For STCP and XTCP, a secretKey is often used.
  // PANDA doesn't manage this key yet. User would need to add it manually if required by their frps setup.
  if (config.frpType === "stcp" || config.frpType === "xtcp") {
    frpcToml += `# For STCP/XTCP, you might need a secretKey. Add it here if your frps requires it:\n`;
    frpcToml += `# secretKey = "your_secret_key"\n`;
  }


  return frpcToml;
}

function generateFrpsTomlExample(): string {
  return `# frps.toml (Example Server Configuration)
# Save this on your server where frps will run.

# Port for frpc clients to connect to frps.
bindPort = ${FRP_SERVER_PORT}

# Authentication token. MUST match the token in frpc.toml and PANDA's FRP_AUTH_TOKEN env variable.
auth.token = "${FRP_AUTH_TOKEN}"

# Subdomain configuration for HTTP/HTTPS services.
# Your DNS for *.${FRP_SERVER_BASE_DOMAIN} (e.g., *.panda.nationquest.fr) must point to this server's public IP.
subdomainHost = "${FRP_SERVER_BASE_DOMAIN}"
vhostHTTPPort = 80 # Port frps listens on for HTTP requests to subdomains (e.g., http://sub.yourdomain.com)
vhostHTTPSPort = 443 # Port frps listens on for HTTPS requests (requires TLS certs configured below)

# For TLS on vhostHTTPSPort (optional, but recommended for HTTPS subdomains)
# tls.certFile = "/path/to/your/fullchain.pem"
# tls.keyFile = "/path/to/your/privkey.pem"

# Enable dashboard (optional)
# webServer.addr = "0.0.0.0" # Listen on all interfaces
# webServer.port = 7500      # Port for dashboard
# webServer.user = "admin"
# webServer.password = "admin_password"

# Log settings
log.to = "./frps.log" # Or "console"
log.level = "info"
log.maxDays = 3

# To make subdomains work for TCP/UDP types as {subdomain}.${FRP_SERVER_BASE_DOMAIN},
# you might need more advanced frps configurations like:
# tcpmuxHTTPConnectPort = 7001 # And clients use type = "tcpmux", multiplexer = "httpconnect"
# Or a Virtual Network (TUN/TAP device) setup with frp.
# The basic subdomainHost above primarily works for HTTP/HTTPS.
# For simple TCP/UDP, frpc usually specifies a 'remotePort' that frps listens on.
# If your frpc.toml uses 'subdomain' for TCP/UDP, ensure your frps handles it.
`;
}


const RUN_BAT_CONTENT = `@echo off
title Lancement du tunnel PANDA
echo ==========================================
echo        Demarrage du tunnel Panda
echo ==========================================
echo.
echo Configuration:
echo   Serveur PANDA FRP: ${FRP_SERVER_ADDR}:${FRP_SERVER_PORT}
echo   Votre sous-domaine (pour HTTP/S): ${"{subdomain}"}.${FRP_SERVER_BASE_DOMAIN}
echo.
echo Lancement de frpc.exe avec frpc.toml...
echo Si le tunnel ne demarre pas, verifiez votre fichier frpc.toml 
echo et que frpc.exe est dans ce dossier.
echo Verifiez aussi que le token dans frpc.toml correspond a celui du serveur FRP.
echo.

REM Lance frpc avec le fichier de config
frpc.exe -c frpc.toml

echo.
echo Tunnel arrete.
echo Si une erreur "authentication_failed" apparait, verifiez votre token dans frpc.toml.
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
  const [runBatSubstituted, setRunBatSubstituted] = useState('');
  const [frpsTomlExample, setFrpsTomlExample] = useState('');


  useEffect(() => {
    if (!serviceId) return;
    setIsLoading(true);
    fetch(`/api/manager/service/${serviceId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch service details for config generation');
        return res.json();
      })
      .then((data: ServiceConfigData) => {
        if (!data.name || !data.frpType || data.localPort === undefined || !data.subdomain) {
            throw new Error('Incomplete service data received from API.');
        }
        setServiceConfig(data);
        setFrpcTomlContent(generateFrpcToml(data));
        setRunBatSubstituted(RUN_BAT_CONTENT.replace('${"{subdomain}"}', data.subdomain));
        setFrpsTomlExample(generateFrpsTomlExample());
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
      <Button variant="outline" asChild className="mb-6 print:hidden">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">PANDA Tunnel Client Setup</CardTitle>
          <CardDescription>
            Instructions for your service: <span className="font-semibold text-primary">{serviceConfig.name}</span>
            <br />
            Public Access (HTTP/S): <code className="text-sm bg-muted px-1 rounded">{serviceConfig.subdomain}.{FRP_SERVER_BASE_DOMAIN}</code>
            <br />
            Local Service: <code className="text-sm bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> ({serviceConfig.frpType.toUpperCase()})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Antivirus Warning!</AlertTitle>
            <AlertDescription>
              The PANDA Tunnel client (<code className="font-mono bg-destructive-foreground/20 px-1 rounded">frpc.exe</code>) might be flagged by some antivirus software.
              This is a common issue with tunneling tools. Please add an exception for <code className="font-mono bg-destructive-foreground/20 px-1 rounded">frpc.exe</code> in your antivirus settings if this occurs.
              The software is open-source (<a href="https://github.com/fatedier/frp" target="_blank" rel="noopener noreferrer" className="underline">frp by fatedier</a>) and its code can be inspected.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <Info className="h-5 w-5" />
            <AlertTitle>Important Notes</AlertTitle>
            <AlertDescription>
              <ul>
                <li className="mb-1">- The <code className="font-mono bg-muted px-1 rounded">auth.token</code> in <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> below is based on PANDA&apos;s configuration. It **must** match the token set in your <code className="font-mono bg-muted px-1 rounded">frps.toml</code> on your server.</li>
                <li className="mb-1">- If you edit this service in PANDA, you must regenerate/copy the new <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> and restart your <code className="font-mono bg-muted px-1 rounded">frpc.exe</code> client.</li>
                <li>- PANDA helps you generate client configurations; it does not directly control your running <code className="font-mono bg-muted px-1 rounded">frps</code> server or <code className="font-mono bg-muted px-1 rounded">frpc</code> clients.</li>
              </ul>
            </AlertDescription>
          </Alert>


          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 1: Download PANDA Tunnel Client (<code className="font-mono bg-muted px-1 rounded">frpc.exe</code> for Windows)</h3>
            <p className="text-sm text-muted-foreground">
              Download the client executable. For other operating systems (Linux, macOS), get the appropriate <code className="font-mono bg-muted px-1 rounded">frpc</code> binary from the official <a href="https://github.com/fatedier/frp/releases" target="_blank" rel="noopener noreferrer" className="underline">frp releases page</a>.
            </p>
            <Button asChild variant="default">
              <a href={FRPC_EXE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download frpc.exe (Windows)
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 2: Create Client Configuration File (<code className="font-mono bg-muted px-1 rounded">frpc.toml</code>)</h3>
            <p className="text-sm text-muted-foreground">
              Create a file named <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> in a new folder. Place the downloaded <code className="font-mono bg-muted px-1 rounded">frpc.exe</code> (or other OS binary) in this same folder.
              Copy the content below into <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>.
            </p>
            <div className="relative p-4 bg-muted rounded-md border max-h-80 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-all"><code>{frpcTomlContent}</code></pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 print:hidden"
                onClick={() => handleCopyToClipboard(frpcTomlContent, 'frpc.toml content')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Step 3: Create Startup Script (<code className="font-mono bg-muted px-1 rounded">run.bat</code> for Windows)</h3>
            <p className="text-sm text-muted-foreground">
              Create a file named <code className="font-mono bg-muted px-1 rounded">run.bat</code> in the same folder.
              Copy the content below into this file. This script will start the tunnel.
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
            <h3 className="text-lg font-semibold">Step 4: Run the Tunnel</h3>
            <p className="text-sm text-muted-foreground">
              Ensure <code className="font-mono bg-muted px-1 rounded">frpc.exe</code>, <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>, and <code className="font-mono bg-muted px-1 rounded">run.bat</code> are all in the same folder. Then, simply double-click <code className="font-mono bg-muted px-1 rounded">run.bat</code> to start your PANDA Tunnel!
              A command prompt window will open and show the tunnel status.
            </p>
             <p className="text-xs text-muted-foreground">
              <strong className="font-semibold">For Linux/macOS users:</strong> Save <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>, download the appropriate <code className="font-mono bg-muted px-1 rounded">frpc</code> binary,
              make it executable (<code className="font-mono bg-muted px-1 rounded">chmod +x frpc</code>), and run <code className="font-mono bg-muted px-1 rounded">./frpc -c ./frpc.toml</code> in your terminal from the folder.
             </p>
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
             <Button onClick={() => window.print()} variant="outline"><Download className="mr-2 h-4 w-4" /> Print/Save PDF Instructions</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Example Server Configuration (<code className="font-mono bg-muted px-1 rounded">frps.toml</code>)</CardTitle>
          <CardDescription>
            This is a basic example configuration for your <code className="font-mono bg-muted px-1 rounded">frps</code> server (which should run on <code className="font-mono bg-muted px-1 rounded">{FRP_SERVER_ADDR}</code>).
            You will need to adapt it to your server environment and security needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative p-4 bg-muted rounded-md border max-h-96 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap break-all"><code>{frpsTomlExample}</code></pre>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-7 w-7 print:hidden"
              onClick={() => handleCopyToClipboard(frpsTomlExample, 'frps.toml example')}
            >
              <ClipboardCopy className="h-4 w-4" />
            </Button>
          </div>
           <p className="text-xs text-muted-foreground mt-2">
            Refer to the official <a href="https://github.com/fatedier/frp/blob/master/conf/frps_full_example.ini" target="_blank" rel="noopener noreferrer" className="underline">full frps configuration example</a> for all available options.
            Remember to restart your <code className="font-mono bg-muted px-1 rounded">frps</code> service after changing its configuration.
           </p>
        </CardContent>
      </Card>


    </div>
  );
}
