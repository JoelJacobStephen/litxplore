import { ReviewContent } from "@/lib/types/paper";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function generateDocument(
  review: ReviewContent,
  format: "pdf" | "latex"
): Promise<Blob> {
  try {
    // Validate required fields
    if (!review.topic) {
      throw new Error("Topic is required");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/documents/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: review.review, // Changed from review.content to review.review
        citations: review.citations,
        topic: review.topic,
        format: format,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Document generation failed:", errorData);
      
      // Handle the new error format
      if (errorData.status === "error" && errorData.error) {
        throw new Error(errorData.error.message || "Failed to generate document");
      } else {
        // Handle old format or other error formats
        const errorMessage =
          errorData.detail?.[0]?.msg ||
          errorData.detail ||
          "Failed to generate document";
        throw new Error(errorMessage);
      }
    }

    const contentType = response.headers.get("content-type");
    if (
      !contentType?.includes("application/pdf") &&
      !contentType?.includes("application/x-latex")
    ) {
      throw new Error(`Unexpected content type: ${contentType}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("Document generation error:", error);
    if (error instanceof Error) {
      throw new Error(`Document generation failed: ${error.message}`);
    }
    throw new Error("Document generation failed");
  }
}
