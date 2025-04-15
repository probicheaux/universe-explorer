import { NextResponse } from "next/server";
import { chatWithAssistant, ChatMessage } from "@/adapters/openAiAdapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body as { prompt: string };

    if (!prompt) {
      return NextResponse.json(
        { error: "Invalid request: prompt is required" },
        { status: 400 }
      );
    }

    const messages: ChatMessage[] = [{ role: "user", content: prompt }];
    const response = await chatWithAssistant(messages);

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 500 });
    }

    return NextResponse.json({ message: response.message });
  } catch (error) {
    console.error("Error in prompt route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
