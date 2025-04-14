import { NextResponse } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";

export async function POST() {
  await getAndCache(
    "object-detection-datasets",
    searchTopObjectDetectionTrainedDatasets
  );

  // Return a safe response without exposing sensitive data
  return NextResponse.json({ success: true });
}
