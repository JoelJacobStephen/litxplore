"use client";

import { useState } from "react";
import { ArxivPaper } from "@/lib/types/paper";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CircleCheckBig, ExternalLink } from "lucide-react";
import Link from "next/link";
import { ChatInterface } from "./chat-interface";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton"; // Add this import

interface PaperGridProps {
  papers: ArxivPaper[];
  onPaperSelect?: (paperId: string, selected: boolean) => void;
  selectedPapers?: Set<string>;
  isLoading?: boolean; // Add loading state interface
}

export function PaperGrid({
  papers,
  onPaperSelect,
  selectedPapers = new Set(),
  isLoading,
}: PaperGridProps) {
  const router = useRouter();
  const [localSelectedPapers, setLocalSelectedPapers] = useState<Set<string>>(
    new Set()
  );

  const togglePaper = (paperId: string) => {
    const newSelected = new Set(localSelectedPapers);
    if (newSelected.has(paperId)) {
      newSelected.delete(paperId);
    } else {
      newSelected.add(paperId);
    }
    setLocalSelectedPapers(newSelected);
    if (onPaperSelect) {
      onPaperSelect(paperId, newSelected.has(paperId));
    }
  };

  const effectiveSelectedPapers = onPaperSelect
    ? selectedPapers
    : localSelectedPapers;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="relative">
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {papers?.map((paper) => (
          <Card
            key={paper.id}
            className="flex flex-col bg-gradient-to-br from-zinc-900 to-slate-900"
          >
            <CardHeader>
              <CardTitle className="line-clamp-2">{paper.title}</CardTitle>
              <CardDescription>
                {paper.authors.slice(0, 3).join(", ")}
                {paper.authors.length > 3 && " et al."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-4">
                {paper.summary}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center gap-2">
              {onPaperSelect && (
                <Button
                  variant={
                    effectiveSelectedPapers.has(paper.id) ? "default" : "ghost"
                  }
                  size="sm"
                  onClick={() => togglePaper(paper.id)}
                >
                  <CircleCheckBig className="h-4 w-4 mr-2" />
                  {effectiveSelectedPapers.has(paper.id)
                    ? "Selected"
                    : "Select"}
                </Button>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" asChild>
                  {paper.link && (
                    <Link
                      href={paper.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View PDF
                    </Link>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/papers/${paper.id}/chat`)}
                >
                  Chat with Paper
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {effectiveSelectedPapers.size > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button asChild>
            {Array.from(effectiveSelectedPapers).length > 0 && (
              <Link
                href={`/review?papers=${Array.from(
                  effectiveSelectedPapers
                ).join(",")}`}
              >
                Generate Review ({effectiveSelectedPapers.size} papers)
              </Link>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
