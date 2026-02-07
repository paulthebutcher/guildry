"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChatContainer } from "@/components/conversation";

interface CreatedEntity {
  type: string;
  id: string;
  name: string;
}

export default function NewProjectPage() {
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
            target_schema: "project",
            intent: "Create a new project",
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

  // Handle entity creation - redirect to project detail page
  const handleEntityCreated = useCallback((entity: CreatedEntity) => {
    if (entity.type === "project") {
      // Small delay to let the user see the success message
      setTimeout(() => {
        router.push(`/projects/${entity.id}`);
      }, 1500);
    }
  }, [router]);

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
        <h1 className="text-2xl font-bold text-slate-900">New Project</h1>
        <p className="text-slate-600 mt-1">
          Describe your project and I&apos;ll help you scope it out with phases and estimates
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg h-[calc(100%-80px)]">
        <ChatContainer
          conversationId={conversationId}
          initialMessage="I want to create a new project"
          onEntityCreated={handleEntityCreated}
        />
      </div>
    </div>
  );
}
