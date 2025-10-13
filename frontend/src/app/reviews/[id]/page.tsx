"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PaperGrid } from "@/components/paper-grid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Paper } from "@/lib/api/generated";

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const [reviewContent, setReviewContent] = useState<string>("");
  const [citations, setCitations] = useState<Paper[]>([]);

  useEffect(() => {
    // Decode the URL parameters
    const content = searchParams.get("content");
    const papersParam = searchParams.get("papers");

    if (content) {
      setReviewContent(decodeURIComponent(content));
    }

    if (papersParam) {
      try {
        const parsedPapers = JSON.parse(decodeURIComponent(papersParam));
        setCitations(parsedPapers);
      } catch (e) {
        console.error("Error parsing papers:", e);
      }
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Literature Review</h1>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="citations">
            Citations ({citations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <Card className="p-6">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {reviewContent}
              </ReactMarkdown>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="citations">
          <Card className="p-6">
            <PaperGrid papers={citations} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
