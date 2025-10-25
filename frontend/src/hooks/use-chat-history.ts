import { useCallback, useMemo } from "react";
import { Message } from "ai";

const MAX_HISTORY_MESSAGES = 20;
const MAX_CONTEXT_WINDOW = 8000; // tokens approximate

export function useChatHistory(messages: Message[]) {
  /**
   * Truncate chat history to keep recent messages within context window.
   * Keeps the first message (system context) and recent messages.
   */
  const truncatedHistory = useMemo(() => {
    if (messages.length <= MAX_HISTORY_MESSAGES) {
      return messages;
    }

    // Keep first message (usually system context) and recent messages
    const firstMessage = messages[0];
    const recentMessages = messages.slice(
      -(MAX_HISTORY_MESSAGES - 1)
    );

    return [firstMessage, ...recentMessages];
  }, [messages]);

  /**
   * Get context window for API calls.
   * Truncates history to fit within token limit.
   */
  const getContextWindow = useCallback(() => {
    let totalLength = 0;
    const contextMessages: Message[] = [];

    // Always include first message
    if (truncatedHistory.length > 0) {
      contextMessages.push(truncatedHistory[0]);
      totalLength += truncatedHistory[0].content.length;
    }

    // Add recent messages until we hit the limit
    for (let i = truncatedHistory.length - 1; i >= 1; i--) {
      const msg = truncatedHistory[i];
      const msgLength = msg.content.length;

      if (totalLength + msgLength > MAX_CONTEXT_WINDOW) {
        break;
      }

      contextMessages.unshift(msg);
      totalLength += msgLength;
    }

    return contextMessages;
  }, [truncatedHistory]);

  return {
    truncatedHistory,
    getContextWindow,
    shouldTruncate: messages.length > MAX_HISTORY_MESSAGES,
  };
}
