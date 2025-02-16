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
import { ChatMessageBubble } from "./chat-message-bubble";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header - Fixed */}
      <div className="border-b p-3 flex-shrink-0">
        <h2 className="text-lg font-semibold">Chat with Paper</h2>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {paper.title}
        </p>
      </div>

      {/* Messages - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((message) => (
          <Card
            key={message.id}
            className={cn(
              "p-4 max-w-[90%]",
              message.role === "user"
                ? "ml-auto bg-primary text-primary-foreground" // User message
                : "bg-card text-card-foreground border" // Assistant message
            )}
          >
            <div
              className={cn(
                "prose prose-sm max-w-none",
                message.role === "user"
                  ? "prose-invert" // Light text for user messages
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
                  code: ({ node, inline, className, children, ...props }) => (
                    <code
                      className={cn(
                        "rounded text-sm",
                        inline
                          ? "bg-muted/50 px-1 py-0.5"
                          : "bg-muted/20 block p-2",
                        message.role === "user"
                          ? "text-primary-foreground"
                          : "text-foreground",
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
        className="border-t p-3 flex gap-2 items-center flex-shrink-0 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <Input
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          placeholder="Ask a question..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={isLoading}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
