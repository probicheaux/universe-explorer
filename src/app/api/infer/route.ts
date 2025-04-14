import { NextRequest, NextResponse } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";
import { inferImage } from "@/adapters/roboflowAdapter";

export async function POST(request: NextRequest) {
  try {
    // Check if request has a body
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: "No image provided in request body" },
        { status: 400 }
      );
    }

    // Get the dataset information
    const datasets = await getAndCache(
      "object-detection-datasets",
      searchTopObjectDetectionTrainedDatasets
    );

    const firstDataset = datasets.hits.hits[0] as {
      _source: {
        url: string;
        latestVersion: string;
      };
    };

    const modelUrl = `${firstDataset._source.url}/${firstDataset._source.latestVersion}`;
    const inferenceResponse = await inferImage(modelUrl, image);

    return NextResponse.json(inferenceResponse);
  } catch (error) {
    console.error("Error processing inference request:", error);
    return NextResponse.json(
      { error: "Failed to process inference request" },
      { status: 500 }
    );
  }
}
