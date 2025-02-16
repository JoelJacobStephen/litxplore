import { Message } from "ai";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";

interface ChatMessageBubbleProps {
  message: Message;
  isLoading?: boolean;
}

export function ChatMessageBubble({
  message,
  isLoading,
}: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg p-4",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : "bg-muted text-foreground rounded-bl-none",
          isLoading && "animate-pulse"
        )}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          className={cn(isUser && "text-secondary")}
          components={{
            p: ({ children }) => (
              <p
                className={cn(
                  "mb-2 last:mb-0 leading-relaxed",
                  isUser && "text-secondary"
                )}
              >
                {children}
              </p>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "hover:underline",
                  isUser ? "text-blue-200" : "text-blue-400"
                )}
              >
                {children}
              </a>
            ),
            code: ({ children }) => (
              <code
                className={cn(
                  "rounded px-1 py-0.5",
                  isUser ? "bg-primary-foreground/20" : "bg-muted-foreground/20"
                )}
              >
                {children}
              </code>
            ),
            ul: ({ children }) => (
              <ul
                className={cn(
                  "list-disc pl-4 mb-2",
                  isUser && "text-secondary"
                )}
              >
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol
                className={cn(
                  "list-decimal pl-4 mb-2",
                  isUser && "text-secondary"
                )}
              >
                {children}
              </ol>
            ),
            blockquote: ({ children }) => (
              <blockquote
                className={cn(
                  "border-l-2 pl-2 italic",
                  isUser ? "border-secondary text-secondary" : "border-primary"
                )}
              >
                {children}
              </blockquote>
            ),
          }}
        >
          {message.content}
        </ReactMarkdown>

        {message.role === "assistant" && message.id && (
          <div className="mt-2 text-xs text-muted-foreground/60 flex items-center gap-2">
            {isLoading && (
              <span className="flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
              </span>
            )}
            <span>{message.id}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
