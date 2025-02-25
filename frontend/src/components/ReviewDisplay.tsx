"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Download, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paper } from "@/lib/types/paper";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { generateDocument } from "@/lib/services/document-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ReviewDisplayProps {
  review: string;
  topic: string;
  citations?: Paper[];
  showDownload?: boolean;
  isDialog?: boolean; // Add this prop
}

export const ReviewDisplay = ({
  review,
  topic,
  citations = [],
  showDownload = true,
  isDialog = false, // Add this prop
}: ReviewDisplayProps) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
  };

  const handleDownload = async (format: "pdf" | "latex") => {
    try {
      if (!review) {
        toast.error("No review content available");
        return;
      }

      if (!topic) {
        toast.error("Review topic is required");
        return;
      }

      toast.info(`Preparing ${format.toUpperCase()} document...`);

      const blob = await generateDocument(
        {
          review: review,
          citations: citations,
          topic: topic,
        },
        format
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `literature-review.${format}`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 0);

      toast.success(`${format.toUpperCase()} downloaded successfully`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to download review"
      );
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={cn(
        "container mx-auto py-8 flex flex-col",
        !isDialog && "min-h-[calc(100vh-4rem)]" // Only apply min-height when not in dialog
      )}
    >
      <motion.div
        variants={itemVariants}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-3xl font-bold">
          Literature Review: {topic || "Untitled"}
        </h1>
        {showDownload && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                <FileDown className="h-4 w-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("latex")}>
                <FileDown className="h-4 w-4 mr-2" />
                Download LaTeX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </motion.div>

      <Tabs defaultValue="review" className="w-full flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="citations">
            References ({citations?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="flex-1">
          <Card className="p-6 h-full overflow-auto">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold mb-6">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold mb-4">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold mb-3">{children}</h3>
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
                  li: ({ children }) => <li className="mb-2">{children}</li>,
                  code: ({
                    inline,
                    className,
                    children,
                    ...props
                  }: {
                    inline?: boolean;
                    className?: string;
                    children: React.ReactNode;
                  }) => {
                    return inline ? (
                      <code
                        className="rounded px-1.5 py-0.5 text-sm font-mono bg-muted"
                        {...props}
                      >
                        {children}
                      </code>
                    ) : (
                      <pre className="rounded-lg p-4 mb-4 overflow-x-auto bg-muted">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </pre>
                    );
                  },
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary pl-4 italic my-6">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 underline underline-offset-4 hover:text-blue-400/80 transition-colors"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {review || ""}
              </ReactMarkdown>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="citations" className="flex-1">
          <Card className="p-6 h-full overflow-auto">
            <div className="grid gap-4">
              {citations?.map((paper, index) => (
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
    </motion.div>
  );
};
