import { create } from "zustand";
import { Paper } from "../types/paper";

interface ReviewState {
  generatedReview: {
    review: string;
    citations: Paper[];
    topic: string;
  } | null;
  setGeneratedReview: (review: {
    review: string;
    citations: Paper[];
    topic: string;
  }) => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  generatedReview: null,
  setGeneratedReview: (review) => set({ generatedReview: review }),
}));
