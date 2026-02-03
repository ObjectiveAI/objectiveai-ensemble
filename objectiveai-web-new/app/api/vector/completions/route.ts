import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, Vector } from "objectiveai";

// Server-side client with API key from environment
function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, responses, ensemble, profile, from_cache, from_rng, stream } = body;

    if (!messages || !responses || !ensemble || !profile) {
      return NextResponse.json(
        { error: "Missing required fields: messages, responses, ensemble, profile" },
        { status: 400 }
      );
    }

    if (!Array.isArray(responses) || responses.length < 2) {
      return NextResponse.json(
        { error: "responses must be an array with at least 2 items" },
        { status: 400 }
      );
    }

    if (!Array.isArray(profile)) {
      return NextResponse.json(
        { error: "profile must be an array of weights" },
        { status: 400 }
      );
    }

    const client = getServerClient();

    // Handle streaming
    if (stream) {
      const streamResult = await Vector.Completions.create(client, {
        messages,
        responses,
        ensemble,
        profile,
        from_cache: from_cache ?? true,
        from_rng: from_rng ?? true,
        stream: true,
      });

      // Create a readable stream that forwards SSE chunks
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of streamResult) {
              const data = `data: ${JSON.stringify(chunk)}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch (err) {
            const message = err instanceof Error ? err.message : "Stream error";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Non-streaming
    const result = await Vector.Completions.create(client, {
      messages,
      responses,
      ensemble,
      profile,
      from_cache: from_cache ?? true,
      from_rng: from_rng ?? true,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("401") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
