"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useRouter } from "next/navigation";
import { searchPapers } from "@/lib/services/paper-service";
import { PaperGrid } from "@/components/paper-grid";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/protected-route";

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
      <div className="container mx-auto py-8 space-y-6 relative z-10">
        <div className="flex items-center gap-3 mb-10">
          <Search className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Search
          </h1>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search papers..."
            className="flex-1 border-gray-800 bg-gray-900/50 backdrop-blur-sm focus-visible:ring-blue-500"
          />
          <Button
            type="submit"
            className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white"
          >
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
            className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600"
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
                <Card className="relative hover:shadow-lg transition-shadow duration-300 border-gray-800 bg-gray-900/50 backdrop-blur-sm">
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4 bg-gray-800" />
                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                    <Skeleton className="h-20 w-full bg-gray-800" />
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
