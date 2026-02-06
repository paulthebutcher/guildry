import { describe, it, expect } from "vitest";
import { ClientInputSchema } from "../tools/client";

describe("ClientInputSchema", () => {
  it("should validate correct client input", () => {
    const validInput = {
      name: "Acme Corp",
      industry: "Technology",
      size_tier: "mid",
      website_url: "https://acme.com",
      notes: "Great client",
    };

    const result = ClientInputSchema.safeParse(validInput);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Acme Corp");
      expect(result.data.size_tier).toBe("mid");
    }
  });

  it("should validate minimal client input (only name required)", () => {
    const minimalInput = {
      name: "Minimal Corp",
    };

    const result = ClientInputSchema.safeParse(minimalInput);
    expect(result.success).toBe(true);
  });

  it("should fail validation when name is missing", () => {
    const invalidInput = {
      industry: "Technology",
      size_tier: "mid",
    };

    const result = ClientInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("should fail validation with invalid size_tier", () => {
    const invalidInput = {
      name: "Acme Corp",
      size_tier: "invalid_size",
    };

    const result = ClientInputSchema.safeParse(invalidInput);
    expect(result.success).toBe(false);
    if (!result.success) {
      const sizeTierError = result.error.issues.find((issue) =>
        issue.path.includes("size_tier")
      );
      expect(sizeTierError).toBeDefined();
    }
  });

  it("should accept all valid size_tier values", () => {
    const validSizes = ["startup", "smb", "mid", "enterprise"];

    validSizes.forEach((size) => {
      const input = {
        name: "Test Corp",
        size_tier: size,
      };

      const result = ClientInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  it("should validate name as string", () => {
    const input = {
      name: "Valid Name",
    };

    const result = ClientInputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Valid Name");
    }
  });
});
