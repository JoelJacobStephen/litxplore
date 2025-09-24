import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  clearGeneratedReview: () => void;
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      generatedReview: null,
      setGeneratedReview: (review) => set({ generatedReview: review }),
      clearGeneratedReview: () => set({ generatedReview: null }),
    }),
    {
      name: "review-storage",
      storage: {
        getItem: (name: string) => {
          if (typeof window !== "undefined") {
            const value = sessionStorage.getItem(name);
            return value ? JSON.parse(value) : null;
          }
          return null;
        },
        setItem: (name: string, value: any) => {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name: string) => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(name);
          }
        },
      },
    }
  )
);
