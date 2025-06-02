
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { useState } from "react";

const searchFormSchema = z.object({
  query: z.string().min(1, "Search query cannot be empty."),
});

type SearchFormValues = z.infer<typeof searchFormSchema>;

interface SearchFormProps {
  onSearch: (query: string) => Promise<void>;
  isSearching: boolean;
}

export default function SearchForm({ onSearch, isSearching }: SearchFormProps) {
  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      query: "",
    },
  });

  async function onSubmit(data: SearchFormValues) {
    await onSearch(data.query);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2 items-end mb-8 p-6 bg-card rounded-lg shadow-md">
        <FormField
          control={form.control}
          name="query"
          render={({ field }) => (
            <FormItem className="flex-grow">
              <FormLabel className="font-poppins text-foreground">Search Services</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., 'My Awesome App', 'example.panda', or 'website'" 
                  {...field} 
                  className="text-base md:text-sm"
                />
              </FormControl>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSearching} className="bg-[#a259e4] hover:bg-[#8a48c4] text-white h-10">
          {isSearching ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <SearchIcon className="h-5 w-5" />
          )}
          <span className="ml-2 hidden sm:inline">Search</span>
        </Button>
      </form>
    </Form>
  );
}
