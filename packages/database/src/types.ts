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

// ============================================
// Phase 1: Projects, People & Retrospectives
// ============================================

// Project status lifecycle
export enum ProjectStatus {
  DRAFT = "draft",
  SCOPING = "scoping",
  PROPOSED = "proposed",
  ACTIVE = "active",
  PAUSED = "paused",
  COMPLETE = "complete",
  CANCELLED = "cancelled",
}

// Project types
export enum ProjectType {
  NEW_BUILD = "new_build",
  REDESIGN = "redesign",
  FIX = "fix",
  AUDIT = "audit",
  RETAINER = "retainer",
  STRATEGY = "strategy",
}

export interface Project {
  id: string;
  org_id: string;
  client_id: string | null;
  name: string;
  description: string | null;
  status: ProjectStatus;
  type: ProjectType | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  end_date: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null; // Flexible field for discovery
  created_at: string;
  updated_at: string;
}

export type CreateProject = Omit<Project, "id" | "created_at" | "updated_at">;
export type UpdateProject = Partial<Omit<Project, "id">> & { id: string };

// Phase within a project
export enum PhaseStatus {
  PLANNED = "planned",
  ACTIVE = "active",
  COMPLETE = "complete",
}

export interface Phase {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  status: PhaseStatus;
  created_at: string;
  updated_at: string;
}

export type CreatePhase = Omit<Phase, "id" | "created_at" | "updated_at">;
export type UpdatePhase = Partial<Omit<Phase, "id">> & { id: string };

// People (talent network)
export enum PersonType {
  EMPLOYEE = "employee",
  CONTRACTOR = "contractor",
  REFERRAL = "referral",
}

export enum AvailabilityStatus {
  AVAILABLE = "available",
  PARTIAL = "partial",
  BOOKED = "booked",
  UNAVAILABLE = "unavailable",
}

export interface Person {
  id: string;
  org_id: string;
  name: string;
  type: PersonType;
  email: string | null;
  location: string | null;
  hourly_rate: number | null;
  currency: string;
  availability_status: AvailabilityStatus;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type CreatePerson = Omit<Person, "id" | "created_at" | "updated_at">;
export type UpdatePerson = Partial<Omit<Person, "id">> & { id: string };

// Skills
export enum SkillCategory {
  DESIGN = "design",
  ENGINEERING = "engineering",
  STRATEGY = "strategy",
  OPS = "ops",
  MARKETING = "marketing",
  DATA = "data",
}

export interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  market_rate_p25: number | null;
  market_rate_p50: number | null;
  market_rate_p75: number | null;
  rate_geography: string;
  created_at: string;
}

// Retrospective
export interface Retrospective {
  id: string;
  project_id: string;
  completed_at: string | null;
  hours_variance_pct: number | null;
  cost_variance_pct: number | null;
  scope_changes_count: number;
  client_satisfaction: number | null;
  what_worked: string | null;
  what_didnt: string | null;
  lessons: string[] | null;
  would_repeat: boolean | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export type CreateRetrospective = Omit<Retrospective, "id" | "created_at" | "updated_at">;
export type UpdateRetrospective = Partial<Omit<Retrospective, "id">> & { id: string };
