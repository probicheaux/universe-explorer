"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";

interface ImageUploaderProps {
  onImageUpload: (imageData: string) => void;
}

export default function ImageUploader({ onImageUpload }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = async (file: File) => {
    if (file.type.startsWith("image/")) {
      try {
        // Create an image element to get dimensions first
        const img = new window.Image();
        const imageUrl = URL.createObjectURL(file);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        // Calculate target dimensions
        let targetWidth = img.width;
        let targetHeight = img.height;
        if (img.height > 1000) {
          const aspectRatio = img.width / img.height;
          targetHeight = 1000;
          targetWidth = Math.round(targetHeight * aspectRatio);
        }

        // Compression options - use calculated dimensions
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: Math.max(targetWidth, targetHeight),
          useWebWorker: true,
          initialQuality: 0.8,
        };

        // Compress the image
        const compressedFile = await imageCompression(file, options);

        // Create a reader for the compressed file
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const imageData = e.target.result as string;
            setPreview(imageData);
            onImageUpload(imageData);
          }
        };
        reader.readAsDataURL(compressedFile);

        // Clean up
        URL.revokeObjectURL(imageUrl);
      } catch (error) {
        console.error("Error processing image:", error);
        // Fallback to original file if processing fails
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            const imageData = e.target.result as string;
            setPreview(imageData);
            onImageUpload(imageData);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      className={`w-full h-full flex items-center justify-center ${
        isDragging ? "bg-gray-800/50" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {preview ? (
        <div className="relative w-full h-full">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="max-w-full max-h-full object-contain"
            priority
          />
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-900/80 hover:bg-gray-800/90 text-gray-300 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 hover:cursor-pointer hover:scale-110 transition-all duration-200 hover:shadow-lg hover:opacity-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
              Change Image
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
            ref={fileInputRef}
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
              ref={fileInputRef}
            />
          </label>
        </div>
      )}
    </div>
  );
}
