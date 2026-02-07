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

interface CreatedEntity {
  type: string;
  id: string;
  name: string;
}

interface ChatContainerProps {
  conversationId: string;
  initialMessage?: string; // Optional auto-send message to kick off conversation
  onEntityCreated?: (entity: CreatedEntity) => void; // Callback when an entity is created
}

export function ChatContainer({ conversationId, initialMessage, onEntityCreated }: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialSent, setInitialSent] = useState(false);

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

  // Auto-send initial message if provided and conversation is empty
  useEffect(() => {
    if (!isLoading && !initialSent && initialMessage && messages.length === 0) {
      setInitialSent(true);
      handleSendMessage(initialMessage);
    }
  }, [isLoading, initialSent, initialMessage, messages.length]);

  const handleSendMessage = async (content: string) => {
    // Optimistic UI: show user message immediately
    const optimisticUserMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUserMessage]);

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

      // Replace optimistic message with real one and add assistant response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUserMessage.id),
        data.userMessage,
        data.assistantMessage,
      ]);

      // If an entity was created, notify the parent
      if (data.createdEntities && data.createdEntities.length > 0) {
        console.log("Created entities:", data.createdEntities);
        if (onEntityCreated) {
          onEntityCreated(data.createdEntities[0]);
        }
      }
    } catch (err) {
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUserMessage.id));
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
