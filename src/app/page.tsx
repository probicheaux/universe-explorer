"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import UniverseExplorer from "../components/UniverseExplorer";

// Define types for results
interface EngineResult {
  images: string[]; // Assuming image URLs for now
  latency: number | null;
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
  });
  const [engine2Results, setEngine2Results] = useState<EngineResult>({
    images: [],
    latency: null,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
        // Result includes the `data:mime/type;base64,` prefix, remove it
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
    setEngine1Results({ images: [], latency: null });
    setEngine2Results({ images: [], latency: null });

    let base64Image: string | null = null;
    if (imageFile) {
      try {
        base64Image = await getBase64(imageFile);
        if (!base64Image) throw new Error("Failed to convert image to base64.");
      } catch (err) {
        console.error("Image processing error:", err);
        setError("Error processing image. Please try a different one.");
        setIsLoading(false);
        return;
      }
    }

    console.log("Starting search with:", {
      textQuery,
      hasImage: !!base64Image,
    });

    try {
      // --- API Call for Engine 1 (Current Search - useKNN: false) ---
      const startTime1 = performance.now();
      const response1 = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textQuery || undefined, // Send empty string as undefined
          prompt_image: base64Image || undefined, // Send null as undefined
          useKNN: false,
        }),
      });
      const endTime1 = performance.now();
      const latency1 = endTime1 - startTime1;

      if (!response1.ok) {
        const errorData = await response1.json().catch(() => ({})); // Catch potential JSON parsing errors
        throw new Error(
          `Engine 1 failed: ${response1.statusText} ${errorData.error || ""}`
        );
      }
      const results1 = await response1.json();
      // Assuming API returns { images: string[] }
      setEngine1Results({ images: results1.images || [], latency: latency1 });

      // --- API Call for Engine 2 (KNN Search - useKNN: true) ---
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
      const latency2 = endTime2 - startTime2;

      if (!response2.ok) {
        const errorData = await response2.json().catch(() => ({}));
        throw new Error(
          `Engine 2 failed: ${response2.statusText} ${errorData.error || ""}`
        );
      }
      const results2 = await response2.json();
      setEngine2Results({ images: results2.images || [], latency: latency2 });
    } catch (err: any) {
      // Catch any error type
      console.error("Search failed:", err);
      // Display a more specific error if possible, otherwise generic
      setError(err.message || "Search failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-screen h-screen p-8 bg-black relative text-white">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
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
                  className="w-full p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                  value={textQuery}
                  onChange={(e) => {
                    setTextQuery(e.target.value);
                    setError(null);
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="image-input"
                  className="text-sm font-medium text-gray-300"
                >
                  Image Input {imageFile ? `(${imageFile.name})` : ""}
                </label>
                <label
                  htmlFor="image-input"
                  className="w-full p-3 h-[calc(3rem+2px)] flex items-center justify-center rounded-lg bg-gray-800 border border-gray-700 hover:border-gray-600 cursor-pointer relative overflow-hidden"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-auto object-contain absolute inset-0"
                    />
                  ) : (
                    <span className="text-gray-500 z-10">
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
            <div className="mb-6 flex items-center gap-4">
              <button
                type="submit"
                className={`px-6 py-2 rounded-lg text-white font-semibold transition-colors ${
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
            <div className="flex-1 border-t border-gray-700 pt-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-200">
                Search Results Comparison
              </h2>
              {isLoading && (
                <p className="text-center text-gray-400">Loading results...</p>
              )}
              {!isLoading &&
                !error &&
                engine1Results.images.length === 0 &&
                engine2Results.images.length === 0 && (
                  <p className="text-center text-gray-500">
                    Results will appear here after running a benchmark.
                  </p>
                )}
              {!isLoading &&
                (error ||
                  engine1Results.images.length > 0 ||
                  engine2Results.images.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-y-auto">
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                      <h3 className="text-lg font-medium mb-1 text-center text-gray-400">
                        Current search
                      </h3>
                      <p className="text-xs text-center text-gray-500 mb-2">
                        (Latency:{" "}
                        {engine1Results.latency
                          ? `${engine1Results.latency.toFixed(0)} ms`
                          : "N/A"}
                        )
                      </p>
                      <div className="flex-1 flex flex-wrap gap-2 justify-center content-start overflow-y-auto p-1">
                        {engine1Results.images.length > 0
                          ? engine1Results.images.map((imgUrl, index) => (
                              <img
                                key={`e1-${index}`}
                                src={imgUrl}
                                alt={`Engine 1 Result ${index + 1}`}
                                className="h-24 w-24 object-cover rounded border border-gray-600"
                              />
                            ))
                          : !error &&
                            !isLoading && (
                              <p className="text-gray-500 text-sm">
                                No results.
                              </p>
                            )}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col">
                      <h3 className="text-lg font-medium mb-1 text-center text-gray-400">
                        Built-in knn from ES
                      </h3>
                      <p className="text-xs text-center text-gray-500 mb-2">
                        (Latency:{" "}
                        {engine2Results.latency
                          ? `${engine2Results.latency.toFixed(0)} ms`
                          : "N/A"}
                        )
                      </p>
                      <div className="flex-1 flex flex-wrap gap-2 justify-center content-start overflow-y-auto p-1">
                        {engine2Results.images.length > 0
                          ? engine2Results.images.map((imgUrl, index) => (
                              <img
                                key={`e2-${index}`}
                                src={imgUrl}
                                alt={`Engine 2 Result ${index + 1}`}
                                className="h-24 w-24 object-cover rounded border border-gray-600"
                              />
                            ))
                          : !error &&
                            !isLoading && (
                              <p className="text-gray-500 text-sm">
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
    </div>
  );
}
