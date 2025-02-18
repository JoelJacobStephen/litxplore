import { StreamingTextResponse, experimental_StreamData } from "ai";
import { streamChat } from "@/lib/services/paper-service";

export async function POST(req: Request) {
  const { messages, paperId } = await req.json();
  const lastMessage = messages[messages.length - 1];

  try {
    const response = await streamChat(paperId, lastMessage.content);
    const data = new experimental_StreamData();

    // Create a transform stream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) return;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = new TextDecoder().decode(value);
            const chunks = text.split("\n\n");

            for (const chunk of chunks) {
              if (chunk.startsWith("data: ")) {
                const jsonData = JSON.parse(chunk.slice(6));
                controller.enqueue(new TextEncoder().encode(jsonData.content));

                if (jsonData.sources) {
                  data.append({ sources: jsonData.sources });
                }
              }
            }
          }
          controller.close();
          data.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
          data.close();
        }
      },
    });

    return new StreamingTextResponse(stream); // Remove the headers option as it's not supported
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
