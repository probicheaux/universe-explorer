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
 * Calculate the center point of a box
 */
function getBoxCenter(box: Box): { x: number; y: number } {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

/**
 * Calculate the distance between two points
 */
function getDistance(
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number {
  return Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
}

/**
 * Calculate the aspect ratio of a box
 */
function getAspectRatio(box: Box): number {
  return box.width / box.height;
}

/**
 * Calculate the similarity between two boxes based on position and shape
 * @param box1 First box
 * @param box2 Second box
 * @param imageWidth Width of the image (for normalization)
 * @param imageHeight Height of the image (for normalization)
 * @returns A score between 0 and 1, where 1 is a perfect match
 */
function calculateBoxSimilarity(
  box1: Box,
  box2: Box,
  imageWidth: number,
  imageHeight: number
): number {
  // Calculate center points
  const center1 = getBoxCenter(box1);
  const center2 = getBoxCenter(box2);

  // Calculate distance between centers (normalized by image diagonal)
  const imageDiagonal = Math.sqrt(
    Math.pow(imageWidth, 2) + Math.pow(imageHeight, 2)
  );
  const distance = getDistance(center1, center2);
  const normalizedDistance = Math.min(1, distance / (imageDiagonal * 0.5));

  // Calculate position similarity (inverse of normalized distance)
  const positionSimilarity = 1 - normalizedDistance;

  // Calculate aspect ratio similarity
  const aspectRatio1 = getAspectRatio(box1);
  const aspectRatio2 = getAspectRatio(box2);
  const aspectRatioDiff = Math.abs(aspectRatio1 - aspectRatio2);
  const aspectRatioSimilarity = Math.max(0, 1 - aspectRatioDiff);

  // Calculate size similarity (prefer boxes of similar size)
  const area1 = getBoxArea(box1);
  const area2 = getBoxArea(box2);

  // Calculate width and height similarity separately
  const widthRatio =
    Math.min(box1.width, box2.width) / Math.max(box1.width, box2.width);
  const heightRatio =
    Math.min(box1.height, box2.height) / Math.max(box1.height, box2.height);
  const dimensionSimilarity = (widthRatio + heightRatio) / 2;

  // Calculate intersection over union
  const intersection = getIntersectionArea(box1, box2);
  const union = area1 + area2 - intersection;
  const iou = intersection / union;

  // Combine all factors with adjusted weights
  // Give more weight to dimensional similarity and IoU
  return (
    positionSimilarity * 0.2 + // Position matters less
    iou * 0.3 + // IoU is still important
    aspectRatioSimilarity * 0.1 + // Shape similarity matters less
    dimensionSimilarity * 0.4 // Dimensional similarity matters most
  );
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

  // If there are no model predictions, return 0
  if (modelBoxes.length === 0) {
    return 0;
  }

  // Estimate image dimensions from the boxes
  // This is a rough estimate and could be improved
  const maxX = Math.max(
    ...convertedDrawnBoxes.map((box) => box.x + box.width),
    ...modelBoxes.map((box) => box.x + box.width)
  );
  const maxY = Math.max(
    ...convertedDrawnBoxes.map((box) => box.y + box.height),
    ...modelBoxes.map((box) => box.y + box.height)
  );
  const imageWidth = maxX;
  const imageHeight = maxY;

  // For each drawn box, find the best matching model box
  const matchScores: number[] = [];
  const matchDetails: { drawnBox: Box; bestMatch: Box; score: number }[] = [];

  for (const drawnBox of convertedDrawnBoxes) {
    let bestMatchScore = 0;
    let bestMatchBox: Box | null = null;

    for (const modelBox of modelBoxes) {
      const similarity = calculateBoxSimilarity(
        drawnBox,
        modelBox,
        imageWidth,
        imageHeight
      );

      if (similarity > bestMatchScore) {
        bestMatchScore = similarity;
        bestMatchBox = modelBox;
      }
    }

    matchScores.push(bestMatchScore);

    if (bestMatchBox) {
      matchDetails.push({
        drawnBox,
        bestMatch: bestMatchBox,
        score: bestMatchScore,
      });
    }
  }

  // Calculate the average match score and convert to percentage
  const averageMatchScore =
    matchScores.reduce((sum, score) => sum + score, 0) / matchScores.length;

  const finalScore = Math.round(averageMatchScore * 100);

  return finalScore;
}
