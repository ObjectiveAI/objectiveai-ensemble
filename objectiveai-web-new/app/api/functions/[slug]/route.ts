import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, Functions } from "objectiveai";

function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Missing function slug" },
        { status: 400 }
      );
    }

    // Parse slug (format: owner--repository)
    const parts = slug.split("--");
    if (parts.length !== 2) {
      return NextResponse.json(
        { error: "Invalid slug format. Expected owner--repository" },
        { status: 400 }
      );
    }

    const [owner, repository] = parts;
    const client = getServerClient();

    // Get commit from query param or find latest via pairs
    const { searchParams } = new URL(request.url);
    let commit = searchParams.get("commit");

    if (!commit) {
      // Find the function-profile pair to get the commit
      const pairs = await Functions.listPairs(client);
      const pair = pairs.data.find(
        (p: { function: { owner: string; repository: string } }) =>
          p.function.owner === owner && p.function.repository === repository
      );
      if (pair) {
        commit = pair.function.commit;
      }
    }

    if (!commit) {
      return NextResponse.json(
        { error: `Function ${owner}/${repository} not found` },
        { status: 404 }
      );
    }

    const result = await Functions.retrieve(client, owner, repository, commit);
    return NextResponse.json({
      ...result,
      owner,
      repository,
      commit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("404") || message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
