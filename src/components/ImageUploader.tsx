"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";

interface ImageUploaderProps {
  onImageChange: (base64Image: string) => void;
}

export default function ImageUploader({ onImageChange }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      alert("Please upload a valid image file (JPEG, PNG, or WebP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target?.result as string;
      setPreviewUrl(base64String);
      onImageChange(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className={`w-full h-80 rounded-lg border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center cursor-pointer
        ${
          isDragging
            ? "border-gray-600 bg-gray-900/50"
            : "border-gray-800 hover:border-gray-700 hover:bg-gray-900/30"
        }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {previewUrl ? (
        <div className="relative w-full h-full">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-full object-contain rounded-lg"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 hover:opacity-100 transition-opacity">
            <p className="text-white text-sm font-light">
              Click or drop to change image
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6">
          <svg
            className="w-12 h-12 mb-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-300 mb-2 font-light">
            Drag and drop your image here
          </p>
          <p className="text-xs text-gray-500 font-light">or click to browse</p>
          <p className="text-xs text-gray-500 mt-2 font-light">
            Supports: JPEG, PNG, WebP
          </p>
        </div>
      )}
    </div>
  );
}
