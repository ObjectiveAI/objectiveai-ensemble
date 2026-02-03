import { NextRequest, NextResponse } from "next/server";
import { ObjectiveAI, Chat } from "objectiveai";

// Server-side client with API key from environment
function getServerClient(): ObjectiveAI {
  return new ObjectiveAI({
    apiKey: process.env.OBJECTIVEAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, messages, stream } = body;

    if (!model) {
      return NextResponse.json(
        { error: "Missing model (ensemble LLM ID or inline config)" },
        { status: 400 }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid messages array" },
        { status: 400 }
      );
    }

    const client = getServerClient();

    // Handle streaming
    if (stream) {
      const params = {
        model,
        messages,
        tools: [],
        stream: true as const,
      } as Chat.Completions.Request.ChatCompletionCreateParamsStreaming;

      const streamResponse = await Chat.Completions.create(client, params);

      // Create a readable stream that forwards SSE chunks
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
    const params = {
      model,
      messages,
      tools: [],
    } as Chat.Completions.Request.ChatCompletionCreateParamsNonStreaming;

    const result = await Chat.Completions.create(client, params);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("401") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
