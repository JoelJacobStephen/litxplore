import { Paper } from "../types/paper";

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

export interface ReviewRequest {
  topic: string;
  max_papers: number;
}

export interface ReviewResponse {
  review: string;
  citations: Paper[];
}

export class PaperService {
  static async generateReview(request: ReviewRequest): Promise<ReviewResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/review/generate-review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to generate review");
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to generate review: ${error.message}`);
      }
      throw error;
    }
  }
}
