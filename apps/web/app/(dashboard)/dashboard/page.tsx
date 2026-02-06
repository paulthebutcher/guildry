import Link from "next/link";
import { Plus, Users, MessageSquare } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getDb } from "@/lib/db";

export default async function DashboardPage() {
  const { orgId } = await getAuthContext();

  const db = getDb();

  // Fetch quick stats
  const [clientsResult, conversationsResult] = await Promise.all([
    db.from("clients").select("id", { count: "exact" }).eq("org_id", orgId),
    db
      .from("conversations")
      .select("id", { count: "exact" })
      .eq("org_id", orgId)
      .eq("status", "active"),
  ]);

  const clientCount = clientsResult.count || 0;
  const activeConversations = conversationsResult.count || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Welcome to Guildry
        </h1>
        <p className="text-slate-600">
          Your AI-powered client management platform
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-accent-blueprint" />
            <h3 className="text-sm font-medium text-slate-700">Clients</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{clientCount}</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-5 w-5 text-accent-blueprint" />
            <h3 className="text-sm font-medium text-slate-700">
              Active Conversations
            </h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {activeConversations}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-slate-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/clients/new">
            <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-accent-blueprint/10 p-2 rounded-lg">
                  <Plus className="h-5 w-5 text-accent-blueprint" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Add Client
                </h3>
              </div>
              <p className="text-slate-600">
                Start a conversation to create a new client record
              </p>
            </div>
          </Link>

          <Link href="/conversations">
            <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-accent-blueprint/10 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-accent-blueprint" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">
                  View Conversations
                </h3>
              </div>
              <p className="text-slate-600">
                Browse and continue your conversations
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
