import { create } from "zustand";
import { Paper } from "../types/paper";

interface ReviewStore {
  generatedReview: {
    content: string;
    citations: Paper[];
    topic: string;
  } | null;
  setGeneratedReview: (
    review: { content: string; citations: Paper[]; topic: string } | null
  ) => void;
}

export const useReviewStore = create<ReviewStore>((set) => ({
  generatedReview: null,
  setGeneratedReview: (review) => set({ generatedReview: review }),
}));
