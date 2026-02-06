/**
 * Standard API response helpers for consistent error and success handling
 */

export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
  FORBIDDEN = "FORBIDDEN",
}

interface ApiErrorResponse {
  error: {
    code: ApiErrorCode;
    message: string;
  };
}

interface ApiSuccessResponse<T> {
  data: T;
}

/**
 * Creates a standardized error response
 * 
 * @param code - Error code from ApiErrorCode enum
 * @param message - Human-readable error message
 * @param status - HTTP status code (default: 500)
 * @returns Response object with error details
 */
export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number = 500
): Response {
  const response: ApiErrorResponse = {
    error: {
      code,
      message,
    },
  };

  return Response.json(response, { status });
}

/**
 * Creates a standardized success response
 * 
 * @param data - Data to return in the response
 * @param status - HTTP status code (default: 200)
 * @returns Response object with data
 */
export function apiSuccess<T>(
  data: T,
  status: number = 200
): Response {
  const response: ApiSuccessResponse<T> = {
    data,
  };

  return Response.json(response, { status });
}
