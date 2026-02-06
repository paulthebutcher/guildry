// Database types for Guildry

export enum UserRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

export enum ConversationStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  CLOSED = "closed",
}

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export enum ClientSizeTier {
  STARTUP = "startup",
  SMB = "smb",
  MID = "mid",
  ENTERPRISE = "enterprise",
}

export interface Organization {
  id: string;
  clerk_org_id: string | null;
  name: string;
  slug: string;
  type: string;
  industry_tags: string[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clerk_user_id: string;
  org_id: string;
  email: string;
  name: string | null;
  role: string;
  preferences: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  org_id: string;
  name: string;
  industry: string | null;
  size_tier: ClientSizeTier | null;
  website_url: string | null;
  communication_prefs: Record<string, unknown>;
  lifetime_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  client_id: string | null;
  title: string | null;
  status: ConversationStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls: ToolCall[] | null;
  tool_call_id: string | null;
  tokens_used: number | null;
  created_at: string;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

// Helper types for creating new records (omitting auto-generated fields)
export type CreateOrganization = Omit<
  Organization,
  "id" | "created_at" | "updated_at"
>;
export type CreateUser = Omit<User, "id" | "created_at" | "updated_at">;
export type CreateClient = Omit<Client, "id" | "created_at" | "updated_at">;
export type CreateConversation = Omit<
  Conversation,
  "id" | "started_at" | "completed_at" | "updated_at"
>;
export type CreateMessage = Omit<Message, "id" | "created_at">;

// Helper types for updating records (all fields optional except id)
export type UpdateOrganization = Partial<Omit<Organization, "id">> & {
  id: string;
};
export type UpdateUser = Partial<Omit<User, "id">> & { id: string };
export type UpdateClient = Partial<Omit<Client, "id">> & { id: string };
export type UpdateConversation = Partial<Omit<Conversation, "id">> & {
  id: string;
};
