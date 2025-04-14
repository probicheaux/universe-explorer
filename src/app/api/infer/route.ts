import { NextResponse } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";

export async function POST() {
  const response = await getAndCache(
    "object-detection-datasets",
    searchTopObjectDetectionTrainedDatasets
  );

  // Return a safe response without exposing sensitive data
  return NextResponse.json(response);
}
