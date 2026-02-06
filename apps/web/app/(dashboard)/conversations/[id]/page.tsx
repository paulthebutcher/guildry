import { notFound } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { getDb, Conversation } from "@/lib/db";
import { ChatContainer } from "@/components/conversation";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: conversation, error } = await db
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single<Conversation>();

  if (error || !conversation) {
    notFound();
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <div className="mb-4">
        <Link
          href="/conversations"
          className="text-accent-blueprint hover:underline text-sm"
        >
          ← Back to Conversations
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {conversation.title || "Conversation"}
        </h1>
        <p className="text-slate-600 mt-1">
          {(conversation.metadata as { schema?: string })?.schema || "General"}{" "}
          conversation
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg h-[calc(100%-120px)]">
        <ChatContainer conversationId={conversation.id} />
      </div>
    </div>
  );
}
