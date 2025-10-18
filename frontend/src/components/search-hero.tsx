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
    <div className="relative">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground tracking-tight">
              Search Research Papers
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
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
