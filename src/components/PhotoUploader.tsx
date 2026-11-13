import React, { useRef } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface PhotoUploaderProps {
  hasPhoto: boolean;
  onFileSelected: (file: File) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

const ACCEPTED_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp)$/i;

export function isValidPhotoFile(file: File): boolean {
  if (file.type && ACCEPTED_MIME_TYPES.has(file.type.toLowerCase())) {
    return true;
  }
  return ACCEPTED_EXTENSIONS.test(file.name);
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  hasPhoto,
  onFileSelected,
  inputRef: externalRef,
}) => {
  const internalRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = externalRef || internalRef;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
    // Allow selecting the same file again after reset
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
        aria-label="Upload your photograph (JPG, JPEG, PNG, or WEBP)"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={`w-full min-h-[48px] inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-lg font-display font-bold text-sm sm:text-base tracking-wide whitespace-nowrap transition-all duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
          hasPhoto
            ? 'bg-[#0A226E] text-white hover:bg-[#071850] active:scale-[0.99] focus-visible:outline-[#0A226E] shadow-sm'
            : 'bg-[#D91E26] text-white hover:bg-[#BC171E] active:scale-[0.99] focus-visible:outline-[#D91E26] shadow-sm'
        }`}
      >
        {hasPhoto ? (
          <>
            <RefreshCw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>CHANGE PHOTO</span>
          </>
        ) : (
          <>
            <Camera className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>ADD YOUR PHOTO</span>
          </>
        )}
      </button>
    </div>
  );
};
