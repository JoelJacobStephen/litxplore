"use client";

import { useEffect, useState } from "react";
import { ReviewService } from "@/lib/services/review-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { Paper } from "@/lib/types/paper";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface Review {
  id: number;
  title: string;
  topic: string;
  content: string;
  citations?: string;
  created_at: string;
  updated_at: string;
}

export default function HistoryPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedCitations, setParsedCitations] = useState<Paper[]>([]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    const fetchReviews = async () => {
      try {
        const token = await getToken();
        if (!token) {
          throw new Error("No authentication token available");
        }
        const reviewHistory = await ReviewService.getReviewHistory(token);
        setReviews(reviewHistory);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch reviews"
        );
      } finally {
        setLoading(false);
      }
    };

    if (isSignedIn) {
      fetchReviews();
    }
  }, [isLoaded, isSignedIn, router, getToken]);

  useEffect(() => {
    if (selectedReview?.citations) {
      try {
        // Parse the citations string to an array of Paper objects
        const citations = JSON.parse(selectedReview.citations) as Paper[];
        setParsedCitations(citations);
      } catch (err) {
        console.error("Failed to parse citations:", err);
        setParsedCitations([]);
      }
    } else {
      setParsedCitations([]);
    }
  }, [selectedReview]);

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
    setIsDialogOpen(true);
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">Review History</h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Review History</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No reviews found. Generate your first literature review to see it
            here!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="flex flex-col cursor-pointer hover:border-primary transition-colors"
              onClick={() => handleReviewClick(review)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">{review.title}</CardTitle>
                <CardDescription>
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ScrollArea className="h-[200px]">
                  <div>
                    <h4 className="font-semibold mb-2">Topic</h4>
                    <p className="text-sm text-gray-600 mb-4">{review.topic}</p>
                    <h4 className="font-semibold mb-2">Review</h4>
                    <p className="text-sm text-gray-600 line-clamp-6">
                      {review.content}
                    </p>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] overflow-auto p-8">
          <DialogTitle>{selectedReview?.title}</DialogTitle>
          <DialogDescription>
            Created{" "}
            {selectedReview &&
              formatDistanceToNow(new Date(selectedReview.created_at), {
                addSuffix: true,
              })}
          </DialogDescription>
          {selectedReview && (
            <ReviewDisplay
              review={selectedReview.content}
              topic={selectedReview.topic}
              citations={parsedCitations}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
