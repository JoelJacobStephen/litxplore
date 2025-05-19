import { StreamingTextResponse, experimental_StreamData } from "ai";
import { streamChat } from "@/lib/services/paper-service";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const {
      messages,
      paperId,
      model = "gemini-2.0-flash",
      systemPrompt,
    } = await req.json();

    if (!paperId) {
      return NextResponse.json(
        { error: "Paper ID is required" },
        { status: 400 }
      );
    }

    if (!messages || !messages.length) {
      return NextResponse.json(
        { error: "At least one message is required" },
        { status: 400 }
      );
    }

    const lastMessage = messages[messages.length - 1];
    const userQuery = lastMessage.content;

    if (!userQuery) {
      return NextResponse.json(
        { error: "Message content cannot be empty" },
        { status: 400 }
      );
    }

    try {
      // Stream the chat response
      const response = await streamChat(
        paperId,
        userQuery,
        model,
        systemPrompt
      );
      const data = new experimental_StreamData();

      // Create a transform stream
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.error(new Error("No readable stream available"));
            data.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const text = new TextDecoder().decode(value);
              // Split by the SSE delimiter and process each chunk
              const chunks = text.split("\n\n");

              for (const chunk of chunks) {
                if (chunk.trim() && chunk.startsWith("data: ")) {
                  try {
                    const jsonData = JSON.parse(chunk.slice(6));
                    
                    // Process the content chunk
                    if (jsonData.content) {
                      controller.enqueue(
                        new TextEncoder().encode(jsonData.content)
                      );
                    }

                    // Send source metadata if available
                    if (jsonData.sources && jsonData.sources.length > 0) {
                      data.append({ sources: jsonData.sources });
                    }
                  } catch (e) {
                    console.error("Error parsing chunk:", e, chunk);
                    // Try to recover partial data if possible
                    if (chunk.slice(6).trim()) {
                      try {
                        controller.enqueue(
                          new TextEncoder().encode(chunk.slice(6).trim())
                        );
                      } catch (e2) {
                        console.error("Failed to recover partial data:", e2);
                      }
                    }
                  }
                }
              }
            }
            controller.close();
            data.close();
          } catch (error) {
            console.error("Stream processing error:", error);
            controller.error(error);
            data.close();
          }
        },
      });

      return new StreamingTextResponse(stream, { status: 200 });
    } catch (error) {
      console.error("Chat streaming error:", error);
      return NextResponse.json(
        { error: "Failed to generate streaming response" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Chat request processing error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
