"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useSearchPapers,
  Paper,
  getSearchPapersQueryKey,
} from "@/lib/api/generated";
import { PaperGrid } from "@/components/paper-grid";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/protected-route";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [searchInput, setSearchInput] = useState(query);

  const { data: papers, isLoading } = useSearchPapers(
    { query },
    {
      query: {
        queryKey: getSearchPapersQueryKey({ query }),
        enabled: !!query,
      },
    }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-8 space-y-6">
        <div className="flex items-center gap-3 mb-10">
          <Search className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Search
          </h1>
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
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
        </form>

        {query && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-foreground tracking-tight"
          >
            Results for: {query}
          </motion.h1>
        )}

        {isLoading ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {[1, 2, 3].map((i) => (
              <motion.div key={i} variants={cardVariants}>
                <Card className="relative transition-all duration-200">
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-muted" />
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    <Skeleton className="h-20 w-full bg-muted" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          papers && (
            <PaperGrid
              papers={papers}
              onPaperSelect={(paperId, selected) => {
                const paper = papers.find((p) => p.id === paperId);
                if (paper && selected) {
                  setSelectedPaper(paper);
                }
              }}
              enableChat={true}
            />
          )
        )}

        {selectedPaper && (
          <ChatInterface
            paper={selectedPaper}
            onClose={() => setSelectedPaper(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
