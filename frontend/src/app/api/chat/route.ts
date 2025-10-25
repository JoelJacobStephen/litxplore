import { NextRequest } from "next/server";

// Remove edge runtime to support streaming from backend
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { messages, paperId } = await req.json();

    if (!paperId) {
      return new Response("Paper ID is required", { status: 400 });
    }

    // Get the last user message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "user") {
      return new Response("No user message found", { status: 400 });
    }

    // Get auth token from request headers
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response("Unauthorized", { status: 401 });
    }

    // Proxy to backend's paper chat endpoint with streaming
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    
    const response = await fetch(
      `${backendUrl}/api/v1/papers/${paperId}/chat?message=${encodeURIComponent(lastMessage.content)}`,
      {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend chat error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to chat with paper",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Stream the SSE response from backend and convert to Vercel AI SDK format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error("No response body");
          }

          let buffer = "";
          let done = false;

          while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;

            if (value) {
              buffer += decoder.decode(value, { stream: true });
              
              // Process complete SSE messages
              const lines = buffer.split("\n");
              buffer = lines.pop() || ""; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.error) {
                      controller.enqueue(
                        encoder.encode(`data: {"error":"${data.error}"}\n\n`)
                      );
                    } else if (data.content) {
                      // Convert to Vercel AI SDK format
                      controller.enqueue(
                        encoder.encode(`0:"${data.content.replace(/"/g, '\\"')}"\n`)
                      );
                    }
                  } catch (e) {
                    console.error("Error parsing SSE data:", e);
                  }
                }
              }
            }
          }

          controller.close();
        } catch (error) {
          console.error("Error streaming from backend:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process chat request",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
