"use client";

import { useChat } from "ai/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Loader2, XCircle } from "lucide-react";
import { Paper } from "@/lib/types/paper";
import { useEffect, useRef } from "react";
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
    <Card
      className={cn(
        "flex flex-col",
        isEmbedded
          ? "h-full rounded-xl border-2"
          : "fixed inset-y-4 right-4 w-[400px] shadow-2xl"
      )}
    >
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="flex justify-between items-center text-lg font-medium">
          <div className="truncate flex-1 pr-2">{paper.title}</div>
          {!isEmbedded && onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={onClose}
            >
              <XCircle className="h-5 w-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <AnimatePresence initial={false}>
          <div className="space-y-4">
            {messages.map((message, i) => (
              <ChatMessageBubble
                key={i}
                message={message}
                isLoading={isLoading && i === messages.length - 1}
              />
            ))}
          </div>
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </ScrollArea>

      <form
        onSubmit={handleSubmit}
        className="border-t bg-background p-4 flex gap-2 items-end"
      >
        <motion.div className="flex-1 relative" layout>
          <textarea
            ref={inputRef}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary min-h-[2.5rem] max-h-[10rem]"
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="Ask about this paper..."
            rows={1}
            disabled={isLoading}
          />
        </motion.div>
        <Button
          type="submit"
          size="icon"
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 rounded-lg shrink-0"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </Card>
  );
}
