"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "../query-provider";
import {
  Paper,
  ChatResponse,
  ReviewContent,
  TaskResponse,
  TaskStatus,
} from "../types/paper";

// ============================================================================
// QUERY KEYS - Centralized for consistency
// ============================================================================

export const queryKeys = {
  papers: {
    all: ["papers"] as const,
    search: (query: string) =>
      [...queryKeys.papers.all, "search", query] as const,
    byId: (id: string) => [...queryKeys.papers.all, "detail", id] as const,
    chat: (paperId: string) =>
      [...queryKeys.papers.byId(paperId), "chat"] as const,
  },
  reviews: {
    all: ["reviews"] as const,
    history: () => [...queryKeys.reviews.all, "history"] as const,
    byId: (id: string) => [...queryKeys.reviews.all, "detail", id] as const,
  },
  tasks: {
    all: ["tasks"] as const,
    byId: (id: string) => [...queryKeys.tasks.all, "detail", id] as const,
    userTasks: () => [...queryKeys.tasks.all, "userTasks"] as const,
  },
} as const;

// ============================================================================
// PAPER HOOKS
// ============================================================================

/**
 * Search papers from arXiv
 */
export function useSearchPapers(query: string, enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.papers.search(query),
    queryFn: async (): Promise<Paper[]> => {
      if (!query.trim()) return [];

      const response = await authenticatedFetch(
        `/api/v1/papers/search?query=${encodeURIComponent(query)}`
      );
      return response.json();
    },
    enabled: enabled && !!query.trim(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Upload PDF file
 */
export function useUploadPaper() {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<Paper> => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await authenticatedFetch("/api/v1/papers/upload", {
        method: "POST",
        body: formData,
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate papers cache
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.all });
    },
  });
}

/**
 * Get paper by ID
 */
export function usePaper(paperId: string, enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.papers.byId(paperId),
    queryFn: async (): Promise<Paper> => {
      const response = await authenticatedFetch(`/api/v1/papers/${paperId}`);
      return response.json();
    },
    enabled: enabled && !!paperId,
  });
}

/**
 * Chat with a paper
 */
export function useChatWithPaper() {
  const authenticatedFetch = useAuthenticatedFetch();

  return useMutation({
    mutationFn: async ({
      paperId,
      message,
    }: {
      paperId: string;
      message: string;
    }): Promise<ChatResponse> => {
      const response = await authenticatedFetch(
        `/api/v1/papers/${paperId}/chat`,
        {
          method: "POST",
          body: JSON.stringify({ message }),
        }
      );
      return response.json();
    },
  });
}

/**
 * Stream chat with paper (for real-time responses)
 */
export function useStreamChatWithPaper() {
  const authenticatedFetch = useAuthenticatedFetch();

  return useMutation({
    mutationFn: async ({
      paperId,
      message,
      model = "gemini-2.0-flash",
      customSystemPrompt,
    }: {
      paperId: string;
      message: string;
      model?: string;
      customSystemPrompt?: string;
    }): Promise<Response> => {
      return authenticatedFetch(`/api/v1/papers/${paperId}/chat/stream`, {
        method: "POST",
        body: JSON.stringify({
          message,
          model,
          custom_system_prompt: customSystemPrompt,
        }),
      });
    },
  });
}

// ============================================================================
// REVIEW HOOKS
// ============================================================================

/**
 * Start review generation task
 */
export function useGenerateReview() {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      papers,
      topic,
      maxPapers = 10,
    }: {
      papers: string[];
      topic: string;
      maxPapers?: number;
    }): Promise<TaskResponse> => {
      console.log("Starting review generation task with:", {
        papers,
        topic,
        maxPapers,
      });

      const response = await authenticatedFetch(
        "/api/v1/review/generate-review",
        {
          method: "POST",
          body: JSON.stringify({
            paper_ids: papers,
            topic,
            max_papers: maxPapers,
          }),
        }
      );

      console.log("API Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error response:", errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("Task created:", data);
      return data;
    },
    onSuccess: (_data) => {
      // Invalidate tasks cache
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
    },
  });
}

/**
 * Save review to database
 */
export function useSaveReview() {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewData: {
      title: string;
      topic: string;
      content: string;
      citations?: string;
    }): Promise<{ review_id: number }> => {
      const response = await authenticatedFetch("/api/v1/review/save", {
        method: "POST",
        body: JSON.stringify(reviewData),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate reviews cache
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.history() });
    },
  });
}

/**
 * Get review history
 */
export function useReviewHistory(enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.reviews.history(),
    queryFn: async (): Promise<
      Array<{
        id: number;
        title: string;
        topic: string;
        content: string;
        citations?: string;
        created_at: string;
        updated_at: string;
      }>
    > => {
      const response = await authenticatedFetch("/api/v1/review/history");
      return response.json();
    },
    enabled,
  });
}

/**
 * Get review by ID
 */
export function useReview(reviewId: string, enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.reviews.byId(reviewId),
    queryFn: async (): Promise<{
      id: number;
      title: string;
      topic: string;
      content: string;
      citations?: string;
      created_at: string;
      updated_at: string;
    }> => {
      const response = await authenticatedFetch(`/api/v1/review/${reviewId}`);
      return response.json();
    },
    enabled: enabled && !!reviewId,
  });
}

/**
 * Delete review
 */
export function useDeleteReview() {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reviewId: number): Promise<void> => {
      await authenticatedFetch(`/api/v1/review/${reviewId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate reviews cache
      queryClient.invalidateQueries({ queryKey: queryKeys.reviews.history() });
    },
  });
}

// ============================================================================
// DOCUMENT GENERATION HOOKS
// ============================================================================

/**
 * Generate document (PDF/LaTeX) from review
 */
export function useGenerateDocument() {
  const authenticatedFetch = useAuthenticatedFetch();

  return useMutation({
    mutationFn: async ({
      review,
      format,
    }: {
      review: ReviewContent;
      format: "pdf" | "latex";
    }): Promise<Blob> => {
      const response = await authenticatedFetch("/api/v1/documents/generate", {
        method: "POST",
        body: JSON.stringify({
          content: review.review,
          citations: review.citations,
          topic: review.topic,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }

      return response.blob();
    },
  });
}

// ============================================================================
// STREAMING HOOKS FOR REAL-TIME FEATURES
// ============================================================================

/**
 * Stream chat responses (for real-time typing effect)
 */
export function useStreamResponse() {
  return useMutation({
    mutationFn: async ({
      response,
      onChunk,
    }: {
      response: Response;
      onChunk: (chunk: string) => void;
    }): Promise<void> => {
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") return;

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  onChunk(parsed.content);
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  });
}

// ============================================================================
// TASK HOOKS
// ============================================================================

/**
 * Get task status by ID with polling
 */
export function useTaskStatus(taskId: string | null, enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.tasks.byId(taskId || ""),
    queryFn: async (): Promise<TaskResponse> => {
      if (!taskId) throw new Error("Task ID is required");

      const response = await authenticatedFetch(`/api/v1/tasks/${taskId}`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch task: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    enabled: enabled && !!taskId,
    refetchInterval: (query) => {
      // Poll every 2 seconds if task is pending or running
      const data = query.state.data as TaskResponse | undefined;
      if (
        data?.status === TaskStatus.PENDING ||
        data?.status === TaskStatus.RUNNING
      ) {
        return 2000;
      }
      // Stop polling if completed or failed
      return false;
    },
    refetchIntervalInBackground: false,
  });
}

/**
 * Get user tasks
 */
export function useUserTasks(enabled = true) {
  const authenticatedFetch = useAuthenticatedFetch();

  return useQuery({
    queryKey: queryKeys.tasks.userTasks(),
    queryFn: async (): Promise<TaskResponse[]> => {
      const response = await authenticatedFetch("/api/v1/tasks/");

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to fetch tasks: ${response.status} - ${errorText}`
        );
      }

      return response.json();
    },
    enabled,
  });
}

/**
 * Cancel a task
 */
export function useCancelTask() {
  const authenticatedFetch = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      const response = await authenticatedFetch(
        `/api/v1/tasks/${taskId}/cancel`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to cancel task: ${response.status} - ${errorText}`
        );
      }
    },
    onSuccess: (_, taskId) => {
      // Invalidate the specific task and user tasks
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.byId(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.userTasks() });
    },
  });
}

/**
 * Hook to poll task until completion and return the result
 */
export function useTaskPolling(taskId: string | null, enabled = true) {
  const taskQuery = useTaskStatus(taskId, enabled);

  const taskData = taskQuery.data as TaskResponse | undefined;
  const isCompleted = taskData?.status === TaskStatus.COMPLETED;
  const isFailed = taskData?.status === TaskStatus.FAILED;
  const isFinished = isCompleted || isFailed;

  return {
    ...taskQuery,
    isCompleted,
    isFailed,
    isFinished,
    isRunning: taskData?.status === TaskStatus.RUNNING,
    isPending: taskData?.status === TaskStatus.PENDING,
    errorMessage: taskData?.error_message,
    result: taskData?.result_data,
  };
}
