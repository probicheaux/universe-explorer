import { NextRequest } from "next/server";
import { searchTopObjectDetectionTrainedDatasets } from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";
import { inferImage } from "@/adapters/roboflowAdapter";
import { ModelInfo } from "@/utils/api/inference";
import { calculateMetadataScore } from "@/utils/modelCandidatesHeuristic";

// Helper function to create a stream message
function createStreamMessage(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: NextRequest) {
  // Create a TransformStream for SSE
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  // Start streaming response
  const response = new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });

  // Process the request in the background
  (async () => {
    try {
      // Check if request has a body
      const contentType = request.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        await writer.write(
          encoder.encode(
            createStreamMessage("error", {
              modelId: "request",
              error: "Content-Type must be application/json",
            })
          )
        );
        await writer.close();
        return;
      }

      let body;
      try {
        body = await request.json();
      } catch (e) {
        await writer.write(
          encoder.encode(
            createStreamMessage("error", {
              modelId: "request",
              error: "Invalid JSON in request body",
            })
          )
        );
        await writer.close();
        return;
      }

      const { image, searchClasses = [], from, to } = body;

      if (!image) {
        await writer.write(
          encoder.encode(
            createStreamMessage("error", {
              modelId: "request",
              error: "No image provided in request body",
            })
          )
        );
        await writer.close();
        return;
      }

      // Get the dataset information
      const datasets = await getAndCache(
        "object-detection-datasets",
        searchTopObjectDetectionTrainedDatasets,
        60 * 60 * 24 * 30 // 30 days
      );

      // Get promising models
      const MODELS_LIMIT = 100;
      const totalModels = datasets.hits.hits.length;

      // Apply pagination if from and to are provided
      const startIndex = from !== undefined ? from : 0;
      const endIndex = to !== undefined ? to : MODELS_LIMIT;
      console.log("startIndex", startIndex);
      console.log("endIndex", endIndex);

      const bestModelCandidates = datasets.hits.hits
        .map((hit: any) => {
          // Calculate metadata score based on search classes
          const metadataScore = calculateMetadataScore(
            hit._source,
            searchClasses
          );

          const latestModel =
            hit._source.models?.length && hit._source.models.length > 0
              ? hit._source.models[hit._source.models.length - 1]
              : hit._source.latestVersion;

          return {
            id: `${hit._source.url}/${latestModel}`,
            datasetId: hit._source.dataset_id,
            icon: hit._source.icon,
            images: hit._source.images,
            universe: hit._source.universe,
            universeStats: hit._source.universeStats,
            classCounts: hit._source.class_counts,
            bestModelScore: hit._source.bestModelScore,
            models: hit._source.models,
            type: hit._source.type,
            annotation: hit._source.annotation,
            url: hit._source.url,
            version: latestModel,
            name: hit._source.name || "Unknown Model",
            description: hit._source.description || "",
            metadataScore: metadataScore,
          };
        })
        .sort(
          (a: ModelInfo, b: ModelInfo) =>
            (b.metadataScore ?? 0) - (a.metadataScore ?? 0)
        )
        .slice(startIndex, endIndex);

      // Send models data first
      await writer.write(
        encoder.encode(
          createStreamMessage("models", {
            models: bestModelCandidates,
            totalInferences: bestModelCandidates.length,
            totalModels: totalModels,
            from: startIndex,
            to: endIndex,
          })
        )
      );

      const processModel = async (model: ModelInfo) => {
        try {
          const modelUrl = `${model.url}/${model.version}`;
          const result = await inferImage(modelUrl, image);

          // Send each inference result as it completes
          await writer.write(
            encoder.encode(
              createStreamMessage("inference", {
                modelId: model.id,
                result,
              })
            )
          );

          return { modelId: model.id, success: true, result };
        } catch (error) {
          console.error(`Error inferring with model ${model.id}:`, error);

          // Send error for this specific model
          await writer.write(
            encoder.encode(
              createStreamMessage("error", {
                modelId: model.id,
                error: "Failed to process inference",
              })
            )
          );

          return { modelId: model.id, success: false, error };
        }
      };

      await Promise.all(bestModelCandidates.map(processModel));

      // Send completion message
      await writer.write(
        encoder.encode(createStreamMessage("complete", { status: "done" }))
      );
    } catch (error) {
      console.error("Error processing inference request:", error);
      await writer.write(
        encoder.encode(
          createStreamMessage("error", {
            modelId: "request",
            error: "Failed to process inference request",
          })
        )
      );
    } finally {
      // Always close the writer
      await writer.close();
    }
  })();

  return response;
}
