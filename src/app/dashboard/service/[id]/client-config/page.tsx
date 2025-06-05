
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, ArrowLeft, ClipboardCopy, Download, AlertTriangleIcon, Info, ExternalLink, AppWindow, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { FRP_SERVER_ADDR, FRP_SERVER_PORT, FRP_AUTH_TOKEN, FRP_SERVER_BASE_DOMAIN, type FrpServiceType } from '@/lib/schemas';

interface ServiceConfigData {
  name: string;
  frpType: FrpServiceType;
  localPort: number;
  subdomain: string;
  remotePort?: number;
  useEncryption?: boolean;
  useCompression?: boolean;
}

const PANDA_TUNNELS_CLIENT_EXE_URL_WINDOWS = "https://github.com/softpython2884/Panda-reverse-proxy/releases/download/client/PandaTunnels.exe";
const PANDA_TUNNELS_CLIENT_TAR_URL_LINUX = "https://github.com/fatedier/frp/releases/download/v0.62.1/frp_0.62.1_linux_amd64.tar.gz";
const FRP_OFFICIAL_RELEASES_URL = "https://github.com/fatedier/frp/releases";


function generatePandaConfigToml(config: ServiceConfigData): string {
  let pandaconfigToml = `serverAddr = "${FRP_SERVER_ADDR}"
serverPort = ${FRP_SERVER_PORT}

auth.method = "token"
auth.token = "${FRP_AUTH_TOKEN}" # Ce token DOIT correspondre à celui de votre Panda Tunnels Server

log.to = "console" # Peut être changé pour un fichier, ex: "./pandaclient.log"
log.level = "info" # Autres niveaux: trace, debug, warn, error
transport.tls.enable = true # Chiffre la communication avec le Panda Tunnels Server (recommandé)

`;

  pandaconfigToml += `
[[proxies]]
name = "${config.name}" # Identifiant du proxy
type = "${config.frpType}"
localIP = "127.0.0.1" # Suppose que votre service tourne sur la même machine que le Panda Tunnels Client
localPort = ${config.localPort}
`;

  if (config.frpType === "http" || config.frpType === "https") {
    pandaconfigToml += `subdomain = "${config.subdomain}"\n`;
  } else if (config.frpType === "tcp" || config.frpType === "udp") {
    if (config.remotePort) {
      pandaconfigToml += `remotePort = ${config.remotePort}\n`;
    } else {
      pandaconfigToml += `# IMPORTANT: Le port distant n'est pas défini pour ce tunnel TCP/UDP. \n# Configurez un remotePort dans le tableau de bord PANDA pour que ce tunnel fonctionne.\n`;
    }
  } else if (config.frpType === "stcp" || config.frpType === "xtcp") {
    pandaconfigToml += `# Pour STCP/XTCP, 'subdomain' peut être utilisé par la configuration de votre Panda Tunnels Server pour le routage.\n`;
    pandaconfigToml += `# Assurez-vous que votre serveur (frps) est configuré pour cela.\n`;
    pandaconfigToml += `subdomain = "${config.subdomain}" # Souvent utilisé comme serverName ou pour les règles de routage sur le serveur\n`;
    pandaconfigToml += `# Vous aurez probablement besoin d'une secretKey pour les visiteurs STCP/XTCP. Ajoutez-la ici si votre serveur l'exige:\n`;
    pandaconfigToml += `# secretKey = "votre_cle_secrete_ici"\n`;
  }
  
  if (config.useEncryption !== undefined) {
    pandaconfigToml += `transport.useEncryption = ${config.useEncryption}\n`;
  }
  if (config.useCompression !== undefined) {
    pandaconfigToml += `transport.useCompression = ${config.useCompression}\n`;
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
echo   Serveur Panda Tunnels: ${FRP_SERVER_ADDR}:${FRP_SERVER_PORT}
echo   Type de tunnel: {FRP_TYPE}
echo   Port Local: {LOCAL_PORT}
echo   Sous-domaine/Accès Public: {PUBLIC_ACCESS_INFO}
echo.
echo Lancement de PandaTunnels.exe avec pandaconfig.toml...
echo Si le tunnel ne demarre pas, verifiez:
echo   1. Votre fichier pandaconfig.toml est correct.
echo   2. PandaTunnels.exe est dans ce dossier.
echo   3. Le token dans pandaconfig.toml correspond a celui du serveur Panda Tunnels.
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
        const generatedToml = generatePandaConfigToml(data);
        setPandaConfigTomlContent(generatedToml);
        
        let publicAccessInfo = "";
        if (data.frpType === "http" || data.frpType === "https") {
            publicAccessInfo = `${data.subdomain}.${FRP_SERVER_BASE_DOMAIN}`;
        } else if ((data.frpType === "tcp" || data.frpType === "udp") && data.remotePort) {
            publicAccessInfo = `${FRP_SERVER_ADDR}:${data.remotePort}`;
        } else {
            publicAccessInfo = `${data.subdomain}.${FRP_SERVER_BASE_DOMAIN} (vérifiez configuration ${data.frpType.toUpperCase()})`;
        }

        let batContent = RUN_BAT_CONTENT_TEMPLATE_WINDOWS.replace(/{SERVICE_NAME}/g, data.name);
        batContent = batContent.replace(/{FRP_TYPE}/g, data.frpType.toUpperCase());
        batContent = batContent.replace(/{LOCAL_PORT}/g, String(data.localPort));
        batContent = batContent.replace(/{PUBLIC_ACCESS_INFO}/g, publicAccessInfo);
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
    if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
        .then(() => toast({ title: "Copié !", description: `${label} copié dans le presse-papiers.` }))
        .catch((err) => {
            console.error("Failed to copy to clipboard:", err);
            toast({ title: "Échec de la copie", description: `Impossible de copier ${label}. Veuillez copier manuellement.`, variant: "destructive" })
        });
    } else {
        toast({ 
            title: "Copie non disponible", 
            description: `L'accès au presse-papiers n'est pas disponible dans ce contexte (ex: non-HTTPS). Veuillez copier ${label} manuellement.`, 
            variant: "destructive",
            duration: 7000
        });
        console.warn("navigator.clipboard.writeText is not available. This usually happens in non-HTTPS contexts or if the browser does not support it.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Chargement du guide de configuration du Panda Tunnels Client...</p>
      </div>
    );
  }

  if (error || !serviceConfig) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangleIcon className="h-5 w-5" />
          <AlertTitle>Erreur de chargement de la configuration</AlertTitle>
          <AlertDescription>{error || "Les données du service ne sont pas disponibles."}</AlertDescription>
        </Alert>
        <Button variant="outline" asChild>
          <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Retour au tableau de bord</Link>
        </Button>
      </div>
    );
  }
  
  const publicAccessDisplay = 
    (serviceConfig.frpType === "http" || serviceConfig.frpType === "https") 
    ? `${serviceConfig.subdomain}.${FRP_SERVER_BASE_DOMAIN}`
    : (serviceConfig.frpType === "tcp" || serviceConfig.frpType === "udp") && serviceConfig.remotePort
    ? `${FRP_SERVER_ADDR}:${serviceConfig.remotePort}`
    : `${serviceConfig.subdomain}.${FRP_SERVER_BASE_DOMAIN} (Configuration spécifique pour ${serviceConfig.frpType.toUpperCase()})`;


  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <Button variant="outline" asChild className="mb-6 print:hidden">
        <Link href="/dashboard">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au tableau de bord
        </Link>
      </Button>

      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Guide de Configuration du <span className="text-primary">Panda Tunnels Client</span></CardTitle>
          <CardDescription>
            Ce guide vous aide à connecter votre service local : <strong className="text-primary">{serviceConfig.name}</strong> au réseau Panda Tunnels.
            <br />
            Votre service sera accessible via : <code className="text-sm bg-muted px-1 rounded">{publicAccessDisplay}</code>
            <br />
            Détails du service local : <code className="text-sm bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> (Type : {serviceConfig.frpType.toUpperCase()})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-5 w-5" />
            <AlertTitle>Avertissement Antivirus !</AlertTitle>
            <AlertDescription>
              Le <strong className="text-destructive font-semibold">Panda Tunnels Client</strong> (<code className="font-mono bg-destructive/20 px-1 rounded text-destructive font-bold">PandaTunnels.exe</code> ou l&apos;équivalent Linux) pourrait être signalé comme un logiciel potentiellement indésirable par certains antivirus.
              Ceci est courant pour les outils de tunnelisation. Assurez-vous de le télécharger depuis les liens officiels fournis et, si nécessaire, ajoutez une exception pour l&apos;exécutable client dans les paramètres de votre antivirus.
            </AlertDescription>
          </Alert>

          <Alert variant="default">
            <Info className="h-5 w-5" />
            <AlertTitle>Notes Importantes pour la Configuration</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1">
                <li>Le <code className="font-mono bg-muted px-1 rounded">auth.token</code> dans <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code> (ci-dessous) est crucial. Il <strong className="font-semibold">doit correspondre exactement</strong> au token configuré sur votre <strong className="text-primary">Panda Tunnels Server</strong>. PANDA utilise la variable d&apos;environnement <code className="font-mono bg-muted px-1 rounded">FRP_AUTH_TOKEN</code> (par défaut &quot;supersecret&quot; si non définie).</li>
                <li>Si vous modifiez les paramètres de ce service dans le tableau de bord PANDA, vous <strong className="font-semibold">devez</strong> revenir sur cette page, copier le nouveau contenu de <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>, et <strong className="font-semibold">redémarrer votre Panda Tunnels Client local</strong> pour que les changements prennent effet.</li>
                 <li>Assurez-vous que votre service local tourne bien sur <code className="font-mono bg-muted px-1 rounded">127.0.0.1:{serviceConfig.localPort}</code> avant de démarrer le tunnel.</li>
                 <li>Pour une personnalisation avancée du <strong className="text-primary">Panda Tunnels Client</strong> (options non gérées par cette interface PANDA), vous pouvez éditer manuellement ce fichier <code className="font-mono bg-muted px-1 rounded">pandaconfig.toml</code>. Référez-vous à la <a href="https://gofrp.org/docs/examples/client/" target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">documentation officielle de <strong className="font-semibold">frp</strong> <ExternalLink className="inline h-3 w-3"/></a> pour tous les paramètres disponibles.</li>
                 <li>Les modifications dans PANDA mettent à jour la configuration de référence. Elles ne contrôlent pas directement les instances de <strong className="text-primary">Panda Tunnels Client</strong> ou <strong className="text-primary">Panda Tunnels Server</strong> en cours d&apos;exécution. Un redémarrage du client avec la configuration mise à jour est nécessaire.</li>
              </ul>
            </AlertDescription>
          </Alert>


          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Étape 1 : Télécharger le <span className="text-primary">Panda Tunnels Client</span></h3>
            <p className="text-sm text-muted-foreground">
              Créez un nouveau dossier sur votre ordinateur pour ce tunnel (ex: <code className="font-mono bg-muted px-1 rounded">C:\PANDA-Tunnels\{serviceConfig.name}</code>).
              Téléchargez l&apos;exécutable client approprié pour votre système dans ce dossier.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button asChild variant="default" className="w-full">
                  <a href={PANDA_TUNNELS_CLIENT_EXE_URL_WINDOWS} target="_blank" rel="noopener noreferrer">
                    <AppWindow className="mr-2 h-5 w-5" /> Télécharger pour Windows (<code className="font-mono bg-primary-foreground/20 px-1 rounded text-primary-foreground">PandaTunnels.exe</code>)
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={PANDA_TUNNELS_CLIENT_TAR_URL_LINUX} target="_blank" rel="noopener noreferrer">
                    <MonitorPlay className="mr-2 h-5 w-5" /> Télécharger pour Linux (AMD64 .tar.gz)
                  </a>
                </Button>
            </div>
             <p className="text-xs text-muted-foreground mt-2">
                <strong className="font-semibold">Utilisateurs Linux :</strong> Après avoir téléchargé le <code className="font-mono bg-muted px-1 rounded">.tar.gz</code>, extrayez son contenu. Vous trouverez plusieurs fichiers. Vous n&apos;avez besoin que du binaire <code className="font-mono bg-muted px-1 rounded">frpc</code> (qui est le <strong className="text-primary">Panda Tunnels Client</strong>). Vous pouvez le renommer en <code className="font-mono bg-muted px-1 rounded">PandaTunnelsClient</code> si vous le souhaitez. Supprimez tous les fichiers liés à <code className="font-mono bg-muted px-1 rounded">frps</code> (le <strong className="text-primary">Panda Tunnels Server</strong>) de l&apos;archive extraite car ils ne sont pas nécessaires pour le client. Rendez le binaire client exécutable (<code className="font-mono bg-muted px-1 rounded">chmod +x ./PandaTunnelsClient</code> ou <code className="font-mono bg-muted px-1 rounded">chmod +x ./frpc</code>).
             </p>
            <p className="text-xs text-muted-foreground">
                <strong className="font-semibold">Utilisateurs macOS :</strong> Un <strong className="text-primary">Panda Tunnels Client</strong> pré-compilé pour macOS n&apos;est pas fourni actuellement. Vous pourriez compiler le client depuis les sources <code className="font-mono bg-muted px-1 rounded">frp</code> ou trouver des binaires compatibles sur la <a href={FRP_OFFICIAL_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-accent">page officielle des releases <strong className="font-semibold">frp</strong> <ExternalLink className="inline h-3 w-3"/></a>.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Étape 2 : Créer le fichier de configuration client (<code className="font-mono bg-muted px-1 rounded text-primary">pandaconfig.toml</code>)</h3>
            <p className="text-sm text-muted-foreground">
              Dans le dossier que vous avez créé, créez un nouveau fichier texte nommé <code className="font-mono bg-muted px-1 rounded text-primary">pandaconfig.toml</code>.
              Copiez le contenu exact ci-dessous et collez-le dans ce fichier. 
            </p>
            <div className="relative p-4 bg-muted rounded-md border max-h-80 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-all"><code>{pandaConfigTomlContent}</code></pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 print:hidden"
                onClick={() => handleCopyToClipboard(pandaConfigTomlContent, 'contenu de pandaconfig.toml')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Étape 3 (Windows) : Créer le script de démarrage (<code className="font-mono bg-muted px-1 rounded text-primary">run.bat</code>)</h3>
            <p className="text-sm text-muted-foreground">
              Pour les utilisateurs Windows, dans le même dossier, créez un autre nouveau fichier texte nommé <code className="font-mono bg-muted px-1 rounded text-primary">run.bat</code>.
              Copiez le contenu ci-dessous dans ce fichier. Ce script démarrera le tunnel en utilisant votre <code className="font-mono bg-muted px-1 rounded text-primary">pandaconfig.toml</code>.
            </p>
             <div className="relative p-4 bg-muted rounded-md border max-h-60 overflow-y-auto">
              <pre className="text-xs whitespace-pre-wrap break-all"><code>{runBatSubstituted}</code></pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 print:hidden"
                onClick={() => handleCopyToClipboard(runBatSubstituted, 'contenu de run.bat')}
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Étape 4 : Lancer le Tunnel</h3>
            <p className="text-sm text-muted-foreground">
             <strong className="font-semibold">Windows :</strong> Assurez-vous que <code className="font-mono bg-muted px-1 rounded text-primary">PandaTunnels.exe</code>, <code className="font-mono bg-muted px-1 rounded text-primary">pandaconfig.toml</code>, et <code className="font-mono bg-muted px-1 rounded text-primary">run.bat</code> sont tous dans le même dossier. Ensuite, double-cliquez simplement sur <code className="font-mono bg-muted px-1 rounded text-primary">run.bat</code> pour démarrer votre Panda Tunnel.
            </p>
             <p className="text-sm text-muted-foreground">
              <strong className="font-semibold">Linux :</strong> Naviguez vers le dossier dans votre terminal. Lancez le client en utilisant la commande : <code className="font-mono bg-muted px-1 rounded text-primary">./PandaTunnelsClient -c ./pandaconfig.toml</code> (ou <code className="font-mono bg-muted px-1 rounded text-primary">./frpc -c ./pandaconfig.toml</code> si vous avez gardé le nom original du binaire).
             </p>
            <p className="text-sm text-muted-foreground mt-1">
              Une fenêtre de terminal s&apos;ouvrira et affichera l&apos;état du tunnel et les logs. Gardez cette fenêtre ouverte aussi longtemps que vous souhaitez que votre tunnel soit actif.
            </p>
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
             <Button onClick={() => typeof window !== 'undefined' && window.print()} variant="outline"><Download className="mr-2 h-4 w-4" /> Imprimer / Enregistrer les instructions en PDF</Button>
        </CardFooter>
      </Card>
      
    </div>
  );
}
    

    
