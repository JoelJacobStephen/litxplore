"use client";

import { PaperMetadata } from "@/lib/types/analysis";
import { Button } from "@/components/ui/button";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface PaperHeaderProps {
  paper: PaperMetadata;
  showPdf: boolean;
  onTogglePdf: () => void;
}

export function PaperHeader({
  paper,
  showPdf,
  onTogglePdf,
}: PaperHeaderProps) {
  const isMobile = useMobile();

  return (
    <header className="border-b bg-white dark:bg-slate-950 px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-foreground truncate">
          {paper.title}
        </h1>
        <p className="text-sm text-muted-foreground truncate">
          {paper.authors.slice(0, 3).join(", ")}
          {paper.authors.length > 3 && ` +${paper.authors.length - 3}`}
          {paper.year && ` • ${paper.year}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePdf}
            className="gap-2"
            title={showPdf ? "Hide PDF" : "Show PDF"}
          >
            {showPdf ? (
              <>
                <EyeOff className="h-4 w-4" />
                <span className="hidden sm:inline">Hide PDF</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Show PDF</span>
              </>
            )}
          </Button>
        )}

        {paper.url && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="gap-2"
            title="View original paper"
          >
            <a href={paper.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">View Paper</span>
            </a>
          </Button>
        )}
      </div>
    </header>
  );
}
