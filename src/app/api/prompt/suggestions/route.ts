import { NextResponse } from "next/server";
import {
  getPromptSuggestions,
  PromptSuggestion,
} from "@/adapters/redisAdapter";
import Fuse, { FuseResult } from "fuse.js";

interface CacheResult {
  fuse: Fuse<PromptSuggestion>;
  prompts: PromptSuggestion[];
}

// Cache the Fuse instance
let fuseInstance: Fuse<PromptSuggestion> | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 60000; // 1 minute

async function updateFuseCache(): Promise<CacheResult> {
  const now = Date.now();
  if (fuseInstance && now - lastCacheUpdate < CACHE_TTL) {
    console.log("Using cached Fuse instance");
    return { fuse: fuseInstance, prompts: [] }; // We don't need prompts for cached instance
  }

  console.log("Fetching prompts from Redis");
  const prompts = await getPromptSuggestions();
  console.log(`Found ${prompts.length} prompts in Redis`);

  if (prompts.length > 0) {
    console.log(
      "Sample prompts:",
      prompts.slice(0, 3).map((p) => p.text)
    );
  }

  fuseInstance = new Fuse(prompts, {
    keys: ["text"],
    threshold: 0.4,
    includeScore: true,
    minMatchCharLength: 1,
    useExtendedSearch: true,
    ignoreLocation: true,
  });

  lastCacheUpdate = now;
  return { fuse: fuseInstance, prompts };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    console.log(`Search query: "${query}"`);

    if (!query) {
      // Return most recent prompts if no query
      console.log("No query provided, returning most recent prompts");
      const { prompts } = await updateFuseCache();
      const results = prompts.slice(0, 5);
      console.log(`Returning ${results.length} recent prompts`);
      return NextResponse.json(results);
    }

    // Get cached Fuse instance and search
    console.log("Searching for matches");
    const { fuse } = await updateFuseCache();
    const results = fuse.search(query);
    console.log(`Found ${results.length} matches for "${query}"`);

    if (results.length > 0) {
      console.log(
        "Top matches:",
        results.slice(0, 3).map((r) => ({
          text: r.item.text,
          score: r.score,
        }))
      );
    }

    return NextResponse.json(
      results
        .slice(0, 5)
        .map((result: FuseResult<PromptSuggestion>) => result.item)
    );
  } catch (error) {
    console.error("Error fetching prompt suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
