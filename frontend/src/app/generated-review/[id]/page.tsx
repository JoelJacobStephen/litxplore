"use client";

import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PaperGrid } from "@/components/paper-grid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getReview } from "@/lib/services/paper-service";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const { data: review, isLoading } = useQuery({
    queryKey: ["review", params.id],
    queryFn: () => getReview(params.id),
  });

  if (isLoading) {
    return <div>Loading review...</div>;
  }

  if (!review) {
    return <div>Review not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">
        Literature Review: {review.topic}
      </h1>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="review">Review</TabsTrigger>
          <TabsTrigger value="citations">
            Citations ({review.citations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="review">
          <Card className="p-6">
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {review.review}
              </ReactMarkdown>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="citations">
          <Card className="p-6">
            <PaperGrid papers={review.citations} />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
