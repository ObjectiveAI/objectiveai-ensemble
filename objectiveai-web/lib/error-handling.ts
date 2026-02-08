/**
 * Error handling utilities for ObjectiveAI web application
 *
 * Normalizes errors from various sources (API responses, Error objects, strings)
 * into user-friendly messages.
 */

/**
 * API error response shape (from Next.js API routes)
 */
interface ApiErrorResponse {
  error?: string;
  message?: string;
  statusCode?: number;
  status?: number;
}

/**
 * HTTP status codes and their user-friendly messages
 */
const HTTP_STATUS_MESSAGES: Record<number, string> = {
  400: "Invalid request. Please check your input and try again.",
  401: "Not authenticated. Please sign in or check your API key.",
  403: "Access denied. You don't have permission to perform this action.",
  404: "Not found. The requested resource doesn't exist.",
  408: "Request timed out. Please try again.",
  429: "Too many requests. Please wait a moment and try again.",
  500: "Server error. Please try again later.",
  502: "Service temporarily unavailable. Please try again later.",
  503: "Service temporarily unavailable. Please try again later.",
  504: "Request timed out. Please try again.",
};

/**
 * Known error patterns and their user-friendly messages
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; message: string }> = [
  { pattern: /401|unauthorized/i, message: "Not authenticated. Please sign in or check your API key." },
  { pattern: /403|forbidden/i, message: "Access denied. You don't have permission to perform this action." },
  { pattern: /404|not found/i, message: "Not found. The requested resource doesn't exist." },
  { pattern: /429|rate.?limit|too many/i, message: "Too many requests. Please wait a moment and try again." },
  { pattern: /timeout|timed out/i, message: "Request timed out. Please try again." },
  { pattern: /network|ECONNREFUSED|ENOTFOUND|fetch failed/i, message: "Network error. Please check your connection and try again." },
  { pattern: /invalid.*json|JSON.*parse/i, message: "Invalid response from server. Please try again." },
  { pattern: /invalid.*api.?key/i, message: "Invalid API key. Please check your credentials." },
  { pattern: /missing.*api.?key/i, message: "API key is missing. Please configure your API key." },
  { pattern: /insufficient.*credits/i, message: "Insufficient credits. Please add more credits to continue." },
  { pattern: /model.*not.*found/i, message: "Model not found. Please check the model identifier." },
  { pattern: /ensemble.*not.*found/i, message: "Ensemble not found. Please check the ensemble identifier." },
  { pattern: /function.*not.*found/i, message: "Function not found. Please check the function identifier." },
  { pattern: /profile.*not.*found/i, message: "Profile not found. Please check the profile identifier." },
];

/**
 * Extracts the error message from various error shapes
 */
function extractErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return "An unknown error occurred";
  }

  // Handle string errors
  if (typeof error === "string") {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message;
  }

  // Handle API response objects
  if (typeof error === "object") {
    const obj = error as ApiErrorResponse;

    // Check common error fields
    if (typeof obj.error === "string") {
      return obj.error;
    }
    if (typeof obj.message === "string") {
      return obj.message;
    }

    // Try to stringify for debugging
    try {
      return JSON.stringify(error);
    } catch {
      return "An unknown error occurred";
    }
  }

  return "An unknown error occurred";
}

/**
 * Extracts HTTP status code from various error shapes
 */
function extractStatusCode(error: unknown): number | null {
  if (typeof error === "object" && error !== null) {
    const obj = error as ApiErrorResponse;
    if (typeof obj.statusCode === "number") {
      return obj.statusCode;
    }
    if (typeof obj.status === "number") {
      return obj.status;
    }
  }
  return null;
}

/**
 * Normalizes an error to a user-friendly message
 *
 * @param error - The error to normalize (can be Error, string, API response object, or unknown)
 * @param fallbackMessage - Optional fallback message if error cannot be normalized
 * @returns A user-friendly error message
 *
 * @example
 * ```typescript
 * try {
 *   await fetch("/api/something");
 * } catch (err) {
 *   setError(normalizeError(err));
 *   // Returns: "Network error. Please check your connection and try again."
 * }
 * ```
 */
export function normalizeError(error: unknown, fallbackMessage = "An error occurred. Please try again."): string {
  // Extract the raw error message
  const rawMessage = extractErrorMessage(error);

  // Check for HTTP status code first
  const statusCode = extractStatusCode(error);
  if (statusCode && HTTP_STATUS_MESSAGES[statusCode]) {
    return HTTP_STATUS_MESSAGES[statusCode];
  }

  // Check for known error patterns
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(rawMessage)) {
      return message;
    }
  }

  // Check for HTTP status codes in the message string (e.g., "HTTP 401")
  const httpStatusMatch = rawMessage.match(/(?:HTTP|status)\s*(\d{3})/i);
  if (httpStatusMatch) {
    const code = parseInt(httpStatusMatch[1], 10);
    if (HTTP_STATUS_MESSAGES[code]) {
      return HTTP_STATUS_MESSAGES[code];
    }
  }

  // If the raw message is already somewhat user-friendly (not too technical), return it
  // Avoid returning messages with stack traces, file paths, or very long technical details
  if (
    rawMessage.length < 200 &&
    !rawMessage.includes("at ") &&
    !rawMessage.includes(".ts:") &&
    !rawMessage.includes(".js:") &&
    !rawMessage.includes("node_modules")
  ) {
    return rawMessage;
  }

  // Fall back to generic message
  return fallbackMessage;
}

/**
 * Checks if an error is an authentication error (401)
 *
 * @param error - The error to check
 * @returns true if the error is a 401/authentication error
 *
 * @example
 * ```typescript
 * if (isAuthError(error)) {
 *   // Redirect to login or show auth-specific message
 *   router.push("/login");
 * }
 * ```
 */
export function isAuthError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  const statusCode = extractStatusCode(error);

  return statusCode === 401 || /401|unauthorized/i.test(message);
}

/**
 * Checks if an error is a not found error (404)
 *
 * @param error - The error to check
 * @returns true if the error is a 404/not found error
 */
export function isNotFoundError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  const statusCode = extractStatusCode(error);

  return statusCode === 404 || /404|not found/i.test(message);
}

/**
 * Checks if an error is a rate limit error (429)
 *
 * @param error - The error to check
 * @returns true if the error is a rate limit error
 */
export function isRateLimitError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  const statusCode = extractStatusCode(error);

  return statusCode === 429 || /429|rate.?limit|too many/i.test(message);
}

/**
 * Checks if an error is a network/connection error
 *
 * @param error - The error to check
 * @returns true if the error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const message = extractErrorMessage(error);

  return /network|ECONNREFUSED|ENOTFOUND|fetch failed|failed to fetch/i.test(message);
}

/**
 * Checks if an error is a validation error (400)
 *
 * @param error - The error to check
 * @returns true if the error is a validation/bad request error
 */
export function isValidationError(error: unknown): boolean {
  const message = extractErrorMessage(error);
  const statusCode = extractStatusCode(error);

  return statusCode === 400 || /400|invalid|missing.*required|bad request/i.test(message);
}

/**
 * Gets a user-friendly title for an error (for error dialogs/toasts)
 *
 * @param error - The error to get a title for
 * @returns A short title describing the error type
 */
export function getErrorTitle(error: unknown): string {
  if (isAuthError(error)) return "Authentication Required";
  if (isNotFoundError(error)) return "Not Found";
  if (isRateLimitError(error)) return "Rate Limited";
  if (isNetworkError(error)) return "Connection Error";
  if (isValidationError(error)) return "Invalid Input";
  return "Error";
}

/**
 * Gets the HTTP status code to use in API responses based on the error
 *
 * @param error - The error to get a status code for
 * @returns HTTP status code (defaults to 500)
 */
export function getErrorStatusCode(error: unknown): number {
  // Check if error already has a status code
  const existingCode = extractStatusCode(error);
  if (existingCode) return existingCode;

  // Infer from error message
  const message = extractErrorMessage(error);

  if (/401|unauthorized/i.test(message)) return 401;
  if (/403|forbidden/i.test(message)) return 403;
  if (/404|not found/i.test(message)) return 404;
  if (/429|rate.?limit|too many/i.test(message)) return 429;
  if (/400|invalid|missing.*required|bad request/i.test(message)) return 400;

  return 500;
}
