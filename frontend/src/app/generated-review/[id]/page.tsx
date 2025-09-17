"use client";

import { useReview } from "@/lib/hooks/api-hooks";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { Skeleton } from "@/components/ui/skeleton";
import { Paper } from "@/lib/types/paper";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const { data: review, isLoading } = useReview(params.id);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-12 w-2/3 mb-6" />
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Review not found
        </div>
      </div>
    );
  }

  // Parse citations string to Paper array
  let parsedCitations: Paper[] = [];
  if (review.citations) {
    try {
      parsedCitations = JSON.parse(review.citations);
    } catch (err) {
      console.error("Failed to parse citations:", err);
    }
  }

  return (
    <ReviewDisplay
      review={review.content}
      topic={review.topic}
      citations={parsedCitations}
      showDownload={true}
    />
  );
}
