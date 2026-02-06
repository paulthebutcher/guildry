import { describe, it, expect } from "vitest";
import type {
  Organization,
  User,
  Client,
  Conversation,
  Message,
  OrganizationStatus,
  UserRole,
  ConversationStatus,
  MessageRole,
  ClientSizeTier,
} from "../types";

describe("Database Types", () => {
  it("should export Organization type", () => {
    const org: Organization = {
      id: "org_123",
      name: "Test Org",
      slug: "test-org",
      status: "active",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    expect(org.id).toBe("org_123");
    expect(org.status).toBe("active");
  });

  it("should export User type", () => {
    const user: User = {
      id: "user_123",
      clerk_user_id: "clerk_123",
      organization_id: "org_123",
      email: "test@example.com",
      name: "Test User",
      role: "owner",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    expect(user.email).toBe("test@example.com");
    expect(user.role).toBe("owner");
  });

  it("should export Client type", () => {
    const client: Client = {
      id: "client_123",
      organization_id: "org_123",
      name: "Test Client",
      industry: "Technology",
      size_tier: "mid",
      website_url: "https://test.com",
      notes: "Test notes",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    expect(client.name).toBe("Test Client");
    expect(client.size_tier).toBe("mid");
  });

  it("should export Conversation type", () => {
    const conversation: Conversation = {
      id: "conv_123",
      organization_id: "org_123",
      user_id: "user_123",
      target_schema: "client",
      status: "active",
      title: "New Client",
      metadata: { schema: "client" },
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    expect(conversation.target_schema).toBe("client");
    expect(conversation.status).toBe("active");
  });

  it("should export Message type", () => {
    const message: Message = {
      id: "msg_123",
      conversation_id: "conv_123",
      role: "user",
      content: "Hello",
      metadata: {},
      created_at: "2024-01-01T00:00:00Z",
    };

    expect(message.role).toBe("user");
    expect(message.content).toBe("Hello");
  });

  it("should export enum types", () => {
    const orgStatus: OrganizationStatus = "active";
    const userRole: UserRole = "owner";
    const convStatus: ConversationStatus = "completed";
    const msgRole: MessageRole = "assistant";
    const sizeTier: ClientSizeTier = "enterprise";

    expect(orgStatus).toBe("active");
    expect(userRole).toBe("owner");
    expect(convStatus).toBe("completed");
    expect(msgRole).toBe("assistant");
    expect(sizeTier).toBe("enterprise");
  });
});
