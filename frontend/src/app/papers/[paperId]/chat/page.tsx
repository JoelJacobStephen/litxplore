"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Paper } from "@/lib/types/paper";
import { PDFViewer } from "@/components/pdf-viewer";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";
import { useMobile } from "@/hooks/use-mobile";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPdf, setShowPdf] = useState(true);
  const isMobile = useMobile();

  useEffect(() => {
    // Always show PDF on desktop, hide by default on mobile
    setShowPdf(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    // Fetch paper details
    const getPaper = async () => {
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
      }
    };

    if (!params.paperId) {
      setError("Invalid paper ID");
      return;
    }

    if (params.paperId) {
      getPaper();
    }
  }, [params.paperId]);

  if (error) return <div>Error: {error}</div>;
  if (!paper)
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      <div className="border-b p-2 flex items-center justify-between flex-shrink-0">
        <Button variant="ghost" asChild>
          <Link href="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowPdf(!showPdf)}
            className="md:hidden"
          >
            {showPdf ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <div className="flex-1 flex md:flex-row flex-col overflow-hidden min-h-0">
        {/* PDF Viewer */}
        {(showPdf || !isMobile) && (
          <div
            className={`${
              isMobile ? "h-[50%]" : "flex-1"
            } md:border-r overflow-hidden`}
          >
            <PDFViewer url={paper.url} />
          </div>
        )}

        {/* Chat Interface */}
        <div
          className={`${
            isMobile && showPdf ? "h-[50%]" : "flex-1"
          } md:w-[400px] md:flex-shrink-0 overflow-hidden`}
        >
          <ChatInterface paper={paper} isEmbedded />
        </div>
      </div>
    </div>
  );
}
