"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
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

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [review, setReview] = useState<ReviewResponse | null>(null);
  const setGeneratedReview = useReviewStore(
    (state) => state.setGeneratedReview
  );
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
    if (selectedPapers.size === 0 || !topic) return;

    setIsGenerating(true);
    try {
      // Convert Set to Array and ensure IDs are strings
      const paperIds = Array.from(selectedPapers).map((id) => String(id));

      const request: ReviewRequest = {
        paper_ids: paperIds,
        topic: topic,
      };

      const response = await generateReview(request);

      // Store in global state
      setGeneratedReview({
        content: response.review,
        citations: response.citations,
        topic: response.topic,
      });

      // Navigate to review page without params
      router.push("/generated-review");
    } catch (error) {
      console.error("Failed to generate review:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Topic Input Form */}
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

      {/* Paper Selection */}
      {topic && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">2. Select Papers</h2>

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

          {/* Papers Grid */}
          <PaperGrid
            papers={displayedPapers}
            selectedPapers={selectedPapers}
            onPaperSelect={handlePaperSelect}
            isLoading={isLoadingSuggested}
          />

          {/* Generate Review Button */}
          {selectedPapers.size > 0 && (
            <Button
              onClick={handleGenerateReview}
              disabled={isGenerating}
              className="fixed bottom-6 right-6"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Review...
                </>
              ) : (
                `Generate Review (${selectedPapers.size} papers)`
              )}
            </Button>
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
  );
}
