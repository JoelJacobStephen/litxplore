"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Paper } from "@/lib/api/generated";
import { PDFViewer } from "@/components/pdf-viewer";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(true);
  const [collapsedPdf, setCollapsedPdf] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMobile();

  useEffect(() => {
    // Always show PDF on desktop, hide by default on mobile
    setShowPdf(!isMobile);
    setCollapsedPdf(isMobile);
  }, [isMobile]);

  useEffect(() => {
    // Fetch paper details
    const getPaper = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/v1/papers/${params.paperId}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPaper(data);
      } catch (error) {
        console.error("Failed to fetch paper:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch paper"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!params.paperId) {
      setError("Invalid paper ID");
      setIsLoading(false);
      return;
    }

    if (params.paperId) {
      getPaper();
    }
  }, [params.paperId]);

  // Toggle the PDF view on mobile
  const togglePdfView = () => {
    if (isMobile) {
      setShowPdf(!showPdf);
    } else {
      setCollapsedPdf(!collapsedPdf);
    }
  };

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
          <h3 className="mb-4 text-xl font-semibold text-center">
            Error Loading Paper
          </h3>
          <p className="mb-6 text-muted-foreground text-center">{error}</p>
          <Button className="w-full" onClick={() => router.push("/search")}>
            Return to Search
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !paper) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading paper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <header className="border-b px-4 py-2 flex items-center justify-between flex-shrink-0 bg-white dark:bg-slate-950">
        <Button variant="ghost" asChild size="sm" className="gap-2">
          <Link href="/search">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Search</span>
          </Link>
        </Button>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePdfView}
            className="gap-1"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">
              {isMobile
                ? showPdf
                  ? "Hide PDF"
                  : "Show PDF"
                : collapsedPdf
                ? "Expand PDF"
                : "Collapse PDF"}
            </span>
          </Button>
        </div>
      </header>

      {isMobile ? (
        // Mobile layout - stacked with toggle
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {showPdf && (
            <div className="h-[50%] border-b overflow-hidden">
              <PDFViewer url={paper.url} />
            </div>
          )}
          <div
            className={cn(
              "flex-1 overflow-hidden",
              showPdf ? "h-[50%]" : "h-full"
            )}
          >
            <ChatInterface paper={paper} isEmbedded />
          </div>
        </div>
      ) : (
        // Desktop layout - resizable panels
        <ResizablePanelGroup
          direction="horizontal"
          className="flex-1 overflow-hidden"
        >
          <ResizablePanel
            defaultSize={60}
            minSize={20}
            maxSize={80}
            collapsible={true}
            collapsedSize={0}
            onCollapse={() => setCollapsedPdf(true)}
            onExpand={() => setCollapsedPdf(false)}
            className="overflow-hidden"
          >
            <div className="h-full overflow-hidden">
              <PDFViewer url={paper.url} />
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle>
            <div className="flex h-full w-6 items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full p-0 text-muted-foreground"
              >
                {collapsedPdf ? (
                  <ChevronRight className="h-3 w-3" />
                ) : (
                  <ChevronLeft className="h-3 w-3" />
                )}
              </Button>
            </div>
          </ResizableHandle>

          <ResizablePanel
            className="overflow-hidden"
            defaultSize={40}
            minSize={20}
          >
            <ChatInterface paper={paper} isEmbedded />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    </div>
  );
}
