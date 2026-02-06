import { describe, it, expect } from "vitest";
import { apiError, apiSuccess, ApiErrorCode } from "../api";

describe("API Helpers", () => {
  describe("apiError", () => {
    it("should return error response with correct format", async () => {
      const result = apiError(
        ApiErrorCode.NOT_FOUND,
        "Resource not found",
        404
      );

      expect(result.status).toBe(404);

      const json = await result.json();
      expect(json).toEqual({
        error: {
          code: "NOT_FOUND",
          message: "Resource not found",
        },
      });
    });

    it("should default to 500 status code", () => {
      const result = apiError(
        ApiErrorCode.INTERNAL_ERROR,
        "Something went wrong"
      );

      expect(result.status).toBe(500);
    });

    it("should handle validation errors", async () => {
      const result = apiError(
        ApiErrorCode.VALIDATION_ERROR,
        "Invalid input",
        400
      );

      expect(result.status).toBe(400);

      const json = await result.json();
      expect(json).toMatchObject({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input",
        },
      });
    });

    it("should handle unauthorized errors", () => {
      const result = apiError(
        ApiErrorCode.UNAUTHORIZED,
        "Not authenticated",
        401
      );

      expect(result.status).toBe(401);
    });
  });

  describe("apiSuccess", () => {
    it("should return success response with data", async () => {
      const data = { id: "123", name: "Test" };
      const result = apiSuccess(data);

      expect(result.status).toBe(200);

      const json = await result.json();
      expect(json).toEqual({
        data: { id: "123", name: "Test" },
      });
    });

    it("should accept custom status code", () => {
      const data = { id: "456" };
      const result = apiSuccess(data, 201);

      expect(result.status).toBe(201);
    });

    it("should handle array data", async () => {
      const data = [
        { id: "1", name: "First" },
        { id: "2", name: "Second" },
      ];
      const result = apiSuccess(data);

      const json = await result.json();
      expect(json).toEqual({
        data: [
          { id: "1", name: "First" },
          { id: "2", name: "Second" },
        ],
      });
    });

    it("should handle null data", async () => {
      const result = apiSuccess(null);

      const json = await result.json();
      expect(json).toEqual({
        data: null,
      });
    });
  });

  describe("ApiErrorCode enum", () => {
    it("should export all error codes", () => {
      expect(ApiErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ApiErrorCode.NOT_FOUND).toBe("NOT_FOUND");
      expect(ApiErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(ApiErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    });
  });
});
