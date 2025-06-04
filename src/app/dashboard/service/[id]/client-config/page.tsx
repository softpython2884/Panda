
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ClipboardCopy, Download, AlertTriangleIcon, Info, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_AUTH_TOKEN, FRP_SERVER_BASE_DOMAIN, type FrpServiceType } from '@/lib/schemas';

interface ServiceConfigData {
  name: string;
  frpType: FrpServiceType;
  localPort: number;
  subdomain: string;
}

const FRPC_EXE_URL = "https://github.com/softpython2884/Panda-reverse-proxy/releases/download/client/frpc.exe";
const FRP_OFFICIAL_RELEASES_URL = "https://github.com/fatedier/frp/releases";
const FRP_FULL_CONFIG_EXAMPLE_URL = "https://github.com/fatedier/frp/blob/master/conf/frps_full_example.toml";


function generateFrpcToml(config: ServiceConfigData): string {
  let frpcToml = `serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT}

auth.method = "token"
auth.token = "${FRP_AUTH_TOKEN}" # This token MUST match the one in your frps.toml on the server

log.to = "console" # You can change this to a file path e.g., "./frpc.log"
log.level = "info" # Other levels: trace, debug, warn, error
transport.tls.enable = true # Encrypts communication between frpc and frps, recommended for security.

`;

  frpcToml += `
[[proxies]]
name = "${config.name}" # This is an identifier for the proxy
type = "${config.frpType}"
localIP = "127.0.0.1" # Assumes your service runs on the same machine as frpc
localPort = ${config.localPort}
`;

  // Subdomain is primarily for http and https. 
  // For TCP/UDP, frps needs specific configuration (like tcpmux or custom VHOST handling for TCP/UDP) for subdomains to route correctly.
  // If frps is not set up for this, frpc will try to register the subdomain but frps might ignore it or require a remote_port.
  // PANDA currently generates it assuming frps can handle subdomains for all selected types.
  if (config.subdomain) {
    frpcToml += `subdomain = "${config.subdomain}"\n`;
  }
  
  // Note for advanced users:
  // You can add more frp options here based on the official frp documentation,
  // such as transport.useEncryption, transport.useCompression, customDomains, locations, hostHeaderRewrite, etc.
  // Example for STCP/XTCP (if you're using these types):
  if (config.frpType === "stcp" || config.frpType === "xtcp") {
    frpcToml += `# For STCP/XTCP, you might need a secretKey. Add it here if your frps requires it:\n`;
    frpcToml += `# secretKey = "your_very_secret_key_here"\n`;
  }

  return frpcToml;
}

function generateFrpsTomlExample(): string {
  return `# frps.toml (Example Server Configuration)
# Save this on your server where frps will run.

# Port for frpc clients to connect to frps.
bindPort = ${FRP_SERVER_PORT}

# Authentication token. MUST match the token in frpc.toml AND PANDA's FRP_AUTH_TOKEN env variable.
auth.token = "${FRP_AUTH_TOKEN}"

# Subdomain configuration.
# Your DNS for *.${FRP_SERVER_BASE_DOMAIN} (e.g., *.panda.nationquest.fr) must point to this server's public IP.
subdomainHost = "${FRP_SERVER_BASE_DOMAIN}"

# For HTTP/HTTPS subdomains to work, specify the ports frps will listen on for these.
vhostHTTPPort = 80
vhostHTTPSPort = 443

# For TLS on vhostHTTPSPort (recommended for HTTPS subdomains):
# Ensure you have valid SSL certificates.
# tls.certFile = "/path/to/your/fullchain.pem"
# tls.keyFile = "/path/to/your/privkey.pem"

# To allow subdomains for TCP/UDP types (e.g. {subdomain}.${FRP_SERVER_BASE_DOMAIN} resolving to a specific frpc client for TCP/UDP):
# This is more advanced. One common method is using TCP Multiplexing:
# tcpmuxHTTPConnectPort = 7001 # Example port. frpc would then use type="tcpmux" and multiplexer="httpconnect".
# Or, you might need to map remote ports for TCP/UDP manually in frps if not using tcpmux with subdomains.
# The current PANDA generated frpc.toml uses 'subdomain' for all types. Ensure your frps is configured to handle this as desired.
# If frps is not configured for subdomain routing for TCP/UDP, the 'subdomain' field for these types in frpc.toml
# might be informational or frpc might attempt to use a remote_port based on some frps logic.
# Consult frp documentation for advanced subdomain routing for non-HTTP types.

# Enable dashboard (optional but useful)
# webServer.addr = "0.0.0.0" # Listen on all interfaces for dashboard access
# webServer.port = 7500      # Port for dashboard
# webServer.user = "admin"
# webServer.password = "your_strong_dashboard_password"

# Log settings
log.to = "./frps.log" # Or "console"
log.level = "info"
log.maxDays = 7

# Ensure transport.tls.enable = true in frps.toml if frpc uses it.
# transport.tls.force = true # Optional: to enforce TLS connections only from frpc
`;
}


const RUN_BAT_CONTENT_TEMPLATE = `@echo off
title Lancement du tunnel PANDA pour {SERVICE_NAME}
echo ========================================================
echo        Demarrage du tunnel PANDA
echo        Service: {SERVICE_NAME}
echo ========================================================
echo.
echo Configuration:
echo   Serveur PANDA FRP: ${FRP_SERVER_ADDR}:${FRP_SERVER_PORT}
echo   Type de tunnel: {FRP_TYPE}
echo   Port Local: {LOCAL_PORT}
echo   Sous-domaine expose: {SUBDOMAIN}.${FRP_SERVER_BASE_DOMAIN}
echo.
echo Lancement de frpc.exe avec frpc.toml...
echo Si le tunnel ne demarre pas, verifiez:
echo   1. Votre fichier frpc.toml est correct.
echo   2. frpc.exe est dans ce dossier.
echo   3. Le token dans frpc.toml correspond a celui du serveur FRP PANDA.
echo   4. Votre service local sur le port {LOCAL_PORT} est bien demarre.
echo.

REM Lance frpc avec le fichier de config
frpc.exe -c frpc.toml

echo.
echo Tunnel arrete.
echo Si une erreur "authentication_failed" apparait, verifiez votre token dans frpc.toml.
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

  const [frpcTomlContent, setFrpcTomlContent] = useState('');
  const [runBatSubstituted, setRunBatSubstituted] = useState('');
  const [frpsTomlExample, setFrpsTomlExample] = useState('');


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
        setFrpcTomlContent(generateFrpcToml(data));
        
        let batContent = RUN_BAT_CONTENT_TEMPLATE.replace(/{SERVICE_NAME}/g, data.name);
        batContent = batContent.replace(/{FRP_TYPE}/g, data.frpType.toUpperCase());
        batContent = batContent.replace(/{LOCAL_PORT}/g, String(data.localPort));
        batContent = batContent.replace(/{SUBDOMAIN}/g, data.subdomain);
        setRunBatSubstituted(batContent);

        setFrpsTomlExample(generateFrpsTomlExample());
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
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: "Copied!", description: `${label} copied to clipboard.` }))
      .catch(() => toast({ title: "Copy Failed", description: `Could not copy ${label}. Please copy manually.`, variant: "destructive" }));
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Button variant="outline" asChild className="mb-6 print:hidden">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">PANDA Tunnel Client Setup Guide</CardTitle>
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
              The PANDA Tunnel client (<code className="font-mono bg-destructive-foreground/20 px-1 rounded text-destructive-foreground">frpc.exe</code>) might be flagged as potentially unwanted software by some antivirus programs.
              This is common for tunneling tools due to their nature. Please ensure you download it from the official link provided and, if necessary, add an exception for <code className="font-mono bg-destructive-foreground/20 px-1 rounded text-destructive-foreground">frpc.exe</code> in your antivirus settings.
              The <code className="font-mono bg-destructive-foreground/20 px-1 rounded text-destructive-foreground">frp</code> software is open-source (<a href="https://github.com/fatedier/frp" target="_blank" rel="noopener noreferrer" className="underline font-semibold">frp by fatedier on GitHub</a>) and its code can be inspected.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <Info className="h-5 w-5" />
            <AlertTitle>Important Setup Notes</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1">
                <li>The <code className="font-mono bg-muted px-1 rounded">auth.token</code> in <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> (below) is crucial. It **must exactly match** the token configured on your PANDA <code className="font-mono bg-muted px-1 rounded">frps</code> server. PANDA uses the `FRP_AUTH_TOKEN` environment variable (defaulting to &quot;supersecret&quot; if not set).</li>
                <li>If you edit this service&apos;s settings in the PANDA dashboard (e.g., change port, subdomain), you **must** come back to this page, copy the updated <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> content, and **restart your local <code className="font-mono bg-muted px-1 rounded">frpc.exe</code> client** for changes to take effect.</li>
                <li>PANDA generates client configurations; it does not directly control or update running <code className="font-mono bg-muted px-1 rounded">frps</code> servers or <code className="font-mono bg-muted px-1 rounded">frpc</code> clients.</li>
                 <li>Ensure your local service (e.g., web server, game server) is running on <code className="font-mono bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> before starting the tunnel.</li>
              </ul>
            </AlertDescription>
          </Alert>


          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 1: Download PANDA Tunnel Client (<code className="font-mono bg-muted px-1 rounded">frpc.exe</code> for Windows)</h3>
            <p className="text-sm text-muted-foreground">
              Create a new folder on your computer for this tunnel (e.g., <code className="font-mono bg-muted px-1 rounded">C:\PANDA-Tunnels\{serviceConfig.name}</code>).
              Download the client executable into this folder. For other operating systems (Linux, macOS), get the appropriate <code className="font-mono bg-muted px-1 rounded">frpc</code> binary from the official <a href={FRP_OFFICIAL_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">frp releases page <ExternalLink className="inline h-3 w-3"/></a>.
            </p>
            <Button asChild variant="default">
              <a href={FRPC_EXE_URL} target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 h-4 w-4" /> Download frpc.exe (Windows)
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 2: Create Client Configuration File (<code className="font-mono bg-muted px-1 rounded">frpc.toml</code>)</h3>
            <p className="text-sm text-muted-foreground">
              In the folder you created, create a new text file named <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>.
              Copy the exact content below and paste it into your <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> file.
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
            <p className="text-xs text-muted-foreground">
                For advanced customization, refer to the <a href="https://gofrp.org/docs/examples/client/" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">frp client documentation <ExternalLink className="inline h-3 w-3"/></a>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Step 3: Create Startup Script (<code className="font-mono bg-muted px-1 rounded">run.bat</code> for Windows)</h3>
            <p className="text-sm text-muted-foreground">
              In the same folder, create another new text file named <code className="font-mono bg-muted px-1 rounded">run.bat</code>.
              Copy the content below into this file. This script will start the tunnel using your <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>.
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
              Ensure <code className="font-mono bg-muted px-1 rounded">frpc.exe</code>, <code className="font-mono bg-muted px-1 rounded">frpc.toml</code>, and <code className="font-mono bg-muted px-1 rounded">run.bat</code> are all in the same folder. Then, simply double-click <code className="font-mono bg-muted px-1 rounded">run.bat</code> to start your PANDA Tunnel.
              A command prompt window will open and show the tunnel status and logs. Keep this window open as long as you want your tunnel to be active.
            </p>
             <p className="text-sm text-muted-foreground">
              <strong className="font-semibold">For Linux/macOS users:</strong> Save <code className="font-mono bg-muted px-1 rounded">frpc.toml</code> to a folder, download the appropriate <code className="font-mono bg-muted px-1 rounded">frpc</code> binary from the <a href={FRP_OFFICIAL_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">frp releases page <ExternalLink className="inline h-3 w-3"/></a> into the same folder,
              make it executable (<code className="font-mono bg-muted px-1 rounded">chmod +x ./frpc</code>), and then run <code className="font-mono bg-muted px-1 rounded">./frpc -c ./frpc.toml</code> in your terminal from that folder.
             </p>
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
             <Button onClick={() => window.print()} variant="outline"><Download className="mr-2 h-4 w-4" /> Print / Save PDF Instructions</Button>
        </CardFooter>
      </Card>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Example PANDA Server Configuration (<code className="font-mono bg-muted px-1 rounded">frps.toml</code>)</CardTitle>
          <CardDescription>
            This is a reference configuration for your <code className="font-mono bg-muted px-1 rounded">frps</code> server, which should be running on <code className="font-mono bg-muted px-1 rounded">{FRP_SERVER_ADDR}</code>.
            You will need to adapt this to your server environment, security policies, and how you wish to handle different tunnel types with subdomains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="default" className="mb-4">
             <Info className="h-5 w-5" />
             <AlertTitle>Server-Side Setup is Key</AlertTitle>
             <AlertDescription>
                The PANDA dashboard helps you generate client configurations. However, the <code className="font-mono bg-muted px-1 rounded">frps</code> (server) must be correctly installed, configured, and running on your server (<code className="font-mono bg-muted px-1 rounded">{FRP_SERVER_ADDR}</code>) for the tunnels to work.
                The example below is a starting point. You are responsible for the setup and maintenance of your <code className="font-mono bg-muted px-1 rounded">frps</code> instance.
             </AlertDescription>
          </Alert>
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
           <p className="text-sm text-muted-foreground mt-4">
            For a comprehensive list of all server options, refer to the official <a href={FRP_FULL_CONFIG_EXAMPLE_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">full frps configuration example <ExternalLink className="inline h-3 w-3"/></a>.
            Remember to restart your <code className="font-mono bg-muted px-1 rounded">frps</code> service after making any changes to its configuration file.
           </p>
        </CardContent>
      </Card>
    </div>
  );
}
