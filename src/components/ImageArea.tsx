import { useRef } from "react";

interface ImageAreaProps {
  image?: string;
  onImageChange: (image: string) => void;
  isAnnotationMode?: boolean;
}

export default function ImageArea({
  image,
  onImageChange,
  isAnnotationMode = false,
}: ImageAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    // Only trigger file upload if not in annotation mode
    if (!isAnnotationMode && fileInputRef.current) {
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

  const handleChangeImageClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the image click handler
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={`relative flex-grow ${
        !isAnnotationMode ? "cursor-pointer" : ""
      } group`}
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

          {/* Change Image Button - Only show in annotation mode */}
          {isAnnotationMode && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleChangeImageClick}
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
          )}

          {/* Hover Overlay - Only show when not in annotation mode */}
          {!isAnnotationMode && (
            <div className="absolute inset-0 bg-gray-950/0 group-hover:bg-gray-950/40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="bg-gray-900/80 px-4 py-2 rounded-lg text-gray-300 text-sm transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                Click to change image
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Click to upload an image
        </div>
      )}
    </div>
  );
}
