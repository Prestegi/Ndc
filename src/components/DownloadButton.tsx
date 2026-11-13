import React from 'react';
import { Download, Loader2, RotateCcw } from 'lucide-react';

interface DownloadButtonProps {
  onDownload: () => void;
  onResetAll: () => void;
  isExporting: boolean;
  canReset: boolean;
  validationMessage: string | null;
  downloadSuccess: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  onDownload,
  onResetAll,
  isExporting,
  canReset,
  validationMessage,
  downloadSuccess,
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      {validationMessage && (
        <div
          role="alert"
          className="w-full bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-sm font-medium rounded-lg px-4 py-3 text-center"
        >
          {validationMessage}
        </div>
      )}

      {downloadSuccess && !validationMessage && (
        <div
          role="status"
          className="w-full bg-[#EEF4FF] border border-[#C7D7FE] text-[#0A226E] text-sm font-medium rounded-lg px-4 py-3 text-center"
        >
          Your personalized NDC campaign poster has been downloaded.
        </div>
      )}

      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
        <button
          type="button"
          onClick={onDownload}
          disabled={isExporting}
          className="flex-1 min-h-[52px] inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-lg bg-[#D91E26] text-white font-display font-bold text-base tracking-wide whitespace-nowrap hover:bg-[#BC171E] active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait transition-all duration-150 cursor-pointer shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D91E26]"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
              <span>GENERATING POSTER...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>DOWNLOAD MY POSTER</span>
            </>
          )}
        </button>

        {canReset && (
          <button
            type="button"
            onClick={onResetAll}
            disabled={isExporting}
            className="min-h-[52px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-lg border border-[#CFD7E6] bg-white text-[#0A194E] font-semibold text-sm whitespace-nowrap hover:bg-[#F8FAFD] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Start Over</span>
          </button>
        )}
      </div>
    </div>
  );
};
