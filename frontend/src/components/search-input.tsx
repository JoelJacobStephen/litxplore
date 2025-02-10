"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
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

interface SearchInputProps {
  onPaperSelect: (paper: Paper) => void;
}

export function SearchInput({ onPaperSelect }: SearchInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["paper-search", search],
    queryFn: () => searchPapers(search),
    enabled: search.length > 2,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Search className="mr-2 h-4 w-4" />
          Search for additional papers...
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search papers..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>No papers found.</CommandEmpty>
            <CommandGroup>
              {searchResults?.map((paper) => (
                <CommandItem
                  key={paper.id}
                  onSelect={() => {
                    onPaperSelect(paper);
                    setOpen(false);
                  }}
                >
                  <div className="text-sm">
                    <div className="font-medium">{paper.title}</div>
                    <div className="text-muted-foreground">
                      {paper.authors.slice(0, 3).join(", ")}
                      {paper.authors.length > 3 && " et al."}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
