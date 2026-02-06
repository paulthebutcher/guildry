import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { getDb, Client } from "@/lib/db";
import { ClientCard } from "@/components/clients";

export default async function ClientsPage() {
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: clients, error } = await db
    .from("clients")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch clients:", error);
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load clients</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Clients</h1>
        <Link
          href="/clients/new"
          className="bg-accent-blueprint text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Add Client
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-slate-500 text-center mb-4">
            No clients yet. Add your first client to get started.
          </p>
          <Link
            href="/clients/new"
            className="text-accent-blueprint hover:underline"
          >
            Add your first client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client: Client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
