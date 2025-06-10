"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import { cn } from "@/utils/cn";
// Define type for a single search hit
interface SearchHit {
  _id: string;
  _index: string;
  _score: number;
  fields?: {
    image_id?: string[];
    owner?: string[];
  };
}

// Define type for the API response structure
interface ApiResponse {
  hits?: SearchHit[];
  // Include other potential fields from the API response if necessary
}

// Define types for engine results state
interface EngineResult {
  images: {
    url: string;
    ownerId: string;
  }[];
  latency: number | null;
  error?: string | null;
}

export default function Home() {
  // State for Benchmark Tab
  const [textQuery, setTextQuery] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [engine1Results, setEngine1Results] = useState<EngineResult>({
    images: [],
    latency: null,
    error: null,
  });
  const [engine2Results, setEngine2Results] = useState<EngineResult>({
    images: [],
    latency: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // Add state for image preview modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Add function to calculate latency improvement
  const getLatencyImprovement = () => {
    if (!engine1Results.latency || !engine2Results.latency) return null;
    const improvement = engine1Results.latency / engine2Results.latency;
    return improvement.toFixed(2);
  };

  // Handler for image input change
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null); // Clear error on new image upload
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Function to get base64 string from File object
  const getBase64 = (file: File): Promise<string | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1] || null;
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Handler for triggering the search
  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    if (!textQuery && !imageFile) {
      setError("Please provide a text query or upload an image.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEngine1Results({ images: [], latency: null, error: null });
    setEngine2Results({ images: [], latency: null, error: null });

    let base64Image: string | null = null;
    if (imageFile) {
      try {
        base64Image = await getBase64(imageFile);
        if (!base64Image) throw new Error("Failed to convert image to base64.");
      } catch (err: any) {
        console.error("Image processing error:", err);
        setError("Error processing image: " + (err.message || "Unknown error"));
        setIsLoading(false);
        return;
      }
    }

    console.log("Starting search with:", {
      textQuery,
      hasImage: !!base64Image,
    });

    const searchRequest = async (
      index: string,
      useKNN: boolean,
      setResults: (results: EngineResult) => void
    ) => {
      try {
        const startTime = performance.now();
        const response = await fetch("/api/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: textQuery || undefined,
            prompt_image: base64Image || undefined,
            index,
          }),
        });
        const endTime = performance.now();
        const latency = endTime - startTime;

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Search failed: ${response.statusText} ${
              errorData.error || ""
            }`
          );
        }

        const results: ApiResponse = await response.json();
        const allHits = results.hits || [];
        allHits.sort((a, b) => b._score - a._score);

        const imageObjects = allHits
          .map((hit) => {
            const ownerId = hit.fields?.owner?.[0];
            const imageId = hit.fields?.image_id?.[0];
            if (ownerId && imageId) {
              return {
                url: `https://source.roboflow.com/${ownerId}/${imageId}/thumb.jpg`,
                ownerId,
              };
            }
            console.warn("Skipping hit due to missing owner/image_id:", hit);
            return null;
          })
          .filter(
            (
              obj
            ): obj is {
              url: string;
              ownerId: string;
            } => obj !== null
          );

        setResults({
          images: imageObjects,
          latency: latency,
          error: null,
        });
      } catch (err: any) {
        console.error(`Search failed for index ${index}:`, err);
        setResults({
          images: [],
          latency: null,
          error: err.message || `Request failed for index ${index}`,
        });
      }
    };

    await Promise.all([
      searchRequest("clip-images-cvpr*", false, setEngine1Results),
      searchRequest("pe-images*", false, setEngine2Results),
    ]);

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 w-screen h-screen p-8 relative text-white">
      <h1 className="text-white text-2xl font-bold">Image Search Benchmark</h1>

      <div className="relative flex-1 w-full rounded-xl bg-gray-900/50 backdrop-blur-md border border-gray-800 shadow-lg overflow-hidden">
        <form onSubmit={handleSearch} className="p-6 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="text-input"
                  className="text-sm font-medium text-gray-300"
                >
                  Text Query
                </label>
                <input
                  id="text-input"
                  type="text"
                  placeholder="Enter your search query..."
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500 text-sm"
                  value={textQuery}
                  onChange={(e) => {
                    setTextQuery(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="image-input"
                  className="text-sm font-medium text-gray-300"
                >
                  Image Input {imageFile ? `(${imageFile.name})` : ""}
                </label>
                <label
                  htmlFor="image-input"
                  className="w-full h-10 flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 cursor-pointer relative overflow-hidden group"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-auto object-contain absolute inset-0"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm group-hover:text-gray-400">
                      Click or drag to upload image
                    </span>
                  )}
                  <input
                    id="image-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2",
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  { "opacity-50 cursor-not-allowed": isLoading }
                )}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </button>
            </div>

            <div className="flex-1 border-t border-gray-700 pt-4 flex flex-col">
              {isLoading && (
                <p className="text-center text-gray-400">Loading results...</p>
              )}
              {!isLoading &&
                !error &&
                engine1Results.images.length === 0 &&
                !engine1Results.error &&
                engine2Results.images.length === 0 &&
                !engine2Results.error && (
                  <p className="text-center text-gray-500">
                    Results will appear here after running a search.
                  </p>
                )}
              {!isLoading &&
                (engine1Results.error ||
                  engine1Results.images.length > 0 ||
                  engine2Results.error ||
                  engine2Results.images.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                    <div className="relative bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col max-h-[calc(100vh-20rem)]">
                      <h3 className="text-2xl font-bold mb-1 text-center text-white flex-shrink-0">
                        CLIP
                      </h3>
                      <p className="text-xs text-center text-gray-500 mb-2 flex-shrink-0">
                        (Latency:{" "}
                        {engine1Results.latency
                          ? `${engine1Results.latency.toFixed(0)} ms`
                          : engine1Results.error
                          ? "N/A"
                          : "..."}{" "}
                        )
                      </p>

                      {engine1Results.latency &&
                        engine2Results.latency &&
                        Number(getLatencyImprovement()) < 1 && (
                          <p
                            className={cn(
                              "absolute top-2 left-2 text-xs text-center mb-2 flex-shrink-0 px-3 py-2 rounded-lg",
                              getLatencyImprovement() &&
                                Number(getLatencyImprovement()) < 1
                                ? "text-green-400 bg-green-900/50"
                                : "text-red-400 bg-red-900/50"
                            )}
                          >
                            {Number(getLatencyImprovement()) < 1
                              ? `${(
                                  1 / Number(getLatencyImprovement())
                                ).toFixed(2)}x faster`
                              : `${(
                                  1 / Number(getLatencyImprovement())
                                ).toFixed(2)}x slower`}
                          </p>
                        )}
                      <div className="flex-1 flex flex-wrap gap-4 justify-center content-start overflow-y-auto p-1 custom-scrollbar">
                        {engine1Results.error ? (
                          <p className="text-red-500 text-sm px-2 text-center w-full">
                            Error: {engine1Results.error}
                          </p>
                        ) : engine1Results.images.length > 0 ? (
                          engine1Results.images.map((img, index) => (
                            <button
                              key={`e1-${index}`}
                              onClick={() => setSelectedImage(img.url.replace("thumb.jpg", "original.jpg"))}
                              className={cn(
                                "group relative overflow-hidden rounded-lg border hover:border-blue-500 transition-all duration-200",
                                {
                                  "border-[#a351fb] border-3":
                                    img.ownerId === "wUjRYGshKaYdH3RgrMSZ",
                                  "border-gray-700":
                                    img.ownerId !== "wUjRYGshKaYdH3RgrMSZ",
                                }
                              )}
                            >
                              <img
                                src={img.url}
                                alt={`Engine 1 Result ${index + 1}`}
                                className="h-48 w-48 object-cover transform group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">
                                  Click to enlarge
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm w-full text-center">
                            No results.
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="relative bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col max-h-[calc(100vh-20rem)]">
                      <h3 className="text-2xl font-bold mb-1 text-center text-white flex-shrink-0">
                        Perception Encoder
                      </h3>
                      <p className="text-xs text-center text-gray-500 mb-2 flex-shrink-0">
                        (Latency:{" "}
                        {engine2Results.latency
                          ? `${engine2Results.latency.toFixed(0)} ms`
                          : engine2Results.error
                          ? "N/A"
                          : "..."}{" "}
                        )
                      </p>
                      {engine1Results.latency &&
                        engine2Results.latency &&
                        Number(getLatencyImprovement()) > 1 && (
                          <p
                            className={cn(
                              "absolute top-2 left-2 text-xs text-center mb-2 flex-shrink-0 px-3 py-2 rounded-lg",
                              getLatencyImprovement() &&
                                Number(getLatencyImprovement()) > 1
                                ? "text-green-400 bg-green-900/50"
                                : "text-red-400 bg-red-900/50"
                            )}
                          >
                            {Number(getLatencyImprovement()) > 1
                              ? `${getLatencyImprovement()}x faster`
                              : `${getLatencyImprovement()}x slower`}
                          </p>
                        )}
                      <div className="flex-1 flex flex-wrap gap-4 justify-center content-start overflow-y-auto p-1 custom-scrollbar">
                        {engine2Results.error ? (
                          <p className="text-red-500 text-sm px-2 text-center w-full">
                            Error: {engine2Results.error}
                          </p>
                        ) : engine2Results.images.length > 0 ? (
                          engine2Results.images.map((img, index) => (
                            <button
                              key={`e2-${index}`}
                              onClick={() => setSelectedImage(img.url.replace("thumb.jpg", "original.jpg"))}
                              className={cn(
                                "group relative overflow-hidden rounded-lg border hover:border-blue-500 transition-all duration-200",
                                {
                                  "border-[#a351fb] border-3":
                                    img.ownerId === "wUjRYGshKaYdH3RgrMSZ",
                                  "border-gray-700":
                                    img.ownerId !== "wUjRYGshKaYdH3RgrMSZ",
                                }
                              )}
                            >
                              <img
                                src={img.url}
                                alt={`Engine 2 Result ${index + 1}`}
                                className="h-48 w-48 object-cover transform group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-sm">
                                  Click to enlarge
                                </span>
                              </div>
                            </button>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm w-full text-center">
                            No results.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </form>
      </div>

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
              onClick={() => setSelectedImage(null)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
      )}
    </div>
  );
}
