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

  useEffect(() => {
    if (!generatedReview && !isLoading) {
      router.push("/review");
    }
  }, [generatedReview, router, isLoading]);

  useEffect(() => {
    if (generatedReview) {
      setIsLoading(false);
    }
  }, [generatedReview]);

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
