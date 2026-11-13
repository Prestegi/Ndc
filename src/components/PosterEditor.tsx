import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_PHOTO_TRANSFORM,
  POSTER_TEMPLATE_SRC,
  PhotoTransform,
  buildDownloadFilename,
  buildPosterRingOverlay,
  clampPhotoOffset,
  exportPosterPngBlob,
} from '../utils/posterRenderer';
import { DownloadButton } from './DownloadButton';
import { NameInput } from './NameInput';
import { PhotoAdjuster } from './PhotoAdjuster';
import { PhotoUploader, isValidPhotoFile } from './PhotoUploader';
import { PosterPreview } from './PosterPreview';

export const PosterEditor: React.FC = () => {
  const [posterImage, setPosterImage] = useState<HTMLImageElement | null>(null);
  const [ringOverlayCanvas, setRingOverlayCanvas] = useState<HTMLCanvasElement | null>(null);
  const [posterError, setPosterError] = useState<string | null>(null);

  const [userPhoto, setUserPhoto] = useState<HTMLImageElement | null>(null);
  const userPhotoUrlRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [transform, setTransform] = useState<PhotoTransform>(DEFAULT_PHOTO_TRANSFORM);
  const [fullName, setFullName] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Load master NDC campaign poster once
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setPosterImage(img);
      const overlay = buildPosterRingOverlay(img);
      setRingOverlayCanvas(overlay);
      setPosterError(null);
    };
    img.onerror = () => {
      setPosterError('Unable to load the NDC campaign poster template. Please refresh and try again.');
    };
    img.src = POSTER_TEMPLATE_SRC;
  }, []);

  // Revoke object URL on unmount
  useEffect(() => {
    return () => {
      if (userPhotoUrlRef.current) {
        URL.revokeObjectURL(userPhotoUrlRef.current);
      }
    };
  }, []);

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    setValidationMessage(null);
    setDownloadSuccess(false);

    if (!isValidPhotoFile(file)) {
      setUploadError('Please select a valid image file (JPG, JPEG, PNG, or WEBP).');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      if (userPhotoUrlRef.current) {
        URL.revokeObjectURL(userPhotoUrlRef.current);
      }
      userPhotoUrlRef.current = objectUrl;
      setUserPhoto(img);
      setTransform(DEFAULT_PHOTO_TRANSFORM);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      setUploadError('Could not read the selected photograph. Please try another image.');
    };

    img.src = objectUrl;
  };

  const handleNameChange = (value: string) => {
    setFullName(value);
    if (validationMessage) setValidationMessage(null);
    if (downloadSuccess) setDownloadSuccess(false);
  };

  const handleZoomChange = (nextZoom: number) => {
    const clamped = clampPhotoOffset(
      userPhoto,
      nextZoom,
      transform.offsetX,
      transform.offsetY
    );
    setTransform({
      zoom: nextZoom,
      offsetX: clamped.offsetX,
      offsetY: clamped.offsetY,
    });
  };

  const handleResetPhotoPosition = () => {
    setTransform(DEFAULT_PHOTO_TRANSFORM);
  };

  const handleResetAll = () => {
    if (userPhotoUrlRef.current) {
      URL.revokeObjectURL(userPhotoUrlRef.current);
      userPhotoUrlRef.current = null;
    }
    setUserPhoto(null);
    setTransform(DEFAULT_PHOTO_TRANSFORM);
    setFullName('');
    setUploadError(null);
    setValidationMessage(null);
    setDownloadSuccess(false);
  };

  const handleDownload = async () => {
    setValidationMessage(null);
    setDownloadSuccess(false);

    const hasPhoto = Boolean(userPhoto);
    const hasName = fullName.trim().length > 0;

    if (!hasPhoto && !hasName) {
      setValidationMessage('Please add your photograph and enter your full name before downloading.');
      return;
    }
    if (!hasPhoto) {
      setValidationMessage('Please click ADD YOUR PHOTO to upload your photograph first.');
      return;
    }
    if (!hasName) {
      setValidationMessage('Please enter your full name and surname before downloading.');
      return;
    }
    if (!posterImage || !ringOverlayCanvas) {
      setValidationMessage('Poster template is still loading. Please wait a moment and try again.');
      return;
    }

    try {
      setIsExporting(true);
      const blob = await exportPosterPngBlob({
        posterImage,
        ringOverlayCanvas,
        userPhoto,
        transform,
        fullName,
      });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = buildDownloadFilename(fullName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 4000);

      setDownloadSuccess(true);
    } catch {
      setValidationMessage('Unable to generate your poster image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F3F5F9] text-[#0A194E]">
      {/* Top NDC Accent Strip */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0A226E] via-[#D91E26] to-[#0A226E]" />

      <main className="flex-1 w-full max-w-[920px] mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col items-center gap-6 sm:gap-7">
        {/* 1. Application Heading */}
        <header className="w-full max-w-[660px] text-center space-y-2.5">
          <h1
            className="font-display font-extrabold text-[clamp(1.65rem,3.6vw,2.5rem)] leading-[1.15] tracking-tight text-[#0A194E]"
            style={{ textWrap: 'balance' }}
          >
            NDC CAMPAIGN POSTER PERSONALIZER
          </h1>
          <p className="text-sm sm:text-base text-[#44527A] max-w-xl mx-auto leading-relaxed">
            Upload your photograph, enter your name and create your personalized NDC campaign poster.
          </p>
        </header>

        {/* 2. ADD YOUR PHOTO Button & 3. Full Name Input Field */}
        <section
          aria-label="Personalization controls"
          className="w-full max-w-[620px] bg-white border border-[#DCE2EC] rounded-2xl p-4 sm:p-6 shadow-[0_4px_20px_rgba(10,25,78,0.04)] flex flex-col gap-4"
        >
          <PhotoUploader
            hasPhoto={Boolean(userPhoto)}
            onFileSelected={handleFileSelected}
            inputRef={fileInputRef}
          />

          {uploadError && (
            <p role="alert" className="text-xs sm:text-sm font-medium text-[#B91C1C]">
              {uploadError}
            </p>
          )}

          <NameInput value={fullName} onChange={handleNameChange} />

          {userPhoto && (
            <PhotoAdjuster
              zoom={transform.zoom}
              onZoomChange={handleZoomChange}
              onReset={handleResetPhotoPosition}
            />
          )}
        </section>

        {/* 4. Live Poster Preview */}
        <PosterPreview
          posterImage={posterImage}
          ringOverlayCanvas={ringOverlayCanvas}
          posterError={posterError}
          userPhoto={userPhoto}
          transform={transform}
          fullName={fullName}
          onTransformChange={setTransform}
          onEmptyCircleClick={() => fileInputRef.current?.click()}
          onFileDrop={handleFileSelected}
        />

        {/* 5. DOWNLOAD MY POSTER Button */}
        <section aria-label="Download poster" className="w-full max-w-[620px]">
          <DownloadButton
            onDownload={handleDownload}
            onResetAll={handleResetAll}
            isExporting={isExporting}
            canReset={Boolean(userPhoto || fullName.trim())}
            validationMessage={validationMessage}
            downloadSuccess={downloadSuccess}
          />
        </section>
      </main>

      {/* 6. Footer */}
      <footer className="w-full border-t border-[#DCE2EC] bg-white/80 py-5 px-4 text-center">
        <p className="text-xs sm:text-sm font-medium text-[#44527A]">
          NDC Campaign Poster Personalizer &middot; Oshodi-Isolo Constituency II
        </p>
        <p className="text-xs text-[#6B7899] mt-1">
          All photo processing runs directly in your browser. Your photograph is never uploaded to any external server.
        </p>
      </footer>
    </div>
  );
};
