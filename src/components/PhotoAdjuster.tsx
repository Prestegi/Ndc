import React from 'react';
import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface PhotoAdjusterProps {
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export const PhotoAdjuster: React.FC<PhotoAdjusterProps> = ({
  zoom,
  minZoom = 1,
  maxZoom = 3,
  onZoomChange,
  onReset,
}) => {
  const step = 0.1;

  const handleZoomOut = () => {
    onZoomChange(Math.max(minZoom, Number((zoom - step).toFixed(2))));
  };

  const handleZoomIn = () => {
    onZoomChange(Math.min(maxZoom, Number((zoom + step).toFixed(2))));
  };

  return (
    <div className="w-full pt-3.5 border-t border-[#E6EBF3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[#44527A]">
        <Move className="w-4 h-4 text-[#0A226E] shrink-0" aria-hidden="true" />
        <span>Drag photo inside the circle to reposition</span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={zoom <= minZoom}
          aria-label="Zoom out"
          title="Zoom out"
          className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-[#DCE2EC] bg-[#F8FAFD] text-[#0A194E] hover:bg-[#EEF2F8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ZoomOut className="w-4 h-4" aria-hidden="true" />
        </button>

        <input
          type="range"
          min={minZoom}
          max={maxZoom}
          step={0.02}
          value={zoom}
          onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          aria-label="Photo zoom level"
          className="ndc-slider w-28 sm:w-36"
        />

        <button
          type="button"
          onClick={handleZoomIn}
          disabled={zoom >= maxZoom}
          aria-label="Zoom in"
          title="Zoom in"
          className="min-w-[38px] min-h-[38px] inline-flex items-center justify-center rounded-lg border border-[#DCE2EC] bg-[#F8FAFD] text-[#0A194E] hover:bg-[#EEF2F8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ZoomIn className="w-4 h-4" aria-hidden="true" />
        </button>

        <span className="text-xs font-semibold tabular-nums text-[#33447A] w-10 text-right">
          {zoom.toFixed(1)}x
        </span>

        <div className="h-5 w-px bg-[#DCE2EC]" aria-hidden="true" />

        <button
          type="button"
          onClick={onReset}
          className="min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE2EC] bg-[#F8FAFD] text-xs font-semibold text-[#0A194E] hover:bg-[#EEF2F8] whitespace-nowrap transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
