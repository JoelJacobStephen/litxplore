"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PaperGrid } from "@/components/paper-grid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReviewStore } from "@/lib/stores/review-store";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function GeneratedReviewPage() {
  const router = useRouter();
  const generatedReview = useReviewStore((state) => state.generatedReview);

  // Redirect if no review data is present
  useEffect(() => {
    if (!generatedReview) {
      router.push("/review");
    }
  }, [generatedReview, router]);

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    console.log("Download PDF");
  };

  if (!generatedReview) {
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          Literature Review: {generatedReview.topic}
        </h1>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="citations">
            References ({generatedReview.citations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <Card className="p-6">
            <div className="prose prose-invert max-w-none prose-headings:text-primary prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-4">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mb-3">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mb-2">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-7">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-4">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-4">{children}</ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {generatedReview.content}
              </ReactMarkdown>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="citations">
          <Card className="p-6">
            <div className="grid gap-4">
              {generatedReview.citations.map((paper, index) => (
                <div
                  key={paper.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-2xl font-bold text-primary">
                      [{index + 1}]
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-2">{paper.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {paper.authors.join(", ")}
                      </p>
                      <p className="text-sm mb-2">
                        Published:{" "}
                        {new Date(paper.published).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {paper.summary}
                      </p>
                      {paper.url && (
                        <Button
                          variant="link"
                          className="px-0 text-primary"
                          asChild
                        >
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Paper
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
