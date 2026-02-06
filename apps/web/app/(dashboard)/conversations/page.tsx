import Link from "next/link";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getDb, Conversation, ConversationStatus } from "@/lib/db";

const STATUS_CONFIG = {
  [ConversationStatus.ACTIVE]: {
    label: "Active",
    icon: Clock,
    className: "bg-blue-100 text-blue-700",
  },
  [ConversationStatus.CLOSED]: {
    label: "Completed",
    icon: CheckCircle,
    className: "bg-green-100 text-green-700",
  },
  [ConversationStatus.ARCHIVED]: {
    label: "Archived",
    icon: MessageSquare,
    className: "bg-slate-100 text-slate-700",
  },
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export default async function ConversationsPage() {
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: conversations, error } = await db
    .from("conversations")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch conversations:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load conversations</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Conversations</h1>
        <Link
          href="/clients/new"
          className="bg-accent-blueprint text-white px-4 py-2 rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          New Conversation
        </Link>
      </div>

      {!conversations || conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-slate-500 text-center mb-4">
            No conversations yet. Start a conversation to add clients.
          </p>
          <Link
            href="/clients/new"
            className="text-accent-blueprint hover:underline"
          >
            Start your first conversation
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation: Conversation) => {
            const statusConfig =
              STATUS_CONFIG[conversation.status] || STATUS_CONFIG.active;
            const StatusIcon = statusConfig.icon;
            const schema =
              (conversation.metadata as { schema?: string })?.schema ||
              "unknown";

            return (
              <Link
                key={conversation.id}
                href={`/conversations/${conversation.id}`}
              >
                <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {conversation.title || "Untitled Conversation"}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${statusConfig.className}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="capitalize">
                          {schema} conversation
                        </span>
                        <span>•</span>
                        <span>{formatDate(conversation.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
