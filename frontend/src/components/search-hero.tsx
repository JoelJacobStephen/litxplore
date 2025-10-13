"use client";

import { SearchInput } from "@/components/search-input";
import { motion } from "framer-motion";
import { useState } from "react";
import { Paper } from "@/lib/api/generated";

export function SearchHero() {
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());

  const handlePaperSelect = (paperId: string, selected: boolean) => {
    const newSelected = new Set(selectedPapers);
    if (selected) {
      newSelected.add(paperId);
    } else {
      newSelected.delete(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const handleAddPaper = (paper: Paper) => {
    setSelectedPapers((prev) => {
      const newSelected = new Set(prev);
      newSelected.add(paper.id);
      return newSelected;
    });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,hsl(210,70%,40%)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_70%_60%,hsl(220,80%,50%)_0%,transparent_50%)]"></div>
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
              Search Research Papers
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Explore millions of papers from arXiv and interact with them using
              AI
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <SearchInput
              onPaperSelect={handlePaperSelect}
              selectedPapers={selectedPapers}
              onAddPaper={handleAddPaper}
              currentPaperCount={selectedPapers.size}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
