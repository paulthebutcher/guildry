/**
 * Error handling utilities
 */

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

/**
 * Captures and logs an error for debugging
 * In the future, this will send to Sentry or similar service
 * 
 * @param error - The error to capture
 * @param context - Additional context about where the error occurred
 */
export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  // For now, just log to console
  // TODO: Send to Sentry when configured
  console.error("Error captured:", {
    error,
    context,
    timestamp: new Date().toISOString(),
  });

  // Extract and log stack trace if available
  if (error instanceof Error && error.stack) {
    console.error("Stack trace:", error.stack);
  }
}

/**
 * Type guard to check if an error is an API error
 * 
 * @param error - The error to check
 * @returns true if the error matches ApiError structure
 */
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as ApiError).error === "object" &&
    "code" in (error as ApiError).error &&
    "message" in (error as ApiError).error
  );
}

/**
 * Extracts a user-friendly error message from any error type
 * 
 * @param error - The error to extract message from
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
  // Check if it's an API error
  if (isApiError(error)) {
    return error.error.message;
  }

  // Check if it's a standard Error
  if (error instanceof Error) {
    return error.message;
  }

  // Check if it's a string
  if (typeof error === "string") {
    return error;
  }

  // Check if it's a Response object
  if (error instanceof Response) {
    return `Request failed with status ${error.status}`;
  }

  // Fallback for unknown error types
  return "An unexpected error occurred";
}

/**
 * Common error messages for reuse
 */
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "You must be signed in to access this resource",
  FORBIDDEN: "You don't have permission to access this resource",
  NOT_FOUND: "The requested resource was not found",
  VALIDATION: "Please check your input and try again",
  NETWORK: "Network error. Please check your connection and try again",
  UNKNOWN: "Something went wrong. Please try again",
} as const;
