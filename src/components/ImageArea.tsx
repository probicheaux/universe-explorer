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
    if (!img) return;

    const updateDimensions = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        x: containerRect.left,
        y: containerRect.top,
        containerX: containerRect.left,
        containerY: containerRect.top,
      };

      onImageDimensionsChange?.(dimensions);
    };

    // Initial update
    updateDimensions();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(img);

    // Cleanup
    return () => {
      resizeObserver.disconnect();
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
