import { Paper } from "../types/paper";
import { Paper, ReviewRequest, ReviewResponse } from "@/lib/types/paper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function searchPapers(query: string): Promise<Paper[]> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/papers/search?query=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to search papers");
    }

    const data = await response.json();
    return data.map((paper: any) => ({
      ...paper,
      url: paper.url || paper.pdf_url || null, // Ensure URL is always defined
    }));
  } catch (error) {
    console.error("Search papers error:", error);
    return []; // Return empty array on error
  }
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  sources: Array<{ page: number }>;
}

export async function chatWithPaper(
  paperId: string,
  message: string
): Promise<ChatResponse> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/papers/${paperId}/chat`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to get response");
  }

  return response.json();
}

export const streamChat = async (
  paperId: string,
  message: string
): Promise<Response> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/papers/${paperId}/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to get chat response");
    }

    return response;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export interface ReviewRequest {
  paper_ids: string[];
  topic: string;
}

export interface ReviewResponse {
  review: string; // Changed from 'content' to 'review'
  citations: Paper[];
  topic: string;
}

export async function generateReview({
  papers,
  topic,
}: {
  papers: string[];
  topic: string;
}): Promise<ReviewResponse> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/review/generate-review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper_ids: papers, // Changed from 'papers' to 'paper_ids'
          topic,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(JSON.stringify(error));
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating review:", error);
    throw error;
  }
}

export async function getReview(id: string): Promise<ReviewResponse> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/review/${id}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch review");
  }
  return response.json();
}
