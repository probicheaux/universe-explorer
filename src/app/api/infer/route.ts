import { NextRequest } from "next/server";
import {
  searchTopObjectDetectionTrainedDatasets,
  searchDatasetsByDatasetIds,
} from "@/adapters/elasticAdapter";
import { getAndCache } from "@/utils/cache";
import { inferImage } from "@/adapters/roboflowAdapter";
import {
  InferenceOptions,
  INFERENCES_PAGE_SIZE,
  ModelInfo,
} from "@/utils/api/inference";
import { calculateMetadataScore } from "@/utils/modelCandidatesHeuristic";
import { roboflowSearchDatasets } from "@/adapters/roboflowSearchAdapter";

// Helper function to create a stream message
function createStreamMessage(event: string, data: any) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Helper function to measure time
function measureTime(label: string, fn: () => Promise<any>): Promise<any> {
  const start = Date.now();
  return fn().then((result) => {
    const end = Date.now();
    console.log(`⏱️ ${label}: ${end - start}ms`);
    return result;
  });
}

interface InferRequestBody extends InferenceOptions {
  image: string;
}

export async function POST(request: NextRequest) {
  const totalStartTime = Date.now();
  console.log("🚀 Starting inference request processing");

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

      const { image, searchClasses = [], from, to } = body as InferRequestBody;

      const classes = searchClasses.map((cls) => cls.class);

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
      const datasets = await measureTime("Dataset fetching", () =>
        getAndCache(
          "object-detection-datasets",
          searchTopObjectDetectionTrainedDatasets,
          60 * 60 * 24 * 30 // 30 days
        )
      );

      const topDrawnClass = searchClasses
        .sort((a, b) => b.drawCount - a.drawCount)
        .map((cls) => cls.class)?.[0];

      let semanticSearchModels: any[] = [];

      if (topDrawnClass) {
        const subjectToSemanticSearch = topDrawnClass
          ?.replaceAll("-", " ")
          .replaceAll("_", " ");

        console.log("🔍 Semantic search for:", subjectToSemanticSearch);

        const semanticSearchResults = await measureTime("Semantic search", () =>
          roboflowSearchDatasets({
            prompt: subjectToSemanticSearch,
            trainedVersion: true,
            filter_nsfw: true,
            "-forkedFrom": { exists: true },
            images: {
              gte: 25, // don't show empty datasets or very tiny datasets
            },
            public: true,
            type: "object-detection",
            fields: ["dataset_id"],
            sort: [{ _score: "desc" }],
            size: to ?? 100,
            from: from ?? 0,
          })
        );

        const semanticDatasetIds = semanticSearchResults.hits.map(
          (hit: any) => hit._id
        );

        const completeSemanticSearchData = await measureTime(
          "Complete semantic search data",
          () => searchDatasetsByDatasetIds(semanticDatasetIds)
        );

        semanticSearchModels = completeSemanticSearchData.hits.hits.map(
          (hit: any) => ({
            ...hit,
            semanticScore: semanticSearchResults.hits.find(
              (s: any) => s._id === hit._id
            )?._score,
          })
        );

        // normalize semantic scores - they're between 0 and 1 but also usually lower, which ends
        // up penalizing models that are semantically similar to the search query
        semanticSearchModels = semanticSearchModels.map((model) => ({
          ...model,
          semanticScore: model.semanticScore,
        }));

        const normalizeFactor =
          100 /
          Math.max(...semanticSearchModels.map((model) => model.semanticScore));

        semanticSearchModels = semanticSearchModels.map((model) => ({
          ...model,
          semanticScore: model.semanticScore * normalizeFactor,
        }));
      }

      // Apply pagination if from and to are provided
      const startIndex = from !== undefined ? from : 0;
      const endIndex = to !== undefined ? to : INFERENCES_PAGE_SIZE;

      let suggestedModelHits: any[] = [];

      if (semanticSearchModels.length > 0) {
        suggestedModelHits = [
          ...semanticSearchModels.slice(0, INFERENCES_PAGE_SIZE / 2),
          ...datasets.hits.hits.slice(0, INFERENCES_PAGE_SIZE / 2),
        ];
      } else {
        suggestedModelHits = datasets.hits.hits.slice(0, INFERENCES_PAGE_SIZE);
      }

      const models: ModelInfo[] = suggestedModelHits
        .map((hit: any) => {
          // Calculate metadata score based on search classes
          const metadataScore = calculateMetadataScore(hit._source, classes);

          const latestModel =
            hit._source.models?.length && hit._source.models.length > 0
              ? hit._source.models[hit._source.models.length - 1]
              : hit._source.latestVersion;

          return {
            id: `${hit._source.url}/${latestModel}`,
            datasetId: hit._source.dataset_id,
            icon: hit._source.icon,
            iconOwner: hit._source.iconOwner,
            iconHasAnnotation: hit._source.iconHasAnnotation,
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
            semanticScore: hit.semanticScore,
          } as ModelInfo;
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
            models,
            from: startIndex,
            to: endIndex,
          })
        )
      );

      // Create a map to track all inference requests
      const inferenceStartTime = Date.now();
      console.log("🤖 Starting inference on models");

      const inferencePromises = models.map(async (model, index) => {
        const modelStartTime = Date.now();
        try {
          const modelUrl = `${model.url}/${model.version}`;
          console.log(
            `🔄 Processing model ${index + 1}/${models.length}: ${model.name}`
          );

          const result = await inferImage(modelUrl, image);

          const modelEndTime = Date.now();
          console.log(
            `✅ Model ${index + 1}/${models.length} completed in ${
              modelEndTime - modelStartTime
            }ms`
          );

          // Send each inference result as it completes
          await writer.write(
            encoder.encode(
              createStreamMessage("inference", {
                modelId: model.id,
                result: {
                  ...result,
                  model_name: model.name,
                },
              })
            )
          );

          return { modelId: model.id, success: true, result };
        } catch (error) {
          const modelEndTime = Date.now();
          console.error(
            `❌ Error inferring with model ${index + 1}/${models.length} (${
              model.name
            }) in ${modelEndTime - modelStartTime}ms:`,
            error
          );

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
      });

      // Wait for all inferences to complete
      await Promise.all(inferencePromises);

      const inferenceEndTime = Date.now();
      console.log(
        `⏱️ Total inference time: ${inferenceEndTime - inferenceStartTime}ms`
      );

      // Send completion message
      await writer.write(
        encoder.encode(createStreamMessage("complete", { status: "done" }))
      );

      const totalEndTime = Date.now();
      console.log(
        `🏁 Total request processing time: ${totalEndTime - totalStartTime}ms`
      );
    } catch (error) {
      console.error("❌ Error processing inference request:", error);
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
