export interface Paper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  url: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ page: number }>;
}

export interface ArxivPaper {
  id: string;
  title: string;
  authors: string[];
  summary: string;
  published: string;
  link: string;
}
