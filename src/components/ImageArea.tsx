import React, { useEffect, useRef } from "react";
import Image from "next/image";

interface ImageAreaProps {
  image: string | undefined;
  onImageChange: ((imageData: string) => void) | undefined;
  onImageDimensionsChange?: (dimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
    containerX: number;
    containerY: number;
  }) => void;
}

export default function ImageArea({
  image,
  onImageChange,
  onImageDimensionsChange,
}: ImageAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastDimensionsRef = useRef<{
    width: number;
    height: number;
    x: number;
    y: number;
    containerX: number;
    containerY: number;
  } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && onImageChange) {
          onImageChange(e.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Add effect to notify parent of image dimensions
  useEffect(() => {
    const img = document.querySelector("img");
    if (!img) return undefined;

    const updateDimensions = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // Calculate the actual rendered dimensions based on object-contain behavior
      const containerRatio = containerRect.width / containerRect.height;
      const imageRatio = img.naturalWidth / img.naturalHeight;

      let renderedWidth, renderedHeight;
      if (imageRatio > containerRatio) {
        // Image is wider than container
        renderedWidth = containerRect.width;
        renderedHeight = renderedWidth / imageRatio;
      } else {
        // Image is taller than container
        renderedHeight = containerRect.height;
        renderedWidth = renderedHeight * imageRatio;
      }

      // Calculate the position of the rendered image (accounting for centering)
      const x = (containerRect.width - renderedWidth) / 2;
      const y = (containerRect.height - renderedHeight) / 2;

      const newDimensions = {
        width: renderedWidth,
        height: renderedHeight,
        x,
        y,
        containerX: containerRect.left,
        containerY: containerRect.top,
      };

      // Only update if dimensions have changed
      if (
        !lastDimensionsRef.current ||
        lastDimensionsRef.current.width !== newDimensions.width ||
        lastDimensionsRef.current.height !== newDimensions.height ||
        lastDimensionsRef.current.x !== newDimensions.x ||
        lastDimensionsRef.current.y !== newDimensions.y ||
        lastDimensionsRef.current.containerX !== newDimensions.containerX ||
        lastDimensionsRef.current.containerY !== newDimensions.containerY
      ) {
        // Clear any pending timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Debounce the update
        timeoutRef.current = setTimeout(() => {
          lastDimensionsRef.current = newDimensions;
          onImageDimensionsChange?.(newDimensions);
        }, 100);
      }
    };

    // Initial update
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(img);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onImageDimensionsChange]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {image ? (
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center"
        >
          <Image
            src={image}
            alt="Uploaded image"
            fill
            className="max-w-full max-h-full object-contain"
            priority
          />
        </div>
      ) : (
        <div className="text-center p-8">
          <div className="mb-4 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-400 mb-4">
            Drag and drop an image here, or click to select
          </p>
          <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors">
            Select Image
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleFileInput}
            />
          </label>
        </div>
      )}
    </div>
  );
}
