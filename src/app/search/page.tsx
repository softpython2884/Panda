
"use client";
import SearchForm from "@/components/search/SearchForm";
import ServiceCard from "@/components/search/ServiceCard";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";

interface Service {
  id: string;
  name: string;
  description: string;
  domain: string;
  type: string;
  public_url?: string;
}

export default function SearchPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); 
  const { toast } = useToast();

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setHasSearched(true);
    try {
      // NOTE: In a real app, ensure POD_API_URL is configured for client-side fetch if necessary,
      // or this fetch should go to a BFF route that then calls the Pod.
      // For simplicity, assuming Pod API is directly reachable or this is a server component action.
      // Since this is client component, it must be a public endpoint or use BFF.
      // The /api/pod/search is public.
      const response = await fetch(`/api/pod/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch search results");
      }
      const data = await response.json();
      setServices(data);
      if (data.length > 0) {
        toast({
            title: "Search Complete",
            description: `Found ${data.length} service(s).`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Search Error",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
      setServices([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-8 bg-gradient-to-r from-[#a259e4] to-[#009fff] rounded-lg shadow-md">
        <h1 className="text-4xl font-poppins font-bold text-white">Discover PANDA Services</h1>
        <p className="text-lg text-indigo-100 mt-2">Find tools, websites, APIs, and more within the PANDA Ecosystem.</p>
      </div>
      
      <SearchForm onSearch={handleSearch} isSearching={isSearching} />

      {isSearching && (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Searching for services...</p>
        </div>
      )}

      {!isSearching && hasSearched && services.length === 0 && (
        <Alert variant="default" className="shadow-md">
          <Info className="h-5 w-5 text-[#009fff]" /> {/* PANDA Search Accent Blue */}
          <AlertTitle className="font-poppins">No Services Found</AlertTitle>
          <AlertDescription>
            Your search did not match any services. Try different keywords or explore all services.
          </AlertDescription>
        </Alert>
      )}
      
      {!isSearching && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {!isSearching && !hasSearched && (
         <div className="text-center py-10">
            <Image src="https://placehold.co/400x300.png?text=PANDA+Search" alt="PANDA Search placeholder" width={400} height={300} className="mx-auto mb-6 rounded-lg shadow-md" data-ai-hint="search illustration graph" />
            <p className="text-xl text-muted-foreground font-poppins">Enter a query to start searching the PANDA Ecosystem.</p>
        </div>
      )}
    </div>
  );
}
