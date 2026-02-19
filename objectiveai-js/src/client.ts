import z from "zod";
import { convert, type JSONSchema } from "./json_schema";
import { Stream } from "./stream";
import { ObjectiveAIFetchError } from "./error";

/**
 * Read an environment variable, supporting both Node.js and Deno.
 */
function readEnv(env: string): string | undefined {
  if (typeof (globalThis as any).process !== "undefined") {
    return (globalThis as any).process.env?.[env]?.trim() ?? undefined;
  }
  if (typeof (globalThis as any).Deno !== "undefined") {
    return (globalThis as any).Deno.env?.get?.(env)?.trim();
  }
  return undefined;
}

/**
 * Schema for ObjectiveAI client options.
 */
export const ObjectiveAIOptionsSchema = z
  .object({
    apiKey: z
      .string()
      .nullish()
      .describe("API key for authentication. Falls back to OBJECTIVEAI_API_KEY env var."),
    apiBase: z
      .string()
      .nullish()
      .describe(
        "Base URL for the API. Falls back to OBJECTIVEAI_API_BASE env var, then https://api.objective-ai.io",
      ),
    userAgent: z
      .string()
      .nullish()
      .describe("User-Agent header. Falls back to USER_AGENT env var."),
    xTitle: z
      .string()
      .nullish()
      .describe("X-Title header. Falls back to X_TITLE env var."),
    httpReferer: z
      .string()
      .nullish()
      .describe("HTTP-Referer header. Falls back to HTTP_REFERER env var."),
  })
  .describe("Options for the ObjectiveAI client.");
export type ObjectiveAIOptions = z.infer<typeof ObjectiveAIOptionsSchema>;
export const ObjectiveAIOptionsJsonSchema: JSONSchema = convert(ObjectiveAIOptionsSchema);

/**
 * Schema for request options.
 */
export const RequestOptionsSchema = z
  .object({
    headers: z
      .union([
        z.instanceof(Headers),
        z.record(z.string(), z.string()),
        z.array(z.tuple([z.string(), z.string()])),
      ])
      .nullish()
      .describe("Additional headers to include in the request."),
    signal: z
      .instanceof(AbortSignal)
      .nullish()
      .describe("AbortSignal for cancelling the request."),
  })
  .describe("Options for individual requests.");
export type RequestOptions = z.infer<typeof RequestOptionsSchema>;
export const RequestOptionsJsonSchema: JSONSchema = convert(RequestOptionsSchema);

/**
 * ObjectiveAI API client.
 */
export class ObjectiveAI {
  readonly apiKey: string | undefined;
  readonly apiBase: string;
  readonly userAgent: string | undefined;
  readonly xTitle: string | undefined;
  readonly httpReferer: string | undefined;

  constructor(options?: ObjectiveAIOptions | null) {
    this.apiKey =
      options?.apiKey ?? readEnv("OBJECTIVEAI_API_KEY") ?? undefined;
    this.apiBase =
      options?.apiBase ??
      readEnv("OBJECTIVEAI_API_BASE") ??
      "https://api.objective-ai.io";
    this.userAgent =
      options?.userAgent ?? readEnv("USER_AGENT") ?? undefined;
    this.xTitle = options?.xTitle ?? readEnv("X_TITLE") ?? undefined;
    this.httpReferer =
      options?.httpReferer ?? readEnv("HTTP_REFERER") ?? undefined;
  }

  /**
   * Build headers for a request.
   */
  private buildHeaders(options?: RequestOptions | null): Headers {
    const headers = new Headers();

    // Set default headers
    headers.set("Content-Type", "application/json");

    if (this.apiKey) {
      headers.set("Authorization", `Bearer ${this.apiKey}`);
    }
    if (this.userAgent) {
      headers.set("User-Agent", this.userAgent);
    }
    if (this.xTitle) {
      headers.set("X-Title", this.xTitle);
    }
    if (this.httpReferer) {
      headers.set("HTTP-Referer", this.httpReferer);
    }

    // Merge in request-specific headers
    if (options?.headers) {
      const optHeaders = options.headers;
      if (optHeaders instanceof Headers) {
        optHeaders.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(optHeaders)) {
        for (const [key, value] of optHeaders) {
          headers.set(key, value);
        }
      } else {
        for (const [key, value] of Object.entries(optHeaders)) {
          headers.set(key, value);
        }
      }
    }

    return headers;
  }

  /**
   * Build the full URL for a path.
   */
  private buildUrl(path: string): string {
    const base = this.apiBase.endsWith("/")
      ? this.apiBase.slice(0, -1)
      : this.apiBase;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${base}${normalizedPath}`;
  }

  /**
   * Handle error responses, extracting the body.
   */
  private async handleErrorResponse(
    response: Response,
  ): Promise<ObjectiveAIFetchError> {
    let rawBody: string | null;
    try {
      rawBody = await response.text();
    } catch {
      rawBody = null;
    }

    return new ObjectiveAIFetchError(response.status, rawBody);
  }

  /**
   * Perform a GET request and return the parsed JSON response.
   */
  async get_unary<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: "GET",
      headers: this.buildHeaders(options),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal ?? undefined,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return (await response.json()) as T;
  }

  /**
   * Perform a POST request and return the parsed JSON response.
   */
  async post_unary<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: this.buildHeaders(options),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal ?? undefined,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return (await response.json()) as T;
  }

  /**
   * Perform a DELETE request and return the parsed JSON response.
   */
  async delete_unary<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path), {
      method: "DELETE",
      headers: this.buildHeaders(options),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: options?.signal ?? undefined,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return (await response.json()) as T;
  }

  /**
   * Perform a GET request and return an SSE stream.
   */
  async get_streaming<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<Stream<T>> {
    const headers = this.buildHeaders(options);
    headers.set("Accept", "text/event-stream");

    const controller = new AbortController();
    const signal = options?.signal;

    // Link external signal to our controller
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const response = await fetch(this.buildUrl(path), {
      method: "GET",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return new Stream<T>(response, controller);
  }

  /**
   * Perform a POST request and return an SSE stream.
   */
  async post_streaming<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<Stream<T>> {
    const headers = this.buildHeaders(options);
    headers.set("Accept", "text/event-stream");

    const controller = new AbortController();
    const signal = options?.signal;

    // Link external signal to our controller
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return new Stream<T>(response, controller);
  }

  /**
   * Perform a DELETE request and return an SSE stream.
   */
  async delete_streaming<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions | null,
  ): Promise<Stream<T>> {
    const headers = this.buildHeaders(options);
    headers.set("Accept", "text/event-stream");

    const controller = new AbortController();
    const signal = options?.signal;

    // Link external signal to our controller
    if (signal) {
      signal.addEventListener("abort", () => controller.abort());
    }

    const response = await fetch(this.buildUrl(path), {
      method: "DELETE",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw await this.handleErrorResponse(response);
    }

    return new Stream<T>(response, controller);
  }
}
