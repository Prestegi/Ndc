import React from 'react';
import { Loader2 } from 'lucide-react';
import { PhotoTransform } from '../utils/posterRenderer';
import { PosterCanvas } from './PosterCanvas';

interface PosterPreviewProps {
  posterImage: HTMLImageElement | null;
  ringOverlayCanvas: HTMLCanvasElement | null;
  posterError: string | null;
  userPhoto: HTMLImageElement | null;
  transform: PhotoTransform;
  fullName: string;
  onTransformChange: (next: PhotoTransform) => void;
  onEmptyCircleClick: () => void;
  onFileDrop: (file: File) => void;
}

export const PosterPreview: React.FC<PosterPreviewProps> = ({
  posterImage,
  ringOverlayCanvas,
  posterError,
  userPhoto,
  transform,
  fullName,
  onTransformChange,
  onEmptyCircleClick,
  onFileDrop,
}) => {
  return (
    <section aria-label="Live poster preview" className="w-full flex flex-col items-center">
      <div className="w-full max-w-[620px] rounded-2xl bg-white p-2 sm:p-3 border border-[#DCE2EC] shadow-[0_12px_36px_rgba(10,25,78,0.08)]">
        {posterError ? (
          <div className="w-full aspect-[1088/1445] rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center p-6 text-center text-sm font-medium text-[#991B1B]">
            {posterError}
          </div>
        ) : !posterImage || !ringOverlayCanvas ? (
          <div className="w-full aspect-[1088/1445] rounded-xl bg-[#F8FAFD] flex flex-col items-center justify-center gap-3 text-[#44527A]">
            <Loader2 className="w-7 h-7 animate-spin text-[#0A226E]" aria-hidden="true" />
            <span className="text-sm font-medium">Loading NDC campaign poster...</span>
          </div>
        ) : (
          <PosterCanvas
            posterImage={posterImage}
            ringOverlayCanvas={ringOverlayCanvas}
            userPhoto={userPhoto}
            transform={transform}
            fullName={fullName}
            onTransformChange={onTransformChange}
            onEmptyCircleClick={onEmptyCircleClick}
            onFileDrop={onFileDrop}
          />
        )}
      </div>
    </section>
  );
};
