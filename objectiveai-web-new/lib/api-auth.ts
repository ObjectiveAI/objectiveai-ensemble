import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Checks if the request is authenticated via NextAuth session.
 * Returns null if authenticated, or a 401 JSON response if not.
 *
 * Usage in API routes:
 *   const denied = await requireAuth(request);
 *   if (denied) return denied;
 */
export async function requireAuth(
  request: Request
): Promise<NextResponse | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const token = await getToken({ req: request as any });
  if (!token) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }
  return null;
}
