import {
  Paper,
  ReviewResponse,
  ChatResponse,
  ReviewRequest,
} from "@/lib/types/paper";

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
  message: string,
  model: string = "gemini-2.0-flash", // Default to Gemini 2.0 Flash
  customSystemPrompt?: string // Optional custom system prompt
): Promise<Response> => {
  try {
    // Add cache-busting timestamp to prevent caching
    const cacheBuster = new Date().getTime();

    // Expert research paper assistant prompt
    const defaultSystemPrompt = `
      You are an expert research paper assistant with deep knowledge of academic literature and scientific research.
      Your purpose is to help users understand the content, methodology, findings, and implications of the research paper they're reading.
      
      Follow these guidelines when responding to questions:
      
      1. Focus on providing accurate, detailed information based specifically on this paper's content.
      2. When discussing methodology, be precise about what the researchers did and why.
      3. When discussing results, clearly explain what was found and its significance.
      4. When explaining technical concepts, break them down into understandable components while preserving accuracy.
      5. When asked about implications or applications, be specific about what the research suggests and its limitations.
      6. If referring to figures, tables, or sections, be specific about their location and content.
      7. If the answer isn't explicitly in the paper, clearly state this and offer related information that is present.
      8. When appropriate, contextualize the paper within its broader research field.
      9. Use academic language but explain complex terms.
      10. Structure your answers with clear organization using appropriate headings and bullet points when helpful.
      
      Your goal is to help users deeply understand this specific paper as if they were discussing it with a knowledgeable colleague or professor in the field.
    `;

    // Use custom system prompt if provided, otherwise use default
    const systemPrompt = customSystemPrompt || defaultSystemPrompt;

    const response = await fetch(
      `${API_BASE_URL}/api/v1/papers/${paperId}/chat?_=${cacheBuster}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          message,
          model,
          systemPrompt,
        }),
      }
    );

    if (!response.ok) {
      // Try to get error details, but handle cases where response isn't JSON
      try {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || `Failed with status ${response.status}`
        );
      } catch (jsonError) {
        // If we can't parse JSON, use the status text
        throw new Error(`Failed to get chat response: ${response.statusText}`);
      }
    }

    return response;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
};

export async function generateReview({
  papers,
  topic,
}: {
  papers: string[];
  topic: string;
}): Promise<ReviewResponse> {
  try {
    // Add a cache-busting query parameter with a timestamp
    const cacheBuster = new Date().getTime();

    const response = await fetch(
      `${API_BASE_URL}/api/v1/review/generate-review?_=${cacheBuster}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        body: JSON.stringify({
          paper_ids: papers,
          topic,
        } as ReviewRequest),
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
