"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PaperGrid } from "@/components/paper-grid";
import { SearchInput } from "@/components/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Paper } from "@/lib/types/paper";
import { searchPapers, generateReview } from "@/lib/services/paper-service";
import { useReviewStore } from "@/lib/stores/review-store";
import { PDFUpload } from "@/components/pdf-upload";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const review = useReviewStore((state) => state.generatedReview);
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
    const newSelected = new Set(selectedPapers);
    if (selected) {
      newSelected.add(paperId);
    } else {
      newSelected.delete(paperId);
    }
    setSelectedPapers(newSelected);
  };

  const handleAddPaper = (paper: Paper) => {
    setDisplayedPapers((prev) => {
      // Only add if not already in the list
      if (!prev.find((p) => p.id === paper.id)) {
        // Add the paper to displayed papers
        const newPapers = [...prev, paper];
        // Ensure the paper is selected
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

    setIsGenerating(true);
    router.push("/generated-review");

    try {
      const response = await generateReview({
        papers: Array.from(selectedPapers),
        topic: topic || "Literature Review",
      });

      useReviewStore.setState({
        generatedReview: {
          review: response.review, // Changed from content to review
          citations: response.citations || [],
          topic: topic || "Literature Review",
        },
      });
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
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)] flex flex-col">
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
              />

              {/* Add PDF Upload */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Upload PDF</h3>
                <PDFUpload onPaperAdd={handleAddPaper} />
              </div>
            </div>

            {/* Selected Papers Count */}
            <div className="text-sm text-muted-foreground">
              {selectedPapers.size} papers selected
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

            {/* Generate Review Button - keep at bottom */}
            {selectedPapers.size > 0 && (
              <div className="sticky bottom-6 flex justify-end">
                <Button onClick={handleGenerateReview} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Review...
                    </>
                  ) : (
                    `Generate Review (${selectedPapers.size} papers)`
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Review Result */}
        {review && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">3. Literature Review</h2>
            <Card className="p-6">
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: review.review }} />
              </div>
              {review.citations && review.citations.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-bold mb-4">References</h3>
                  <ul className="space-y-2">
                    {review.citations.map((paper, index) => (
                      <li
                        key={paper.id}
                        className="text-sm text-muted-foreground"
                      >
                        [{index + 1}] {paper.title} - {paper.authors.join(", ")}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
