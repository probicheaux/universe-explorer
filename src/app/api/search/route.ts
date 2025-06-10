import { NextResponse } from "next/server";
import { roboflowSearchImages } from "@/adapters/roboflowSearchAdapter";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      query,
      prompt_image,
      useKNN = false,
      index,
      workspace_id,
      sort,
    } = body as {
      query?: string;
      prompt_image?: string;
      useKNN: boolean;
      index: string;
      workspace_id?: string;
      sort?: any[]; // Using any for simplicity, consider defining a proper type
    };

    console.log("body", body);

    const results = await roboflowSearchImages({
      query,
      prompt_image,
      new: useKNN,
      index,
      ...(workspace_id && { workspace_id }),
      ...(sort && { sort }),
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
