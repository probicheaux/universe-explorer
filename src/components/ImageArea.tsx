import { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ImageAreaProps {
  image: string | undefined;
  onImageChange: ((imageData: string) => void) | undefined;
  onImageDimensionsChange?: (dimensions: {
    width: number;
    height: number;
    x: number;
    y: number;
  }) => void;
}

export default function ImageArea({
  image,
  onImageChange,
  onImageDimensionsChange,
}: ImageAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

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
    if (image && imageContainerRef.current) {
      const updateDimensions = () => {
        const img = imageContainerRef.current?.querySelector("img");
        if (img) {
          const rect = img.getBoundingClientRect();
          onImageDimensionsChange?.({
            width: rect.width,
            height: rect.height,
            x: rect.left,
            y: rect.top,
          });
        }
      };

      // Initial update
      updateDimensions();

      // Set up resize observer
      const resizeObserver = new ResizeObserver(updateDimensions);
      if (imageContainerRef.current) {
        resizeObserver.observe(imageContainerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [image, onImageDimensionsChange]);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${
        isDragging ? "bg-gray-800/50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {image ? (
        <div
          ref={imageContainerRef}
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
