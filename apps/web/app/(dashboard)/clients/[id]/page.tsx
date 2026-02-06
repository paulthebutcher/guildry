import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getDb, Client, ClientSizeTier } from "@/lib/db";

const SIZE_TIER_LABELS: Record<ClientSizeTier, string> = {
  [ClientSizeTier.STARTUP]: "Startup (1-10 employees)",
  [ClientSizeTier.SMB]: "Small/Medium Business (11-100)",
  [ClientSizeTier.MID]: "Mid-market (101-1000)",
  [ClientSizeTier.ENTERPRISE]: "Enterprise (1000+)",
};

async function deleteClient(formData: FormData) {
  "use server";
  
  const clientId = formData.get("clientId") as string;
  const { orgId } = await getAuthContext();
  
  const db = getDb();
  const { error } = await db
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", orgId);

  if (error) {
    console.error("Failed to delete client:", error);
    return;
  }

  redirect("/clients");
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { orgId } = await getAuthContext();

  const db = getDb();
  const { data: client, error } = await db
    .from("clients")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single<Client>();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-accent-blueprint hover:underline text-sm"
        >
          ← Back to Clients
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {client.name}
            </h1>
            <div className="flex flex-wrap gap-2">
              {client.industry && (
                <span className="inline-block bg-slate-100 text-slate-700 text-sm px-3 py-1 rounded-full">
                  {client.industry}
                </span>
              )}
              {client.size_tier && (
                <span className="inline-block bg-accent-blueprint/10 text-accent-blueprint text-sm px-3 py-1 rounded-full">
                  {SIZE_TIER_LABELS[client.size_tier]}
                </span>
              )}
            </div>
          </div>

          <form action={deleteClient}>
            <input type="hidden" name="clientId" value={client.id} />
            <button
              type="submit"
              className="text-red-600 hover:bg-red-50 px-3 py-1 rounded"
              onClick={(e) => {
                if (!confirm("Are you sure you want to delete this client?")) {
                  e.preventDefault();
                }
              }}
            >
              Delete
            </button>
          </form>
        </div>

        <div className="space-y-6">
          {client.website_url && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Website
              </label>
              <a
                href={client.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-blueprint hover:underline"
              >
                {client.website_url}
              </a>
            </div>
          )}

          {client.email && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <a
                href={`mailto:${client.email}`}
                className="text-accent-blueprint hover:underline"
              >
                {client.email}
              </a>
            </div>
          )}

          {client.phone && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone
              </label>
              <a
                href={`tel:${client.phone}`}
                className="text-accent-blueprint hover:underline"
              >
                {client.phone}
              </a>
            </div>
          )}

          {client.notes && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <p className="text-slate-900 whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="block text-slate-500 mb-1">Created</label>
                <p className="text-slate-900">
                  {new Date(client.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-slate-500 mb-1">
                  Last Updated
                </label>
                <p className="text-slate-900">
                  {new Date(client.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
