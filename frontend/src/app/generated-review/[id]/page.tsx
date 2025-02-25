"use client";

import { useQuery } from "@tanstack/react-query";
import { getReview } from "@/lib/services/paper-service";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReviewPage({ params }: { params: { id: string } }) {
  const { data: review, isLoading } = useQuery({
    queryKey: ["review", params.id],
    queryFn: () => getReview(params.id),
  });

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

  return (
    <ReviewDisplay
      review={review.review}
      topic={review.topic}
      citations={review.citations}
      showDownload={true}
    />
  );
}
