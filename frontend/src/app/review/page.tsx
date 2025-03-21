"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PaperGrid } from "@/components/paper-grid";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paper } from "@/lib/types/paper";
import { searchPapers, generateReview } from "@/lib/services/paper-service";
import { ReviewService } from "@/lib/services/review-service";
import { useReviewStore } from "@/lib/stores/review-store";
import { PDFUpload } from "@/components/pdf-upload";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MAX_PAPERS_FOR_REVIEW } from "@/lib/constants";
import { useAuth } from "@clerk/nextjs";

export default function ReviewPage() {
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [displayedPapers, setDisplayedPapers] = useState<Paper[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize selected papers from URL params
  useEffect(() => {
    const paperIds = searchParams.get("papers")?.split(",") || [];
    if (paperIds.length > 0) {
      setSelectedPapers(new Set(paperIds));
    }
  }, [searchParams]);

  // Fetch initial papers when topic is entered
  const { data: suggestedPapers, isLoading: isLoadingSuggested } = useQuery({
    queryKey: ["suggested-papers", topic],
    queryFn: () => searchPapers(topic),
    enabled: !!topic,
  });

  // Merge search results with displayed papers
  useEffect(() => {
    if (suggestedPapers) {
      setDisplayedPapers(suggestedPapers);
    }
  }, [suggestedPapers]);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newTopic = formData.get("topic") as string;
    setTopic(newTopic);
    setIsSearching(true);
    try {
      const papers = await searchPapers(newTopic);
      setDisplayedPapers(papers);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePaperSelect = (paperId: string, selected: boolean) => {
    if (selected && selectedPapers.size >= MAX_PAPERS_FOR_REVIEW) {
      toast.error(
        `You can only select up to ${MAX_PAPERS_FOR_REVIEW} papers for review`
      );
      return;
    }

    const newSelected = new Set(selectedPapers);
    if (selected) {
      newSelected.add(paperId);
    } else {
      newSelected.delete(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const handleAddPaper = (paper: Paper) => {
    if (selectedPapers.size >= MAX_PAPERS_FOR_REVIEW) {
      toast.error(
        `You can only select up to ${MAX_PAPERS_FOR_REVIEW} papers for review`
      );
      return;
    }

    setDisplayedPapers((prev) => {
      if (!prev.find((p) => p.id === paper.id)) {
        const newPapers = [...prev, paper];
        setSelectedPapers((prevSelected) => {
          const newSelected = new Set(prevSelected);
          newSelected.add(paper.id);
          return newSelected;
        });
        return newPapers;
      }
      return prev;
    });
  };

  const handleGenerateReview = async () => {
    if (!selectedPapers.size) {
      toast.error("Please select at least one paper");
      return;
    }

    // Clear any existing generated review to prevent caching issues
    useReviewStore.getState().clearGeneratedReview();
    
    setIsGenerating(true);
    router.push("/generated-review");

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await generateReview({
        papers: Array.from(selectedPapers),
        topic: topic || "Literature Review",
      });

      const generatedReview = {
        review: response.review,
        citations: response.citations || [],
        topic: topic || "Literature Review",
      };

      useReviewStore.setState({ generatedReview });

      // Save the review with the token
      try {
        await ReviewService.saveReview(token, {
          title: topic || "Literature Review",
          topic: topic || "Literature Review",
          content: response.review,
          citations: JSON.stringify(response.citations),
        });
        toast.success("Review saved successfully!");
      } catch (saveError) {
        console.error("Failed to save review:", saveError);
        toast.error(
          "Review generated but failed to save. You can try saving it later."
        );
      }
    } catch (error) {
      console.error("Failed to generate review:", error);
      toast.error("Failed to generate review. Please try again.");
      router.push("/review"); // Return to review page on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col relative">
        <div className="flex items-center gap-3 mb-10">
          <BookOpen className="h-8 w-8 text-blue-400" />
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-600">
            Generate Review
          </h1>
        </div>
        <form onSubmit={handleTopicSubmit} className="space-y-4">
          <h2 className="text-2xl font-bold">1. Enter Research Topic</h2>
          <div className="flex gap-4">
            <Input
              name="topic"
              placeholder="Enter your research topic..."
              defaultValue={topic}
              required
            />
            <Button type="submit" disabled={isSearching}>
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Find Papers"
              )}
            </Button>
          </div>
        </form>

        {topic && (
          <div className="space-y-4 flex-1 flex flex-col">
            <h2 className="text-2xl mt-5 font-bold">2. Select Papers</h2>

            <div className="flex flex-col gap-4">
              {/* Search Additional Papers */}
              <SearchInput
                onPaperSelect={handlePaperSelect}
                selectedPapers={selectedPapers}
                onAddPaper={handleAddPaper}
                currentPaperCount={selectedPapers.size}
              />

              {/* Add PDF Upload */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload PDF</h3>
                <PDFUpload
                  onPaperAdd={handleAddPaper}
                  currentPaperCount={selectedPapers.size}
                />
              </div>
            </div>

            {/* Selected Papers Count */}
            <div className="text-sm text-muted-foreground">
              {selectedPapers.size} of {MAX_PAPERS_FOR_REVIEW} papers selected
            </div>

            {/* Papers Grid with flex-1 to take remaining space */}
            <div className="flex-1 overflow-auto">
              <PaperGrid
                papers={displayedPapers}
                selectedPapers={selectedPapers}
                onPaperSelect={handlePaperSelect}
                isLoading={isLoadingSuggested}
                enableSelection={true}
                enableChat={false}
              />
            </div>
          </div>
        )}

        {/* Floating Generate Review Button - always visible at bottom right */}
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={handleGenerateReview}
            disabled={isGenerating || selectedPapers.size === 0}
            className="shadow-lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Review...
              </>
            ) : selectedPapers.size > 0 ? (
              `Generate Review (${selectedPapers.size} papers)`
            ) : (
              "Generate Review"
            )}
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
}
