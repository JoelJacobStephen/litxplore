"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2 } from "lucide-react";
import { Paper, ChatMessage } from "@/lib/types/paper";
import { chatWithPaper } from "@/lib/services/paper-service";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChatInterfaceProps {
  paper: Paper;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export function ChatInterface({
  paper,
  onClose,
  isEmbedded = false,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithPaper(paper.id, input);
      const assistantMessage = {
        role: "assistant",
        content: response.response,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const containerClassName = isEmbedded
    ? "h-full flex flex-col"
    : "fixed inset-y-0 right-0 w-96 h-screen flex flex-col";

  return (
    <Card className={containerClassName}>
      <CardHeader className="border-b">
        <CardTitle className="flex justify-between items-center">
          <span className="truncate">{paper.title}</span>
          {!isEmbedded && onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-4 space-y-4">
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "user" ? (
                <p>{message.content}</p>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => (
                        <p className="mb-2 last:mb-0">{children}</p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 mb-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 mb-2">{children}</ol>
                      ),
                      li: ({ children }) => (
                        <li className="mb-1">{children}</li>
                      ),
                      code: ({ node, inline, children, ...props }) =>
                        inline ? (
                          <code
                            className="bg-secondary px-1 py-0.5 rounded"
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre className="bg-secondary p-2 rounded overflow-x-auto">
                            <code {...props}>{children}</code>
                          </pre>
                        ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-2 border-primary pl-4 italic mb-2">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              )}
              {message.sources && (
                <p className="text-xs mt-2 text-muted-foreground">
                  Sources: Pages {message.sources.map((s) => s.page).join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
      </CardContent>
      <form onSubmit={handleSubmit} className="border-t p-4 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this paper..."
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </Card>
  );
}
