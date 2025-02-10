"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { searchPapers } from "@/lib/services/paper-service";
import { PaperGrid } from "@/components/paper-grid";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import Link from "next/link";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchInput, setSearchInput] = useState(query);

  const { data: papers, isLoading } = useQuery({
    queryKey: ["papers", query],
    queryFn: () => searchPapers(query),
    enabled: !!query,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search papers..."
          className="flex-1"
        />
        <Button type="submit">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Search
        </Button>
      </form>

      {query && <h1 className="text-2xl font-bold">Results for: {query}</h1>}

      {papers && (
        <PaperGrid
          papers={papers}
          onPaperSelect={(paper) => setSelectedPaper(paper)}
        />
      )}

      {selectedPaper && (
        <ChatInterface
          paper={selectedPaper}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  );
}
