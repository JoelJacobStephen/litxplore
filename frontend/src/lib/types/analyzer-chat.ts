export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type AnalyzerChatRequest = {
  paperId: string;
  messages: ChatMessage[];
};
