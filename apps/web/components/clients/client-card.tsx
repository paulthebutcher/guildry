import Link from "next/link";
import { Client, ClientSizeTier } from "@guildry/database";

interface ClientCardProps {
  client: Client;
}

const SIZE_TIER_LABELS: Record<ClientSizeTier, string> = {
  [ClientSizeTier.STARTUP]: "Startup",
  [ClientSizeTier.SMB]: "SMB",
  [ClientSizeTier.MID]: "Mid-market",
  [ClientSizeTier.ENTERPRISE]: "Enterprise",
};

export function ClientCard({ client }: ClientCardProps) {
  return (
    <Link href={`/clients/${client.id}`}>
      <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-accent-blueprint transition-colors cursor-pointer">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {client.name}
        </h3>
        
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

        {client.website_url && (
          <p className="mt-3 text-sm text-slate-500 truncate">
            {client.website_url}
          </p>
        )}
      </div>
    </Link>
  );
}
