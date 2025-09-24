"use client";

import { useState, useEffect } from "react";
import { useReviewHistory, useDeleteReview } from "@/lib/hooks/api-hooks";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, isToday } from "date-fns";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ReviewDisplay } from "@/components/ReviewDisplay";
import { Paper } from "@/lib/types/paper";
import { DialogDescription, DialogTitle } from "@radix-ui/react-dialog";
import { Trash2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface Review {
  id: number;
  title: string;
  topic: string;
  content: string;
  citations?: string;
  created_at: string;
  updated_at: string;
}

const DeleteButton = ({
  reviewId,
  setDeletingReviewId,
}: {
  reviewId: number;
  setDeletingReviewId: (id: number | null) => void;
}) => {
  // Function to handle delete button click with event stopping
  const handleClick = (e: React.MouseEvent) => {
    // These are crucial to prevent event bubbling
    e.preventDefault();
    e.stopPropagation();
    setDeletingReviewId(reviewId);
    return false;
  };

  return (
    <div
      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20"
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <Button
        variant="ghost"
        size="icon"
        className="hover:bg-red-900/20 hover:text-red-400"
        onClick={handleClick}
      >
        <Trash2 className="h-4 w-4 text-red-400" />
      </Button>
    </div>
  );
};

export default function HistoryPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [parsedCitations, setParsedCitations] = useState<Paper[]>([]);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  // React Query hooks
  const {
    data: reviews = [],
    isLoading: loading,
    error,
  } = useReviewHistory(isLoaded && isSignedIn);
  const deleteReview = useDeleteReview();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // Parse citations when selectedReview changes
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

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const handleReviewClick = (review: Review) => {
    setSelectedReview(review);
    setIsDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingReviewId) return;

    deleteReview.mutate(deletingReviewId, {
      onSuccess: () => {
        setDeletingReviewId(null);
      },
      onError: (err) => {
        console.error("Failed to delete review:", err);
      },
    });
  };

  if (!isLoaded || loading) {
    return (
      <div className="container mx-auto p-6 space-y-4 relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <History className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Review History
          </h1>
        </div>
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {[1, 2, 3].map((i) => (
            <motion.div key={i} variants={itemVariants}>
              <Card className="h-[350px]">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 bg-gray-800" />
                  <Skeleton className="h-4 w-1/3 bg-gray-800" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-24 w-full bg-gray-800" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 relative z-10">
        <div className="bg-red-900/20 border border-red-800 text-red-300 px-4 py-3 rounded backdrop-blur-sm">
          {error.message ||
            "Unable to find or load generated literature reviews"}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 relative z-10">
      <div className="flex items-center gap-3 mb-6">
        <History className="h-8 w-8 text-blue-400" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
          Review History
        </h1>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-20 border border-gray-800 rounded-lg bg-gray-900/50 backdrop-blur-sm">
          <div className="mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 p-4 inline-block mb-4">
            <History className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400 text-lg">
            No reviews found. Generate your first literature review to see it
            here!
          </p>
          <Button
            variant="gradient"
            className="mt-4"
            onClick={() => router.push("/review")}
          >
            Create Your First Review
          </Button>
        </div>
      ) : (
        <motion.div
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card
                className="flex flex-col cursor-pointer group hover:border-blue-600 transition-colors h-[350px] relative"
                onClick={() => handleReviewClick(review)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <DeleteButton
                  reviewId={review.id}
                  setDeletingReviewId={setDeletingReviewId}
                />

                <CardHeader className="relative z-10">
                  <CardTitle className="line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {review.title}
                  </CardTitle>
                  <CardDescription>
                    {isToday(new Date(review.created_at))
                      ? "Today"
                      : format(new Date(review.created_at), "d MMM yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow relative z-10 overflow-hidden">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-blue-400">Topic</h4>
                    <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                      {review.topic}
                    </p>
                    <h4 className="font-semibold text-blue-400">Review</h4>
                    <div className="text-sm text-gray-300 prose-sm prose-invert line-clamp-6">
                      <ReactMarkdown>{review.content}</ReactMarkdown>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl w-full h-[90vh] overflow-auto p-8 border-blue-600/30 bg-gray-900/95">
          {selectedReview && (
            <>
              <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
                {selectedReview.title}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Created{" "}
                {isToday(new Date(selectedReview.created_at))
                  ? "Today"
                  : format(new Date(selectedReview.created_at), "d MMM yyyy")}
              </DialogDescription>
              <ReviewDisplay
                review={selectedReview.content}
                topic={selectedReview.topic}
                citations={parsedCitations}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingReviewId !== null}
        onOpenChange={() => setDeletingReviewId(null)}
      >
        <AlertDialogContent className="border-red-600/30 bg-gray-900/95">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-700 hover:bg-gray-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-700 text-white hover:bg-red-800"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
