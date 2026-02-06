// Database types for Guildry

export enum OrganizationStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

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

export interface Organization {
  id: string;
  name: string;
  slug: string;
  status: OrganizationStatus;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  organization_id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: string;
  organization_id: string;
  client_id: string;
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
  metadata: Record<string, unknown> | null;
  created_at: string;
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
  "id" | "created_at" | "updated_at"
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
