import { useRef } from "react";

interface ImageAreaProps {
  image?: string;
  onImageChange: (image: string) => void;
}

export default function ImageArea({ image, onImageChange }: ImageAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Image = event.target?.result as string;
        onImageChange(base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div
      className="relative flex-grow cursor-pointer group"
      onClick={handleImageClick}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      {image ? (
        <>
          <img
            src={image}
            alt="Uploaded"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gray-950/0 group-hover:bg-gray-950/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-gray-900/80 px-4 py-2 rounded-lg text-gray-300 text-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
              Click to change image
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Click to upload an image
        </div>
      )}
    </div>
  );
}
