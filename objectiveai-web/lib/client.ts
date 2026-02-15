import { ObjectiveAI } from "objectiveai";
import { Provider } from "./provider";

/**
 * Create an ObjectiveAI client with optional session-based authentication.
 *
 * The key insight: The `apiKey` field can accept either:
 * - A traditional API key (for server-side or API key-based access)
 * - A session authorization token (for client-side OAuth access)
 *
 * @param session - Optional TokenSession for authenticated requests
 * @returns ObjectiveAI client instance
 */
export async function createClient(
  session?: Provider.TokenSession
): Promise<ObjectiveAI> {
  const authorization = session
    ? await Provider.TokenSession.authorization(session)
    : null;

  return new ObjectiveAI({
    apiKey: authorization ?? "none",
    apiBase: process.env.NEXT_PUBLIC_API_URL,
  });
}

/**
 * Create an unauthenticated client for public endpoints.
 * Used for browsing functions, ensembles, and anonymous execution with free credit.
 */
export function createPublicClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.NEXT_PUBLIC_OBJECTIVEAI_API_KEY || "none",
    apiBase: process.env.NEXT_PUBLIC_API_URL,
  });
}
