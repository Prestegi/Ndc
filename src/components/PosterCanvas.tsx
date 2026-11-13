import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import {
  CIRCLE_CENTER_X,
  CIRCLE_CENTER_Y,
  CIRCLE_INNER_RX,
  CIRCLE_INNER_RY,
  POSTER_HEIGHT,
  POSTER_WIDTH,
  PhotoTransform,
  PosterRenderState,
  clampPhotoOffset,
  renderPosterToCanvas,
} from '../utils/posterRenderer';

interface PosterCanvasProps {
  posterImage: HTMLImageElement | null;
  ringOverlayCanvas: HTMLCanvasElement | null;
  userPhoto: HTMLImageElement | null;
  transform: PhotoTransform;
  fullName: string;
  onTransformChange: (next: PhotoTransform) => void;
  onEmptyCircleClick: () => void;
  onFileDrop: (file: File) => void;
}

// Percentage bounding box of the central circle on the 1088x1445 poster
const CIRCLE_LEFT_PCT = ((CIRCLE_CENTER_X - CIRCLE_INNER_RX) / POSTER_WIDTH) * 100;
const CIRCLE_TOP_PCT = ((CIRCLE_CENTER_Y - CIRCLE_INNER_RY) / POSTER_HEIGHT) * 100;
const CIRCLE_WIDTH_PCT = ((CIRCLE_INNER_RX * 2) / POSTER_WIDTH) * 100;
const CIRCLE_HEIGHT_PCT = ((CIRCLE_INNER_RY * 2) / POSTER_HEIGHT) * 100;

export const PosterCanvas: React.FC<PosterCanvasProps> = ({
  posterImage,
  ringOverlayCanvas,
  userPhoto,
  transform,
  fullName,
  onTransformChange,
  onEmptyCircleClick,
  onFileDrop,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [displayWidth, setDisplayWidth] = useState<number>(600);
  const [isDragging, setIsDragging] = useState(false);
  const [isFileHovering, setIsFileHovering] = useState(false);

  const dragOriginRef = useRef<{
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Track container width for crisp DevicePixelRatio canvas rendering
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      const w = el.clientWidth;
      if (w > 0) setDisplayWidth(w);
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Re-render live preview canvas whenever state or dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !posterImage || !ringOverlayCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetScale = Math.max(0.4, (displayWidth * dpr) / POSTER_WIDTH);

    const state: PosterRenderState = {
      posterImage,
      ringOverlayCanvas,
      userPhoto,
      transform,
      fullName,
    };

    let cancelled = false;
    const draw = () => {
      if (!cancelled) {
        renderPosterToCanvas(canvas, state, targetScale);
      }
    };

    draw();
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(draw);
    }

    return () => {
      cancelled = true;
    };
  }, [posterImage, ringOverlayCanvas, userPhoto, transform, fullName, displayWidth]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!userPhoto) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragOriginRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: transform.offsetX,
      offsetY: transform.offsetY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragOriginRef.current || !containerRef.current || !userPhoto) return;

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPoster = ((e.clientX - dragOriginRef.current.clientX) / rect.width) * POSTER_WIDTH;
    const dyPoster = ((e.clientY - dragOriginRef.current.clientY) / rect.height) * POSTER_HEIGHT;

    const clamped = clampPhotoOffset(
      userPhoto,
      transform.zoom,
      dragOriginRef.current.offsetX + dxPoster,
      dragOriginRef.current.offsetY + dyPoster
    );

    onTransformChange({
      zoom: transform.zoom,
      offsetX: clamped.offsetX,
      offsetY: clamped.offsetY,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      dragOriginRef.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!userPhoto) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.08 : -0.08;
    const nextZoom = Math.min(3, Math.max(1, Number((transform.zoom + delta).toFixed(2))));
    const clamped = clampPhotoOffset(
      userPhoto,
      nextZoom,
      transform.offsetX,
      transform.offsetY
    );
    onTransformChange({
      zoom: nextZoom,
      offsetX: clamped.offsetX,
      offsetY: clamped.offsetY,
    });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileHovering(true);
  };

  const handleDragLeave = () => {
    setIsFileHovering(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsFileHovering(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDrop(file);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-white select-none"
      style={{ aspectRatio: `${POSTER_WIDTH} / ${POSTER_HEIGHT}` }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        aria-label="Live NDC campaign poster preview"
      />

      {/* Interactive circular hit-target aligned precisely over the central frame */}
      <div
        role={userPhoto ? 'application' : 'button'}
        tabIndex={0}
        aria-label={
          userPhoto
            ? 'Drag to reposition your photograph inside the circular frame'
            : 'Click or drop an image here to add your photograph'
        }
        onClick={() => {
          if (!userPhoto) onEmptyCircleClick();
        }}
        onKeyDown={(e) => {
          if (!userPhoto && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onEmptyCircleClick();
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          left: `${CIRCLE_LEFT_PCT}%`,
          top: `${CIRCLE_TOP_PCT}%`,
          width: `${CIRCLE_WIDTH_PCT}%`,
          height: `${CIRCLE_HEIGHT_PCT}%`,
          touchAction: userPhoto ? 'none' : 'auto',
        }}
        className={`absolute rounded-full flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#0A226E] ${
          userPhoto
            ? isDragging
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-pointer hover:bg-[#0A226E]/[0.04]'
        } ${isFileHovering ? 'bg-[#0A226E]/10 ring-4 ring-[#D91E26]/40' : ''}`}
      >
        {!userPhoto && (
          <div className="pointer-events-none flex flex-col items-center justify-center text-center px-6 opacity-75">
            <div className="w-11 h-11 rounded-full bg-white/90 border border-[#CFD7E6] flex items-center justify-center mb-2 shadow-xs">
              <Upload className="w-5 h-5 text-[#0A226E]" aria-hidden="true" />
            </div>
            <span className="font-display font-bold text-xs sm:text-sm text-[#0A194E] tracking-wide">
              TAP TO ADD YOUR PHOTO
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
