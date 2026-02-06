"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/conversation";

export default function NewClientPage() {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function createConversation() {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            target_schema: "client",
            intent: "Create a new client",
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }

        const { data } = await response.json();
        setConversationId(data.id);
      } catch (err) {
        console.error("Error creating conversation:", err);
        setError("Failed to start conversation. Please try again.");
      }
    }

    createConversation();
  }, []);

  // Check if conversation is complete and redirect
  useEffect(() => {
    if (!conversationId) return;

    const checkCompletion = setInterval(async () => {
      try {
        const response = await fetch(`/api/conversations/${conversationId}`);
        const { data } = await response.json();

        if (data.status === "closed") {
          clearInterval(checkCompletion);
          // Redirect to clients list after a short delay
          setTimeout(() => {
            router.push("/clients");
          }, 2000);
        }
      } catch (err) {
        console.error("Error checking conversation status:", err);
      }
    }, 2000);

    return () => clearInterval(checkCompletion);
  }, [conversationId, router]);

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!conversationId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-4 bg-slate-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
        <p className="text-slate-600 mt-1">
          Chat with the assistant to create a new client record
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg h-[calc(100%-80px)]">
        <ChatContainer conversationId={conversationId} />
      </div>
    </div>
  );
}
