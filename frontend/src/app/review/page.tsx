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

  const handleTopicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    setTopic(formData.get("topic") as string);
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

  const handleGenerateReview = async () => {
    if (selectedPapers.size === 0 || !topic) return;

    setIsGenerating(true);
    try {
      const request: ReviewRequest = {
        paper_ids: Array.from(selectedPapers),
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
          <Button type="submit">Find Papers</Button>
        </div>
      </form>

      {/* Paper Selection */}
      {topic && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">2. Select Papers</h2>

          {/* Search Additional Papers */}
          <SearchInput
            onPaperSelect={(paper) => handlePaperSelect(paper.id, true)}
          />

          {/* Selected Papers Count */}
          <div className="text-sm text-muted-foreground">
            {selectedPapers.size} papers selected
          </div>

          {/* Papers Grid */}
          {isLoadingSuggested ? (
            <div>Loading suggested papers...</div>
          ) : (
            <PaperGrid
              papers={suggestedPapers || []}
              selectedPapers={selectedPapers}
              onPaperSelect={handlePaperSelect}
            />
          )}

          {/* Generate Review Button */}
          {selectedPapers.size > 0 && (
            <Button
              onClick={handleGenerateReview}
              disabled={isGenerating}
              className="fixed bottom-6 right-6"
            >
              {isGenerating
                ? "Generating..."
                : `Generate Review (${selectedPapers.size} papers)`}
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
