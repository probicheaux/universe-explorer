import Fuse from "fuse.js";

// Cache for Fuse instances to avoid recreating them
const fuseCache = new Map<string, Fuse<any>>();

/**
 * Get or create a Fuse instance for fuzzy searching
 * @param items Items to search through
 * @param keys Keys to search in
 * @param id Unique identifier for caching
 * @param threshold Optional threshold for fuzzy matching (lower = more strict)
 * @returns Fuse instance
 */
export function getFuseInstance<T>(
  items: T[],
  keys: string[],
  id: string,
  threshold: number = 0.7
): Fuse<T> {
  const cacheKey = `${id}-${keys.join(",")}-${threshold}`;

  if (!fuseCache.has(cacheKey)) {
    const fuse = new Fuse(items, {
      keys,
      threshold,
      includeScore: true,
    });
    fuseCache.set(cacheKey, fuse);
  }

  return fuseCache.get(cacheKey) as Fuse<T>;
}

// Calculate metadata score based on class matches
export function calculateMetadataScore(model: any, classes: string[]): number {
  if (!classes || classes.length === 0) {
    return 0;
  }

  // Initialize metadata match score
  let metadataScore = 0;
  let matchedClasses = 0;
  let classMatchDetails: {
    class: string;
    score: number;
    weight: number;
    exactMatch: boolean;
  }[] = [];

  // 1. Check class matches (highest weight)
  if (model.class_counts && model.class_counts.length > 0) {
    // First try exact matches (case-insensitive)
    for (const searchClass of classes) {
      const exactMatch = model.class_counts.some(
        (c: { name: string }) =>
          c.name.toLowerCase() === searchClass.toLowerCase()
      );

      if (exactMatch) {
        // Exact match gets a perfect score
        const normalizedScore = 100;

        // Find the matching class to get its count
        const matchingClass = model.class_counts.find(
          (c: { name: string }) =>
            c.name.toLowerCase() === searchClass.toLowerCase()
        );

        // Weight based on how many annotations exist for this class
        let classWeight = 1.0;
        if (matchingClass) {
          // Scale the weight based on the number of annotations
          // Cap at 2.0 to avoid overwhelming the box overlap score
          classWeight = Math.min(2.0, 1.0 + matchingClass.count / 10000);
        }

        // Add to metadata score with high weight (0.8)
        const classContribution = normalizedScore * 0.8 * classWeight;
        metadataScore += classContribution;
        matchedClasses++;

        continue; // Skip fuzzy search for this class
      }
    }

    // Then try fuzzy matches for classes that didn't have exact matches
    // Use a more strict threshold for fuzzy matching
    const classFuse = getFuseInstance(
      model.class_counts.map((c: { name: string }) => ({ name: c.name })),
      ["name"],
      `class-${model.id}`,
      0.6 // More strict threshold
    );

    // Search for each class in the model's classes
    for (const searchClass of classes) {
      // Skip if we already found an exact match for this class
      if (classMatchDetails.some((detail) => detail.class === searchClass)) {
        continue;
      }

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

        // Add to metadata score with high weight (0.8)
        const classContribution = normalizedScore * 0.8 * classWeight;
        metadataScore += classContribution;
        matchedClasses++;
      }
    }
  }

  // 2. Check model name (medium weight)
  let nameScore = 0;
  if (model.name) {
    // First try exact match in model name
    const modelNameLower = model.name.toLowerCase();
    const hasExactNameMatch = classes.some((cls) =>
      modelNameLower.includes(cls.toLowerCase())
    );

    if (hasExactNameMatch) {
      nameScore = 100 * 0.1; // Perfect score for exact match
    } else {
      // Use a more strict threshold for fuzzy name matching
      const nameFuse = getFuseInstance(
        [{ name: model.name }],
        ["name"],
        `name-${model.id}`,
        0.5 // Very strict threshold
      );

      for (const searchClass of classes) {
        const searchResults = nameFuse.search(searchClass);

        if (searchResults.length > 0) {
          const bestMatch = searchResults[0];
          const matchScore = bestMatch.score || 0;
          const normalizedScore = Math.max(0, 100 - matchScore * 100);

          nameScore += normalizedScore * 0.1;
        }
      }
    }
  }

  metadataScore += nameScore;

  // 3. Check model description (lower weight)
  let descriptionScore = 0;
  if (model.description) {
    // Use a more strict threshold for description matching
    const descFuse = getFuseInstance(
      [{ description: model.description }],
      ["description"],
      `desc-${model.id}`,
      0.6 // More strict threshold
    );

    for (const searchClass of classes) {
      const searchResults = descFuse.search(searchClass);

      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        const matchScore = bestMatch.score || 0;
        const normalizedScore = Math.max(0, 100 - matchScore * 100);

        // Add to metadata score with lower weight (0.1)
        descriptionScore += normalizedScore * 0.1;
      }
    }
  }

  metadataScore += descriptionScore;

  // 4. Check if the model is specifically focused on the search classes
  // This helps differentiate between specialized models and general datasets
  let specializationScore = 0;
  if (model.class_counts && model.class_counts.length > 0) {
    // Calculate the ratio of matched classes to total classes in the model
    const totalModelClasses = model.class_counts.length;
    const matchRatio = matchedClasses / totalModelClasses;

    // Calculate the ratio of matched classes to search classes
    const searchMatchRatio = matchedClasses / classes.length;

    // Models that have a high match ratio (most of their classes match our search)
    // and a high search match ratio (they match most of our search classes)
    // are likely specialized for our use case
    specializationScore = (matchRatio * 0.6 + searchMatchRatio * 0.4) * 100;

    // Add specialization score to metadata score with medium weight
    const specializationContribution = specializationScore * 0.3;
    metadataScore += specializationContribution;
  }

  // 5. Check if the model has a high number of classes
  // Models with too many classes might be general datasets rather than specialized ones
  let classCountPenalty = 0;
  if (model.class_counts && model.class_counts.length > 0) {
    const totalClasses = model.class_counts.length;

    // Penalize models with too many classes (likely general datasets)
    // This helps prioritize specialized models
    if (totalClasses > 20) {
      // Start penalizing earlier and more aggressively
      classCountPenalty = Math.min(40, (totalClasses - 20) / 2);
    }

    metadataScore = Math.max(0, metadataScore - classCountPenalty);
  }

  // 6. Apply a significant penalty for models that don't match any search classes
  if (matchedClasses === 0) {
    // If no classes match, apply a significant penalty
    const noMatchPenalty = 50;
    metadataScore = Math.max(0, metadataScore - noMatchPenalty);
  }

  // Normalize metadata score to 0-100 range
  const finalScore = Math.min(100, metadataScore);

  return finalScore;
}
