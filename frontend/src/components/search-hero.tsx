"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="space-y-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">LitXplore</h1>
      <p className="text-lg text-muted-foreground max-w-4xl">
        Enter your research topic to discover relevant papers and generate a
        literature review
      </p>
      <form
        onSubmit={handleSearch}
        className="flex w-full max-w-lg mx-auto gap-2"
      >
        <Input
          type="text"
          placeholder="e.g., quantum computing, machine learning..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit">
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </form>
    </div>
  );
}
