"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useReviewStore } from "@/lib/stores/review-store";
import dynamic from "next/dynamic";
import { ReviewDisplay } from "@/components/ReviewDisplay";

const Loading = dynamic(() => import("./loading"), { ssr: false });

export default function GeneratedReviewPage() {
  const router = useRouter();
  const generatedReview = useReviewStore((state) => state.generatedReview);
  const [isLoading, setIsLoading] = useState(!generatedReview);
  const [redirectTimeoutId, setRedirectTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Redirect to review page if no review is present and we're not loading
  useEffect(() => {
    if (!generatedReview && !isLoading) {
      const timeoutId = setTimeout(() => {
        router.push("/review");
      }, 500);
      setRedirectTimeoutId(timeoutId);
    }
    
    return () => {
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId);
      }
    };
  }, [generatedReview, router, isLoading, redirectTimeoutId]);

  // Update loading state when review is available
  useEffect(() => {
    if (generatedReview) {
      setIsLoading(false);
      if (redirectTimeoutId) {
        clearTimeout(redirectTimeoutId);
        setRedirectTimeoutId(null);
      }
    }
  }, [generatedReview, redirectTimeoutId]);

  if (isLoading || !generatedReview) {
    return <Loading />;
  }

  return (
    <ReviewDisplay
      review={generatedReview.review}
      topic={generatedReview.topic}
      citations={generatedReview.citations}
      showDownload={true}
    />
  );
}
