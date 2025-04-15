import { InferImageResponse } from "@/adapters/roboflowAdapter";

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  class?: string;
}

interface ImageDimensions {
  width: number;
  height: number;
  x: number;
  y: number;
}

/**
 * Convert a box from rendered image coordinates to original image coordinates
 */
function convertToOriginalImageCoordinates(
  box: Box,
  imageDimensions: ImageDimensions,
  originalWidth: number,
  originalHeight: number
): Box {
  // First remove the offset to get coordinates relative to the image content
  const xWithoutOffset = box.x - imageDimensions.x;
  const yWithoutOffset = box.y - imageDimensions.y;

  // Then reverse the scaling to get back to original image coordinates
  const scaleX = originalWidth / imageDimensions.width;
  const scaleY = originalHeight / imageDimensions.height;

  return {
    x: xWithoutOffset * scaleX,
    y: yWithoutOffset * scaleY,
    width: box.width * scaleX,
    height: box.height * scaleY,
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
 * @param imageDimensions The dimensions of the rendered image
 * @returns The match percentage (0-100)
 */
export function calculateMatchPercentage(
  drawnBoxes: Box[],
  modelResult: InferImageResponse | undefined,
  imageDimensions: ImageDimensions
): number {
  if (!modelResult || !modelResult.predictions || drawnBoxes.length === 0) {
    return 0;
  }

  // Convert drawn boxes to original image coordinates
  const convertedDrawnBoxes = drawnBoxes.map((box) =>
    convertToOriginalImageCoordinates(
      box,
      imageDimensions,
      modelResult.image.width,
      modelResult.image.height
    )
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

  // Calculate match percentage
  const matchPercentage = (totalIntersectionArea / totalDrawnArea) * 100;
  return Math.round(matchPercentage);
}
