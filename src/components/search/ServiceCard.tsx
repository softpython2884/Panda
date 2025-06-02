
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, ExternalLink, Tag } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  public_url?: string;
}

interface ServiceCardProps {
  service: Service;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow bg-card flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-poppins text-xl text-[#a259e4]">{service.name}</CardTitle> {/* PANDA Search Primary Violet */}
          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
            <Tag className="h-3 w-3" /> {service.type}
          </span>
        </div>
        <CardDescription className="flex items-center gap-1 text-sm pt-1">
          <Globe className="h-4 w-4 text-muted-foreground" />{service.domain}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-4">{service.description}</p>
      </CardContent>
      <CardFooter className="border-t pt-4">
        {service.public_url ? (
          <Button asChild className="w-full bg-[#009fff] hover:bg-[#008ae6] text-white"> {/* PANDA Search Accent Blue */}
            <a href={service.public_url} target="_blank" rel="noopener noreferrer">
              Visit Service <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        ) : (
          <Button variant="outline" disabled className="w-full">
            No Public URL
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
