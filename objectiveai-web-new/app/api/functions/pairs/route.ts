import { NextResponse } from "next/server";
import { ObjectiveAI, Functions } from "objectiveai";

function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function GET() {
  try {
    const client = getServerClient();
    const result = await Functions.listPairs(client);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
