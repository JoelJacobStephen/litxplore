"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

export function SearchHero() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.05,
      transition: { duration: 0.2 },
    },
    tap: { scale: 0.95 },
  };

  return (
    <motion.div
      className="space-y-8 text-center py-16"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <BookOpen className="h-8 w-8 text-blue-500" />
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            LitXplore
          </h1>
          <Sparkles className="h-8 w-8 text-purple-500" />
        </div>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Discover relevant papers and generate comprehensive literature reviews
          powered by AI
        </p>
      </motion.div>

      <motion.form
        variants={itemVariants}
        onSubmit={handleSearch}
        className="flex w-full max-w-2xl mx-auto gap-3 px-4"
      >
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="e.g., quantum computing, machine learning..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 focus:border-blue-500 transition-colors rounded-xl"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
        </div>
        <motion.div
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg shadow-blue-500/20"
          >
            Search Papers
          </Button>
        </motion.div>
      </motion.form>

      <motion.div
        variants={itemVariants}
        className="flex justify-center gap-8 text-sm text-zinc-400"
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span>AI-Powered Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span>Comprehensive Reviews</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
