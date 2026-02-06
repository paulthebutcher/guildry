import { createServiceClient } from "@guildry/database";
import type { SupabaseClient } from "@supabase/supabase-js";

// Re-export everything from the database package for convenience
export * from "@guildry/database";

// Singleton instance for the service client
let serviceClientInstance: SupabaseClient | null = null;

/**
 * Returns a Supabase service client instance
 * Uses singleton pattern to avoid creating multiple clients
 * 
 * @returns SupabaseClient with service role access (bypasses RLS)
 */
export function getDb(): SupabaseClient {
  if (!serviceClientInstance) {
    serviceClientInstance = createServiceClient();
  }
  return serviceClientInstance;
}
