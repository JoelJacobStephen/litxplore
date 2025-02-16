"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Paper } from "@/lib/types/paper";
import { PDFViewer } from "@/components/pdf-viewer";
import { ChatInterface } from "@/components/chat-interface";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ChatPage() {
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  if (!paper) return <div>Loading...</div>;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="border-b p-4 flex-shrink-0">
        <Button variant="ghost" asChild>
          <Link href="/search">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* PDF Viewer */}
        <div className="flex-1 border-r">
          <PDFViewer url={paper.url} />
        </div>

        {/* Chat Interface */}
        <div className="w-[400px] flex-shrink-0">
          <ChatInterface paper={paper} isEmbedded />
        </div>
      </div>
    </div>
  );
}
