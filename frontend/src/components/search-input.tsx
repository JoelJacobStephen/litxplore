"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import { searchPapers } from "@/lib/services/paper-service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce"; // We'll create this hook

interface SearchInputProps {
  onPaperSelect: (paper: Paper, selected: boolean) => void;
  selectedPapers: Set<string>;
  onAddPaper: (paper: Paper) => void; // New prop for adding papers to grid
}

export function SearchInput({
  onPaperSelect,
  selectedPapers,
  onAddPaper,
}: SearchInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["paper-search", debouncedSearch],
    queryFn: () => searchPapers(debouncedSearch),
    enabled: debouncedSearch.length > 2,
    staleTime: 30000,
  });

  // Close popover and reset search when component unmounts
  useEffect(() => {
    return () => {
      setOpen(false);
      setSearch("");
    };
  }, []);

  // Handle paper selection
  const handlePaperSelect = (paper: Paper) => {
    onPaperSelect(paper, true);
    onAddPaper(paper);
    setOpen(false);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await searchPapers(query);
      // Process results...
    } finally {
      setIsSearching(false);
    }
  };

  const searchButtonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
  };

  const searchResultsVariants = {
    hidden: { opacity: 0, y: -10 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const searchItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.2 },
    },
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.div
          variants={searchButtonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
        >
          <Button
            variant="outline"
            className="w-full justify-start bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 transition-all duration-200"
          >
            <Search className="mr-2 h-4 w-4 text-zinc-400" />
            <span className="text-zinc-400">
              Search for additional papers...
            </span>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 border border-zinc-800 bg-zinc-900/95 backdrop-blur-sm shadow-xl"
        align="start"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            placeholder="Search papers..."
            value={search}
            onValueChange={setSearch}
            className="border-b border-zinc-800 bg-transparent"
          />
          <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900">
            <AnimatePresence mode="wait">
              {search.length <= 2 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CommandEmpty className="py-6 text-zinc-400">
                    Enter at least 3 characters to search...
                  </CommandEmpty>
                </motion.div>
              ) : isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CommandEmpty className="py-6 text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    Searching papers...
                  </CommandEmpty>
                </motion.div>
              ) : !searchResults?.length ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CommandEmpty className="py-6 text-zinc-400">
                    No papers found.
                  </CommandEmpty>
                </motion.div>
              ) : (
                <motion.div
                  variants={searchResultsVariants}
                  initial="hidden"
                  animate="show"
                >
                  <CommandGroup>
                    {searchResults.map((paper) => (
                      <motion.div key={paper.id} variants={searchItemVariants}>
                        <CommandItem
                          onSelect={() => handlePaperSelect(paper)}
                          className="flex flex-col items-start gap-1 p-3 hover:bg-zinc-800/50 transition-colors duration-200"
                        >
                          <div className="w-full flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="font-medium line-clamp-1 text-zinc-200">
                                {paper.title}
                              </div>
                              <div className="text-sm text-zinc-400">
                                {paper.authors.slice(0, 3).join(", ")}
                                {paper.authors.length > 3 && " et al."}
                              </div>
                            </div>
                            {selectedPapers.has(paper.id) ? (
                              <div className="text-xs text-blue-400 font-medium px-2 py-1 bg-blue-400/10 rounded-full">
                                Selected
                              </div>
                            ) : (
                              <motion.div
                                whileHover={{ x: 3 }}
                                className="text-zinc-400"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </motion.div>
                            )}
                          </div>
                        </CommandItem>
                      </motion.div>
                    ))}
                  </CommandGroup>
                </motion.div>
              )}
            </AnimatePresence>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
