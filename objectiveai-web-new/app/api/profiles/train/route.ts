import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, Functions } from "objectiveai";
import { requireAuth } from "@/lib/api-auth";
import { normalizeError, getErrorStatusCode } from "@/lib/error-handling";

function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const denied = await requireAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const { function: functionRef, dataset, n, ensemble, from_cache, from_rng, stream } = body;

    // Validate function reference
    if (!functionRef?.owner || !functionRef?.repository) {
      return NextResponse.json(
        { error: "Missing function reference (owner/repository required)" },
        { status: 400 }
      );
    }

    // Validate dataset
    if (!dataset || !Array.isArray(dataset) || dataset.length === 0) {
      return NextResponse.json(
        { error: "Dataset must be a non-empty array" },
        { status: 400 }
      );
    }

    for (let i = 0; i < dataset.length; i++) {
      const item = dataset[i];
      if (item.input === undefined) {
        return NextResponse.json(
          { error: `Dataset item ${i + 1} is missing input` },
          { status: 400 }
        );
      }
      if (!item.target || !item.target.type || item.target.value === undefined) {
        return NextResponse.json(
          { error: `Dataset item ${i + 1} is missing target (requires type and value)` },
          { status: 400 }
        );
      }
    }

    // Validate n
    if (!n || typeof n !== "number" || n < 1) {
      return NextResponse.json(
        { error: "n must be a positive integer (number of executions per dataset item)" },
        { status: 400 }
      );
    }

    // Validate ensemble
    if (!ensemble) {
      return NextResponse.json(
        { error: "Missing ensemble (ensemble ID or inline definition)" },
        { status: 400 }
      );
    }

    const client = getServerClient();

    const computeBody = {
      dataset,
      n,
      ensemble,
      from_cache: from_cache ?? true,
      from_rng: from_rng ?? true,
    };

    const { owner, repository, commit } = functionRef;

    if (stream) {
      const streamResponse = await Functions.Profiles.Computations.remoteFunctionCreate(
        client,
        owner,
        repository,
        commit ?? null,
        { ...computeBody, stream: true as const },
      );

      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResponse) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            const message = normalizeError(err);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const result = await Functions.Profiles.Computations.remoteFunctionCreate(
      client,
      owner,
      repository,
      commit ?? null,
      computeBody,
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = normalizeError(error);
    const statusCode = getErrorStatusCode(error);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
