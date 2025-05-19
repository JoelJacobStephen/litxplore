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
            let buffer = "";
            
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Decode the chunk and add to buffer
              const text = new TextDecoder().decode(value);
              buffer += text;
              
              // Process complete events (delimited by double newlines)
              const events = buffer.split("\n\n");
              
              // Keep the last potentially incomplete event in the buffer
              buffer = events.pop() || "";

              for (const event of events) {
                if (event.trim() && event.startsWith("data: ")) {
                  try {
                    // Extract data after "data: "
                    const jsonText = event.slice(6);
                    const jsonData = JSON.parse(jsonText);
                    
                    if (jsonData.content && typeof jsonData.content === 'string') {
                      // Handle nested JSON objects (common issue with SSE streaming)
                      if (jsonData.content.startsWith('{"content"')) {
                        try {
                          // Try to parse the nested JSON content
                          const innerJson = JSON.parse(jsonData.content);
                          if (innerJson.content && typeof innerJson.content === 'string') {
                            controller.enqueue(
                              new TextEncoder().encode(innerJson.content)
                            );
                          }
                        } catch (innerError) {
                          // Clean the content if we can't parse it
                          const cleanContent = jsonData.content.replace(/\{"content":[^}]*\}/g, "");
                          if (cleanContent.trim()) {
                            controller.enqueue(
                              new TextEncoder().encode(cleanContent)
                            );
                          }
                        }
                      } else {
                        // Normal content
                        controller.enqueue(
                          new TextEncoder().encode(jsonData.content)
                        );
                      }
                    }

                    // Handle source metadata
                    if (jsonData.sources && Array.isArray(jsonData.sources)) {
                      data.append({ sources: jsonData.sources });
                    }
                  } catch (e) {
                    console.error("Error parsing event:", e, event);
                    
                    // Try to salvage plain text if JSON parsing fails
                    const plainText = event.slice(6).trim();
                    if (plainText && !plainText.includes('{"content"')) {
                      controller.enqueue(
                        new TextEncoder().encode(plainText)
                      );
                    }
                  }
                }
              }
            }
            
            // Process any remaining data in the buffer
            if (buffer.trim() && buffer.startsWith("data: ")) {
              try {
                const jsonData = JSON.parse(buffer.slice(6));
                if (jsonData.content) {
                  controller.enqueue(
                    new TextEncoder().encode(jsonData.content)
                  );
                }
              } catch (e) {
                // Ignore parsing errors for the last chunk
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
