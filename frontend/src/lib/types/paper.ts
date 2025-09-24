export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link?: string;
  url?: string;
}

export interface ReviewResponse {
  review: string;
  citations: Paper[];
  topic: string;
}

export interface ChatRequest {
  message: string;
}

export interface ChatResponse {
  response: string;
  sources: Array<{ page: number }>;
}

export interface ReviewRequest {
  paper_ids: string[];
  topic: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sources?: Array<{ page: number }>;
  id?: string;
}

export interface ArxivPaper extends Paper {
  link: string; // Now ArxivPaper extends Paper and requires link
}

export interface ReviewContent {
  review: string; // Changed from content to review
  citations: Paper[];
  topic: string;
}

export enum TaskStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface TaskResponse {
  id: string;
  status: TaskStatus;
  error_message?: string;
  created_at: string;
  result_data?: any;
}
