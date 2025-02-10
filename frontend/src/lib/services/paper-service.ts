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
  paper_ids: string[];
  topic: string;
}

export interface ReviewResponse {
  review: string;
  citations: Paper[];
  topic: string;
}

export async function generateReview(
  request: ReviewRequest
): Promise<ReviewResponse> {
  try {
    // Format paper IDs (remove version numbers if present)
    const formattedRequest = {
      ...request,
      paper_ids: request.paper_ids.map((id) => id.split("v")[0]),
    };

    const response = await fetch(
      `${API_BASE_URL}/api/v1/review/generate-review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedRequest),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to generate review");
    }

    const data = await response.json();
    return {
      review: data.review,
      citations: data.citations,
      topic: request.topic, // Include the topic in the response
    };
  } catch (error) {
    console.error("Generate review error:", error);
    throw error;
  }
}
