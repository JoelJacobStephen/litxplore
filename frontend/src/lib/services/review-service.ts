interface Review {
  id: number;
  title: string;
  topic: string;
  content: string;
  citations?: string;
  created_at: string;
  updated_at: string;
}

export class ReviewService {
  private static readonly BASE_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  static async saveReview(
    token: string,
    reviewData: {
      title: string;
      topic: string;
      content: string;
      citations?: string;
    }
  ): Promise<{ review_id: number }> {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${this.BASE_URL}/api/v1/review/save`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(reviewData),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({
          status: "error",
          error: { message: "Failed to save review" },
        }));

      // Handle the new error format
      if (errorData.status === "error" && errorData.error) {
        throw new Error(errorData.error.message || "Failed to save review");
      } else {
        throw new Error(errorData.detail || "Failed to save review");
      }
    }

    return response.json();
  }

  static async getReviewHistory(token: string): Promise<Review[]> {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${this.BASE_URL}/api/v1/review/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle the new error format
      if (errorData.status === "error" && errorData.error) {
        throw new Error(
          errorData.error.message || "Failed to fetch review history"
        );
      } else {
        throw new Error(errorData.detail || "Failed to fetch review history");
      }
    }

    return response.json();
  }

  static async getReviewById(token: string, reviewId: number): Promise<Review> {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${this.BASE_URL}/api/v1/review/${reviewId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle the new error format
      if (errorData.status === "error" && errorData.error) {
        throw new Error(errorData.error.message || "Failed to fetch review");
      } else {
        throw new Error(errorData.detail || "Failed to fetch review");
      }
    }

    return response.json();
  }

  static async deleteReview(token: string, reviewId: number): Promise<void> {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${this.BASE_URL}/api/v1/review/${reviewId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle the new error format
      if (errorData.status === "error" && errorData.error) {
        throw new Error(errorData.error.message || "Failed to delete review");
      } else {
        throw new Error(errorData.detail || "Failed to delete review");
      }
    }
  }
}
