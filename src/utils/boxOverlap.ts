import { InferImageResponse } from "@/adapters/roboflowAdapter";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  class?: string;
}

/**
 * Convert a box from rendered image coordinates to original image coordinates
 */
function convertToOriginalImageCoordinates(
  box: Box,
  scale: { x: number; y: number },
  offset: { x: number; y: number }
): Box {
  // First remove the offset to get coordinates relative to the image content
  const xWithoutOffset = box.x - scale.x * offset.x + (box.width * scale.x) / 2;
  const yWithoutOffset =
    box.y - scale.y * offset.y + (box.height * scale.y) / 2;

  // Then reverse the scaling to get back to original image coordinates
  const x = xWithoutOffset / scale.x;
  const y = yWithoutOffset / scale.y;

  return {
    x,
    y,
    width: box.width / scale.x,
    height: box.height / scale.y,
  };
}

/**
 * Calculate the intersection area between two boxes
 */
function getIntersectionArea(box1: Box, box2: Box): number {
  const x1 = Math.max(box1.x, box2.x);
  const y1 = Math.max(box1.y, box2.y);
  const x2 = Math.min(box1.x + box1.width, box2.x + box2.width);
  const y2 = Math.min(box1.y + box1.height, box2.y + box2.height);

  if (x2 < x1 || y2 < y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

/**
 * Calculate the area of a box
 */
function getBoxArea(box: Box): number {
  return box.width * box.height;
}

/**
 * Calculate the match percentage between drawn boxes and model prediction boxes
 * @param drawnBoxes The boxes drawn by the user (in rendered image coordinates)
 * @param modelResult The inference result from a model (in original image coordinates)
 * @param scale The scale of the rendered image
 * @param offset The offset of the rendered image
 * @returns The match percentage (0-100)
 */
export function calculateBoxOverlap(
  drawnBoxes: Box[],
  modelResult: InferImageResponse | undefined,
  scale: { x: number; y: number },
  offset: { x: number; y: number }
): number {
  if (!modelResult || !modelResult.predictions || drawnBoxes.length === 0) {
    return 0;
  }

  // Convert drawn boxes to original image coordinates
  const convertedDrawnBoxes = drawnBoxes.map((box) =>
    convertToOriginalImageCoordinates(box, scale, offset)
  );

  // Model boxes are already in original image coordinates
  const modelBoxes = modelResult.predictions.map((pred) => ({
    x: pred.x,
    y: pred.y,
    width: pred.width,
    height: pred.height,
  }));

  // Calculate total area of drawn boxes
  const totalDrawnArea = convertedDrawnBoxes.reduce(
    (sum, box) => sum + getBoxArea(box),
    0
  );
  if (totalDrawnArea === 0) return 0;

  // Calculate total intersection area
  let totalIntersectionArea = 0;

  for (const drawnBox of convertedDrawnBoxes) {
    let maxIntersection = 0;

    for (const modelBox of modelBoxes) {
      const intersection = getIntersectionArea(drawnBox, modelBox);
      maxIntersection = Math.max(maxIntersection, intersection);
    }

    totalIntersectionArea += maxIntersection;
  }

  // Calculate base match percentage from area overlap
  const baseMatchPercentage = (totalIntersectionArea / totalDrawnArea) * 100;

  // Apply penalties based on box count difference
  const boxCountDifference = Math.abs(
    convertedDrawnBoxes.length - modelBoxes.length
  );
  const boxCountPenalty = Math.min(boxCountDifference * 10, 50); // Max 50% penalty

  // Apply penalties based on size distribution
  const drawnBoxSizes = convertedDrawnBoxes.map((box) => getBoxArea(box));
  const modelBoxSizes = modelBoxes.map((box) => getBoxArea(box));

  // Calculate average size difference
  const avgDrawnSize =
    drawnBoxSizes.reduce((sum, size) => sum + size, 0) / drawnBoxSizes.length;
  const avgModelSize =
    modelBoxSizes.reduce((sum, size) => sum + size, 0) / modelBoxSizes.length;

  // Calculate size difference penalty (up to 30%)
  const sizeDifferencePenalty = Math.min(
    (Math.abs(avgDrawnSize - avgModelSize) /
      Math.max(avgDrawnSize, avgModelSize)) *
      30,
    30
  );

  // Calculate final match percentage with penalties
  const finalMatchPercentage = Math.max(
    0,
    baseMatchPercentage - boxCountPenalty - sizeDifferencePenalty
  );

  return Math.round(finalMatchPercentage);
}
