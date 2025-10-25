import { SuggestedQuestion } from "@/lib/types/analysis";

export const FALLBACK_SUGGESTED_QUESTIONS: SuggestedQuestion[] = [
  {
    question: "Explain the methodology in more detail",
    category: "methodology",
  },
  {
    question: "Summarize the main result",
    category: "results",
  },
  {
    question: "List limitations mentioned by the authors",
    category: "limitations",
  },
  {
    question: "What are the practical applications?",
    category: "applications",
  },
  {
    question: "What datasets were used?",
    category: "datasets",
  },
];

export function getFallbackQuestionsIfMissing(
  questions: SuggestedQuestion[] | undefined
): SuggestedQuestion[] {
  if (!questions || questions.length === 0) {
    return FALLBACK_SUGGESTED_QUESTIONS;
  }
  return questions;
}
