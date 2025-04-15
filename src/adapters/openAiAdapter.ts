import OpenAI from "openai";
import { getEnv } from "@/utils/environment";

const openai = new OpenAI({
  apiKey: getEnv("OPENAI_API_KEY"),
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  message: string;
  error?: string;
}

export async function chatWithAssistant(
  messages: ChatMessage[]
): Promise<ChatResponse> {
  try {
    // Create a new thread
    const thread = await openai.beta.threads.create();

    // Add messages to the thread
    for (const msg of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: msg.role,
        content: msg.content,
      });
    }

    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_pQCRdHiA9VSVfjuo2hKgWorW",
    });

    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (
      runStatus.status === "queued" ||
      runStatus.status === "in_progress"
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Get the latest message
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    const latestMessage = threadMessages.data[0];
    const messageContent = latestMessage.content[0];

    if (messageContent.type !== "text") {
      throw new Error("Unexpected message content type");
    }

    return {
      message: messageContent.text.value,
    };
  } catch (error) {
    console.error("Error chatting with assistant:", error);
    return {
      message: "",
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
