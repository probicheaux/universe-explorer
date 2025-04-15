import { NextRequest, NextResponse } from "next/server";
import Fuse from "fuse.js";
import {
  getPromptSuggestions,
  PromptSuggestion,
} from "@/adapters/redisAdapter";

// Cache the Fuse instance
let fuseInstance: Fuse<PromptSuggestion> | null = null;
let lastSuggestionsUpdate: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Function to get or create the Fuse instance
const getFuseInstance = async (): Promise<Fuse<PromptSuggestion>> => {
  const now = Date.now();

  // If we have a cached instance and it's not expired, return it
  if (fuseInstance && now - lastSuggestionsUpdate < CACHE_TTL) {
    console.log("Using cached Fuse instance");
    return fuseInstance;
  }

  // Otherwise, create a new instance
  console.log("Creating new Fuse instance");
  const suggestions = await getPromptSuggestions();

  fuseInstance = new Fuse(suggestions, {
    keys: ["text"],
    threshold: 0.4,
    minMatchCharLength: 1,
    ignoreLocation: true,
    useExtendedSearch: true,
  });

  lastSuggestionsUpdate = now;
  return fuseInstance;
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    console.log(`Searching for prompts matching: "${query}"`);

    // Get the cached or new Fuse instance
    const fuse = await getFuseInstance();

    // If query is empty, return empty array
    if (!query.trim()) {
      console.log("Empty query, returning empty array");
      return NextResponse.json([]);
    }

    // Search for matches
    const results = fuse.search(query);
    console.log(`Found ${results.length} matches for "${query}"`);

    // Return the matched suggestions
    return NextResponse.json(results.map((result) => result.item));
  } catch (error) {
    console.error("Error in suggestions route:", error);
    return NextResponse.json(
      { error: "Failed to get suggestions" },
      { status: 500 }
    );
  }
}
