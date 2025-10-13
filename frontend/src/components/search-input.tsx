"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Plus } from "lucide-react";
import { Paper, useSearchPapers } from "@/lib/api/generated";
import { motion } from "framer-motion";
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
import { MAX_PAPERS_FOR_REVIEW } from "@/lib/constants";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  onPaperSelect: (paperId: string, selected: boolean) => void;
  selectedPapers: Set<string>;
  onAddPaper: (paper: Paper) => void; // New prop for adding papers to grid
  currentPaperCount: number; // Add this new prop
}

export function SearchInput({
  onPaperSelect,
  selectedPapers,
  onAddPaper,
  currentPaperCount,
}: SearchInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: searchResults,
    isLoading,
    error,
    isError,
  } = useSearchPapers(
    { query: debouncedSearch },
    { query: { enabled: debouncedSearch.length > 2 } }
  );

  // Log errors if they occur
  useEffect(() => {
    if (isError && error) {
      console.error("Search error:", error);
    }
  }, [isError, error]);

  // Close popover and reset search when component unmounts
  useEffect(() => {
    return () => {
      setOpen(false);
      setSearch("");
    };
  }, []);

  // Handle paper selection
  const handlePaperSelect = (paper: Paper) => {
    if (
      !selectedPapers.has(paper.id) &&
      currentPaperCount >= MAX_PAPERS_FOR_REVIEW
    ) {
      toast.error(
        `You can only select up to ${MAX_PAPERS_FOR_REVIEW} papers for review`
      );
      return;
    }

    const paperId = paper.id;
    onPaperSelect(paperId, true);
    onAddPaper(paper);
    setOpen(false);
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.01 },
    tap: { scale: 0.98 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 5 },
    visible: { opacity: 1, y: 0 },
    hover: { backgroundColor: "rgba(255, 255, 255, 0.06)" },
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <motion.div
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <Button
            variant="outline"
            className="w-full justify-start bg-persian-blue-950/10 border-zinc-700/50 hover:bg-persion-blue-800/30 hover:border-blue-700/40 hover:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all duration-200 text-zinc-200 shadow-sm h-11"
          >
            <Search className="mr-2 h-4 w-4 text-blue-400" />
            <span className="text-zinc-300">
              Search for additional papers...
            </span>
          </Button>
        </motion.div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-0 border border-zinc-700/80 border-b-blue-700/30 bg-persian-blue-950/20 backdrop-blur-md shadow-xl rounded-xl overflow-hidden"
        align="start"
      >
        <Command shouldFilter={false} className="bg-transparent">
          <CommandInput
            placeholder="Search papers..."
            value={search}
            onValueChange={setSearch}
            className="border-b border-blue-800/30 bg-transparent text-zinc-100 placeholder:text-zinc-400 h-12 focus-within:ring-blue-500/20 focus-within:border-blue-700/40"
          />
          <CommandList className="max-h-[320px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <CommandEmpty className="py-8 text-zinc-400 flex flex-col items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2 text-blue-400" />
                <span className="text-sm">Searching papers...</span>
              </CommandEmpty>
            ) : !searchResults || searchResults.length === 0 ? (
              <CommandEmpty className="py-8 text-zinc-400 flex flex-col items-center justify-center">
                {search.length <= 2 ? (
                  <>
                    <Search className="h-5 w-5 text-blue-400/70 mb-2 opacity-70" />
                    <span className="text-sm">
                      Enter at least 3 characters to search...
                    </span>
                  </>
                ) : (
                  <>
                    <div className="h-8 w-8 rounded-full bg-blue-900/20 flex items-center justify-center mb-2 border border-blue-700/20">
                      <Search className="h-4 w-4 text-blue-300" />
                    </div>
                    <span className="text-sm">No papers found</span>
                  </>
                )}
              </CommandEmpty>
            ) : (
              <CommandGroup className="py-2">
                {searchResults.map((paper) => (
                  <CommandItem
                    key={paper.id}
                    onSelect={() => handlePaperSelect(paper)}
                    className={cn(
                      "flex flex-col  items-start gap-1 p-3 m-1 transition-colors duration-200 cursor-pointer rounded-lg border border-transparent",
                      selectedPapers.has(paper.id)
                        ? "bg-blue-900/30 border-blue-700/30"
                        : "hover:bg-blue-700 hover:border-blue-800/30"
                    )}
                    value={paper.title}
                  >
                    <motion.div
                      className="w-full flex items-start justify-between gap-2 "
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex-1">
                        <div className="font-medium line-clamp-1 text-zinc-100">
                          {paper.title}
                        </div>
                        <div className="text-xs text-zinc-400 mt-1 line-clamp-1">
                          {paper.authors.slice(0, 3).join(", ")}
                          {paper.authors.length > 3 && " et al."}
                        </div>
                        {paper.published && (
                          <div className="text-xs text-zinc-500 mt-0.5">
                            {new Date(paper.published).getFullYear()}
                          </div>
                        )}
                      </div>
                      {selectedPapers.has(paper.id) ? (
                        <div className="text-xs px-2 py-1 bg-blue-500/20 text-blue-300 font-medium rounded-full flex items-center gap-1 whitespace-nowrap">
                          <span>Selected</span>
                        </div>
                      ) : (
                        <motion.div
                          whileHover={{
                            x: 3,
                            backgroundColor: "rgba(37, 99, 235, 0.2)",
                          }}
                          transition={{ duration: 0.2 }}
                          className="h-6 w-6 rounded-full bg-zinc-700/50 hover:bg-blue-700/30 flex items-center justify-center text-blue-300"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </motion.div>
                      )}
                    </motion.div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
