import { NextResponse } from "next/server";
import { roboflowSearchImages } from "@/adapters/roboflowSearchAdapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prompt,
      prompt_image,
      useKNN = false,
    } = body as {
      prompt?: string;
      prompt_image?: string;
      useKNN: boolean;
    };

    console.log("body", body);

    const results = await roboflowSearchImages({
      prompt,
      prompt_image,
      new: useKNN,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error in search route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
