"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { PulseLoader } from "react-spinners";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  PaperService,
  ReviewRequest,
  ReviewResponse,
} from "@/lib/services/paper-service";
import { Paper } from "@/lib/types/paper";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkToc from "remark-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReviewForm {
  topic: string;
  maxPapers: number;
}

export default function ReviewPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [review, setReview] = useState<ReviewResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewForm>({
    defaultValues: {
      topic: "",
      maxPapers: 10,
    },
  });

  const onSubmit = async (data: ReviewForm) => {
    setIsLoading(true);
    setError(null);
    try {
      const request: ReviewRequest = {
        topic: data.topic,
        max_papers: data.maxPapers,
      };
      const response = await PaperService.generateReview(request);
      setReview(response);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate review"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Literature Review Generator</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2">
            Research Topic
          </label>
          <Input
            {...register("topic", {
              required: "Topic is required",
              minLength: {
                value: 3,
                message: "Topic must be at least 3 characters",
              },
              maxLength: {
                value: 500,
                message: "Topic must be at most 500 characters",
              },
            })}
            placeholder="Enter your research topic..."
            className="w-full"
          />
          {errors.topic && (
            <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Maximum Papers
          </label>
          <Input
            type="number"
            {...register("maxPapers", {
              required: "Number of papers is required",
              min: { value: 1, message: "Minimum 1 paper" },
              max: { value: 20, message: "Maximum 20 papers" },
            })}
            className="w-full"
          />
          {errors.maxPapers && (
            <p className="text-red-500 text-sm mt-1">
              {errors.maxPapers.message}
            </p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <PulseLoader size={8} color="white" />
          ) : (
            "Generate Review"
          )}
        </Button>
      </form>

      {error && (
        <Card className="p-4 mb-8 bg-red-50 border-red-200">
          <p className="text-red-600">{error}</p>
        </Card>
      )}

      {review && (
        <div className="space-y-8">
          <Tabs defaultValue="review" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="review">Literature Review</TabsTrigger>
              <TabsTrigger value="citations">Citations</TabsTrigger>
            </TabsList>

            <TabsContent value="review">
              <Card className="p-6">
                <div className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkToc]}
                    rehypePlugins={[rehypeSlug, rehypeAutolinkHeadings]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold mt-8 mb-4">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-semibold mt-6 mb-3">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-medium mt-4 mb-2">
                          {children}
                        </h3>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-4">
                          {children}
                        </blockquote>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc list-inside my-4 space-y-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal list-inside my-4 space-y-2">
                          {children}
                        </ol>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4">
                          <table className="min-w-full divide-y divide-gray-200">
                            {children}
                          </table>
                        </div>
                      ),
                    }}
                  >
                    {review.review}
                  </ReactMarkdown>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="citations">
              <div className="grid gap-4 md:grid-cols-2">
                {review.citations.map((paper, index) => (
                  <Card key={paper.id} className="p-4">
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-sm bg-primary/10 px-2 py-1 rounded">
                        [{index + 1}]
                      </span>
                      <div>
                        <h3 className="font-semibold mb-2">{paper.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {paper.authors.join(", ")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                          Published:{" "}
                          {new Date(paper.published).toLocaleDateString()}
                        </p>
                        <p className="text-sm mb-2">{paper.summary}</p>
                        <a
                          href={paper.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm inline-flex items-center"
                        >
                          View Paper
                          <svg
                            className="w-4 h-4 ml-1"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
