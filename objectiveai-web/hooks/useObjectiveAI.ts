"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { ObjectiveAI } from "objectiveai";
import { Provider } from "@/lib/provider";
import { createClient, createPublicClient } from "@/lib/client";

/**
 * Hook for accessing the ObjectiveAI client with automatic session-based authentication.
 *
 * For authenticated operations (function execution, API key management, credits):
 * - Uses the session's provider token as the API key
 * - Handles token refresh automatically via the TokenSession pattern
 *
 * For public operations (browsing functions, ensembles):
 * - Returns an unauthenticated client
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { getClient, isAuthenticated } = useObjectiveAI();
 *
 *   const handleExecute = async () => {
 *     const client = await getClient();
 *     const result = await Functions.Executions.create(client, funcRef, profileRef, { input });
 *   };
 * }
 * ```
 */
export function useObjectiveAI() {
  const { data: session, status } = useSession();

  const tokenSession = useMemo<Provider.TokenSession | null>(() => {
    if (!session) return null;
    return Provider.TokenSession.fromSession(session);
  }, [session]);

  /**
   * Get an authenticated ObjectiveAI client.
   * If no session is available, returns an unauthenticated client.
   */
  const getClient = useCallback(async (): Promise<ObjectiveAI> => {
    if (tokenSession) {
      return createClient(tokenSession);
    }
    return createPublicClient();
  }, [tokenSession]);

  /**
   * Get an unauthenticated client for public operations.
   */
  const getPublicClient = useCallback((): ObjectiveAI => {
    return createPublicClient();
  }, []);

  return {
    /** Get an authenticated client (or public client if not authenticated) */
    getClient,
    /** Get an explicitly public client (no auth) */
    getPublicClient,
    /** Whether the user is authenticated */
    isAuthenticated: status === "authenticated",
    /** Whether auth status is still loading */
    isLoading: status === "loading",
    /** The current token session (null if not authenticated) */
    tokenSession,
  };
}
