import Fuse from "fuse.js";

// Cache for Fuse instances to avoid recreating them
const fuseCache = new Map<string, Fuse<any>>();

/**
 * Get or create a Fuse instance for fuzzy searching
 * @param items Items to search through
 * @param keys Keys to search in
 * @param id Unique identifier for caching
 * @returns Fuse instance
 */
export function getFuseInstance<T>(
  items: T[],
  keys: string[],
  id: string
): Fuse<T> {
  const cacheKey = `${id}-${keys.join(",")}`;

  if (!fuseCache.has(cacheKey)) {
    const fuse = new Fuse(items, {
      keys,
      threshold: 0.7,
      includeScore: true,
    });
    fuseCache.set(cacheKey, fuse);
  }

  return fuseCache.get(cacheKey) as Fuse<T>;
}

// Calculate metadata score based on class matches
export function calculateMetadataScore(
  model: any,
  searchClasses: string[]
): number {
  if (!searchClasses || searchClasses.length === 0) {
    return 0;
  }

  // Initialize metadata match score
  let metadataScore = 0;

  // 1. Check class matches (highest weight)
  if (model.class_counts && model.class_counts.length > 0) {
    // Create a Fuse instance for class names
    const classFuse = getFuseInstance(
      model.class_counts.map((c: { name: string }) => ({ name: c.name })),
      ["name"],
      `class-${model.id}`
    );

    // Search for each class in the model's classes
    for (const searchClass of searchClasses) {
      const searchResults = classFuse.search(searchClass);

      if (searchResults.length > 0) {
        // Get the best match score (lower is better in Fuse)
        const bestMatch = searchResults[0];
        const matchScore = bestMatch.score || 0;

        // Convert to a 0-100 score (higher is better)
        const normalizedScore = Math.max(0, 100 - matchScore * 100);

        // Find the matching class to get its count
        const matchingClass = model.class_counts.find(
          (c: { name: string }) =>
            c.name.toLowerCase() ===
            (bestMatch.item as { name: string }).name.toLowerCase()
        );

        // Weight based on how many annotations exist for this class
        // More annotations = higher weight
        let classWeight = 1.0;
        if (matchingClass) {
          // Scale the weight based on the number of annotations
          // Cap at 2.0 to avoid overwhelming the box overlap score
          classWeight = Math.min(2.0, 1.0 + matchingClass.count / 10000);
        }

        // Add to metadata score with high weight (0.7)
        metadataScore += normalizedScore * 0.7 * classWeight;
      }
    }
  }

  // 2. Check model name (medium weight)
  if (model.name) {
    // Create a Fuse instance for the model name
    const nameFuse = getFuseInstance(
      [{ name: model.name }],
      ["name"],
      `name-${model.id}`
    );

    for (const searchClass of searchClasses) {
      const searchResults = nameFuse.search(searchClass);

      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const matchScore = bestMatch.score || 0;
        const normalizedScore = Math.max(0, 100 - matchScore * 100);

        // Add to metadata score with medium weight (0.3)
        metadataScore += normalizedScore * 0.3;
      }
    }
  }

  // 3. Check model description (lower weight)
  if (model.description) {
    // Create a Fuse instance for the model description
    const descFuse = getFuseInstance(
      [{ description: model.description }],
      ["description"],
      `desc-${model.id}`
    );

    for (const searchClass of searchClasses) {
      const searchResults = descFuse.search(searchClass);

      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const matchScore = bestMatch.score || 0;
        const normalizedScore = Math.max(0, 100 - matchScore * 100);

        // Add to metadata score with lower weight (0.2)
        metadataScore += normalizedScore * 0.2;
      }
    }
  }

  // Normalize metadata score to 0-100 range
  return Math.min(100, metadataScore);
}
