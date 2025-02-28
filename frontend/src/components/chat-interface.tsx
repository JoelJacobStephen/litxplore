"use client";

import { useChat } from "ai/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface ChatInterfaceProps {
  paper: Paper;
  isEmbedded?: boolean;
  onClose?: () => void; // Add this line
}

export function ChatInterface({
  paper,
  isEmbedded = false,
  onClose, // Add this to destructuring
}: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/chat",
    body: {
      paperId: paper.id,
    },
    onFinish: () => {
      scrollToBottom();
      inputRef.current?.focus();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      className={`flex h-full flex-col overflow-hidden bg-background ${
        isEmbedded ? "" : "border rounded-lg"
      }`}
    >
      {/* Header - Fixed */}
      <div className="border-b p-4 flex-shrink-0 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Chat with Paper</h2>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {paper.title}
          </p>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={cn(
              "p-4 max-w-[90%]",
              message.role === "user"
                ? "ml-auto bg-slate-700 text-secondary-foreground" // User message
                : "bg-persian-blue-900 text-card-foreground border" // Assistant message
            )}
          >
            <div
              className={cn(
                "prose prose-sm max-w-none",
                message.role === "user"
                  ? "prose-stone" // Light text for user messages
                  : "prose-stone dark:prose-invert" // Dark text for assistant messages
              )}
            >
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
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  code: ({
                    inline,
                    className,
                    children,
                    ...props
                  }: {
                    inline?: boolean;
                    className?: string;
                    children: React.ReactNode;
                    [key: string]: any;
                  }) => (
                    <code
                      className={cn(
                        "rounded text-sm",
                        inline
                          ? "bg-muted/50 px-1 py-0.5"
                          : "bg-muted/20 block p-2",
                        message.role === "user"
                          ? "text-primary-foreground"
                          : "text-persian-blue-900",
                        className
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </Card>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form - Fixed */}
      <form
        onSubmit={handleSubmit}
        className="border-t p-4 flex gap-2 items-center flex-shrink-0"
      >
        <Input
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about the paper..."
          className="flex-1"
        />
        <Button type="submit" size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
