import { NextRequest, NextResponse } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";
import { inferImage } from "@/adapters/roboflowAdapter";

export async function POST(request: NextRequest) {
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

  console.log("\n\nFirst dataset\n\n");
  console.log(JSON.stringify(firstDataset, null, 2));

  const modelUrl = `${firstDataset._source.url}/${firstDataset._source.latestVersion}`;

  console.log("\n\nModel URL\n\n");
  console.log(modelUrl);

  // image placeholder: https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL0JzaLEO3u74JSvaqUjlGQIdfGD-1h1Rc-g&s

  const imageB64 = await fetch(
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTL0JzaLEO3u74JSvaqUjlGQIdfGD-1h1Rc-g&s"
  ).then((res) => res.arrayBuffer());

  const imageB64String = Buffer.from(imageB64).toString("base64");
  const response = await inferImage(modelUrl, imageB64String);

  console.log("\n\nResponse\n\n");
  console.log(JSON.stringify(response, null, 2));

  // Return a safe response without exposing sensitive data
  return NextResponse.json({ response });
}
