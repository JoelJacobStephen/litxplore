"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import { searchPapers } from "@/lib/services/paper-service";
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
  const debouncedSearch = useDebounce(search, 300); // Reduced debounce time

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["paper-search", debouncedSearch],
    queryFn: () => searchPapers(debouncedSearch),
    enabled: debouncedSearch.length > 2,
    staleTime: 30000, // Cache results for 30 seconds
    keepPreviousData: true, // Keep showing previous results while loading new ones
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
    // Always select the paper when added through search
    onPaperSelect(paper.id, true);
    onAddPaper(paper);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          Search for additional papers...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          {" "}
          {/* Disable built-in filtering */}
          <CommandInput
            placeholder="Search papers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length <= 2 ? (
              <CommandEmpty>
                Enter at least 3 characters to search...
              </CommandEmpty>
            ) : isLoading ? (
              <CommandEmpty>Searching papers...</CommandEmpty>
            ) : !searchResults?.length ? (
              <CommandEmpty>No papers found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {searchResults.map((paper) => (
                  <CommandItem
                    key={paper.id}
                    onSelect={() => handlePaperSelect(paper)}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="w-full flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium line-clamp-1">
                          {paper.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {paper.authors.slice(0, 3).join(", ")}
                          {paper.authors.length > 3 && " et al."}
                        </div>
                      </div>
                      {selectedPapers.has(paper.id) && (
                        <div className="text-xs text-primary shrink-0">
                          Selected
                        </div>
                      )}
                    </div>
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
