import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, Ensemble } from "objectiveai";
import { requireAuth } from "@/lib/api-auth";

function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing ensemble ID" },
        { status: 400 }
      );
    }

    const client = getServerClient();

    // Check if usage is requested — requires authentication (exposes spending data)
    const { searchParams } = new URL(request.url);
    const includeUsage = searchParams.get("usage") === "true";

    if (includeUsage) {
      const denied = await requireAuth(request);
      if (denied) return denied;

      const usage = await Ensemble.retrieveUsage(client, id);
      return NextResponse.json(usage);
    }

    const result = await Ensemble.retrieve(client, id);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
