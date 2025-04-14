import { NextResponse } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";

export async function GET() {
  const response = await searchTopObjectDetectionTrainedDatasets();

  // Return a safe response without exposing sensitive data
  return NextResponse.json(response);
}
