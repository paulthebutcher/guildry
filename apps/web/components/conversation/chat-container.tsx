"use client";

import { useState, useEffect } from "react";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import { TypingIndicator } from "./typing-indicator";
import { ErrorMessage, Skeleton } from "@/components/ui";
import { captureError, getErrorMessage } from "@/lib/errors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatContainerProps {
  conversationId: string;
}

export function ChatContainer({ conversationId }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch messages on mount
  useEffect(() => {
    async function fetchMessages() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`
        );

        if (!response.ok) {
          throw new Error("Failed to load messages");
        }

        const { data } = await response.json();
        setMessages(data);
      } catch (err) {
        captureError(err, { context: "fetch_messages", conversationId });
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();
  }, [conversationId]);

  const handleSendMessage = async (content: string) => {
    try {
      setIsSending(true);
      setError(null);

      const response = await fetch(
        `/api/conversations/${conversationId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const { data } = await response.json();

      // Add both user and assistant messages to the list
      setMessages((prev) => [
        ...prev,
        data.userMessage,
        data.assistantMessage,
      ]);

      // If conversation is completed, you might want to show a notification
      if (data.completed && data.createdEntities) {
        console.log("Created entities:", data.createdEntities);
      }
    } catch (err) {
      captureError(err, { context: "send_message", conversationId });
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    // Trigger re-fetch
    setIsLoading(true);
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `/api/conversations/${conversationId}/messages`
        );
        if (!response.ok) throw new Error("Failed to load messages");
        const { data } = await response.json();
        setMessages(data);
      } catch (err) {
        captureError(err, { context: "retry_fetch", conversationId });
        setError(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="space-y-4 w-full max-w-2xl px-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {error && (
        <div className="px-4 pt-4">
          <ErrorMessage
            message={error}
            retry={handleRetry}
          />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <MessageList messages={messages} />
        {isSending && <TypingIndicator />}
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 px-4 py-4 bg-white">
        <ChatInput
          onSend={handleSendMessage}
          disabled={isSending}
          placeholder="Type your message..."
        />
      </div>
    </div>
  );
}
