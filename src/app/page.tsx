"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import UniverseExplorer from "../components/UniverseExplorer";

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
  images: string[];
  latency: number | null;
  error?: string | null;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("explorer");

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

    // --- API Call for Engine 1 (Current Search - useKNN: false) ---
    let latency1: number | null = null;
    try {
      const startTime1 = performance.now();
      const response1 = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textQuery || undefined,
          prompt_image: base64Image || undefined,
          useKNN: false,
        }),
      });
      const endTime1 = performance.now();
      latency1 = endTime1 - startTime1;

      if (!response1.ok) {
        const errorData = await response1.json().catch(() => ({}));
        throw new Error(
          `Search failed: ${response1.statusText} ${errorData.error || ""}`
        );
      }
      // Process results to build URLs
      const results1: ApiResponse = await response1.json();
      const imageUrls1 = (results1.hits || [])
        .map((hit) => {
          const ownerId = hit.fields?.owner?.[0];
          const imageId = hit.fields?.image_id?.[0];
          if (ownerId && imageId) {
            return `https://source.roboflow.one/${ownerId}/${imageId}/original.jpg`;
          }
          console.warn("Skipping hit due to missing owner/image_id:", hit);
          return null;
        })
        .filter((url): url is string => url !== null); // Filter out nulls and type guard

      setEngine1Results({
        images: imageUrls1,
        latency: latency1,
        error: null,
      });
    } catch (err: any) {
      console.error("Engine 1 Search failed:", err);
      setEngine1Results({
        images: [],
        latency: latency1,
        error: err.message || "Search request failed",
      });
    }

    // --- API Call for Engine 2 (KNN Search - useKNN: true) ---
    let latency2: number | null = null;
    try {
      const startTime2 = performance.now();
      const response2 = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textQuery || undefined,
          prompt_image: base64Image || undefined,
          useKNN: true,
        }),
      });
      const endTime2 = performance.now();
      latency2 = endTime2 - startTime2;

      if (!response2.ok) {
        const errorData = await response2.json().catch(() => ({}));
        throw new Error(
          `Search failed: ${response2.statusText} ${errorData.error || ""}`
        );
      }
      // Process results to build URLs
      const results2: ApiResponse = await response2.json();
      const imageUrls2 = (results2.hits || [])
        .map((hit) => {
          const ownerId = hit.fields?.owner?.[0];
          const imageId = hit.fields?.image_id?.[0];
          if (ownerId && imageId) {
            return `https://source.roboflow.one/${ownerId}/${imageId}/original.jpg`;
          }
          console.warn("Skipping hit due to missing owner/image_id:", hit);
          return null;
        })
        .filter((url): url is string => url !== null);

      setEngine2Results({
        images: imageUrls2,
        latency: latency2,
        error: null,
      });
    } catch (err: any) {
      console.error("Engine 2 Search failed:", err);
      setEngine2Results({
        images: [],
        latency: latency2,
        error: err.message || "Search request failed",
      });
    }

    setIsLoading(false);
  };

  return (
    <div className="flex flex-col gap-4 w-screen h-screen p-8 relative text-white">
      <h1 className="text-white text-2xl font-bold">Multi-Modal Explorer</h1>
      <div className="flex gap-2 border-b border-gray-700 mb-4">
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === "explorer"
              ? "bg-gray-800 border border-b-0 border-gray-700"
              : "bg-gray-900/50 hover:bg-gray-800/70"
          }`}
          onClick={() => setActiveTab("explorer")}
        >
          Universe Explorer
        </button>
        <button
          className={`px-4 py-2 rounded-t-md ${
            activeTab === "benchmark"
              ? "bg-gray-800 border border-b-0 border-gray-700"
              : "bg-gray-900/50 hover:bg-gray-800/70"
          }`}
          onClick={() => setActiveTab("benchmark")}
        >
          Image Search Benchmark
        </button>
      </div>

      <div className="relative flex-1 w-full rounded-xl bg-gray-900/50 backdrop-blur-md border border-gray-800 shadow-lg overflow-hidden">
        {activeTab === "explorer" && <UniverseExplorer />}
        {activeTab === "benchmark" && (
          <form onSubmit={handleSearch} className="p-6 flex flex-col h-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex flex-col gap-1">
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
              <div className="flex flex-col gap-1">
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
            <div className="mb-4 flex items-center gap-4">
              <button
                type="submit"
                className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors text-sm ${
                  isLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={isLoading || (!textQuery && !imageFile)}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <div className="flex-1 border-t border-gray-700 pt-4 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">
                Search Results Comparison
              </h2>
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
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col max-h-[calc(100vh-26rem)]">
                      <h3 className="text-lg font-medium mb-1 text-center text-gray-400 flex-shrink-0">
                        {" "}
                        Current search{" "}
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
                      <div className="flex-1 flex flex-wrap gap-4 justify-center content-start overflow-y-auto p-1 custom-scrollbar">
                        {engine1Results.error ? (
                          <p className="text-red-500 text-sm px-2 text-center w-full">
                            Error: {engine1Results.error}
                          </p>
                        ) : engine1Results.images.length > 0 ? (
                          engine1Results.images.map((imgUrl, index) => (
                            <button
                              key={`e1-${index}`}
                              onClick={() => setSelectedImage(imgUrl)}
                              className="group relative overflow-hidden rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-200"
                            >
                              <img
                                src={imgUrl}
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
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col max-h-[calc(100vh-26rem)]">
                      <h3 className="text-lg font-medium mb-1 text-center text-gray-400 flex-shrink-0">
                        {" "}
                        Built-in knn from ES{" "}
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
                      <div className="flex-1 flex flex-wrap gap-4 justify-center content-start overflow-y-auto p-1 custom-scrollbar">
                        {engine2Results.error ? (
                          <p className="text-red-500 text-sm px-2 text-center w-full">
                            Error: {engine2Results.error}
                          </p>
                        ) : engine2Results.images.length > 0 ? (
                          engine2Results.images.map((imgUrl, index) => (
                            <button
                              key={`e2-${index}`}
                              onClick={() => setSelectedImage(imgUrl)}
                              className="group relative overflow-hidden rounded-lg border border-gray-700 hover:border-blue-500 transition-all duration-200"
                            >
                              <img
                                src={imgUrl}
                                alt={`Engine 2 Result ${index + 1}`}
                                className="h-48 w-48 object-cover transform group-hover:scale-105 transition-transform duration-200"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
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
        )}
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
    </div>
  );
}
