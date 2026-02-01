import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, EnsembleLlm } from "objectiveai";

// Server-side client with API key from environment
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
        { error: "Missing ensemble LLM ID" },
        { status: 400 }
      );
    }

    const client = getServerClient();
    const result = await EnsembleLlm.retrieve(client, id);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("404") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
