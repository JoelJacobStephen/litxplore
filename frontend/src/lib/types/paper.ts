export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  url: string;
  link?: string; // Add link property that maps to url
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
  content: string;
  citations: Paper[];
  topic: string;
}

export interface ReviewResponse {
  content: string; // Changed from 'review' to 'content'
  citations: Paper[];
  topic: string;
}
