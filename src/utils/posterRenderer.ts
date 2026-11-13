export const POSTER_TEMPLATE_SRC =
  '/assets/aistudio/NDC_Oshodi-Isolo_Campaign_Poster_ba7fe65c.png';

export const POSTER_WIDTH = 1088;
export const POSTER_HEIGHT = 1445;

// Exact measured geometry of the central circular opening on the 1088x1445 master poster
export const CIRCLE_CENTER_X = 528.25;
export const CIRCLE_CENTER_Y = 778.25;
export const CIRCLE_INNER_RX = 288.25;
export const CIRCLE_INNER_RY = 298.25;

// Slightly expanded clip radius so the photo tucks ~2px under the Layer 3 white ring without any seam
const PHOTO_CLIP_RX = 290.5;
const PHOTO_CLIP_RY = 300.5;

export interface PhotoTransform {
  zoom: number;
  offsetX: number; // in poster pixel coordinates (relative to center)
  offsetY: number; // in poster pixel coordinates (relative to center)
}

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
};

export interface PosterRenderState {
  posterImage: HTMLImageElement;
  ringOverlayCanvas: HTMLCanvasElement;
  userPhoto: HTMLImageElement | null;
  transform: PhotoTransform;
  fullName: string;
}

/**
 * Builds the Layer 3 overlay canvas from the master poster image.
 * Everything inside the circular opening (d <= 0.962) is transparent so Layer 2 shows through.
 * The subtle inner shadow (0.962 < d < 0.997) is preserved as translucent dark tint,
 * and everything at d >= 0.997 (the white ring, outer drop shadow, segmented arcs, and rest of poster)
 * remains 100% opaque from the original artwork.
 */
export function buildPosterRingOverlay(posterImage: HTMLImageElement): HTMLCanvasElement {
  const overlay = document.createElement('canvas');
  overlay.width = POSTER_WIDTH;
  overlay.height = POSTER_HEIGHT;
  const ctx = overlay.getContext('2d');
  if (!ctx) return overlay;

  ctx.drawImage(posterImage, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  const minX = Math.max(0, Math.floor(CIRCLE_CENTER_X - CIRCLE_INNER_RX - 8));
  const maxX = Math.min(POSTER_WIDTH - 1, Math.ceil(CIRCLE_CENTER_X + CIRCLE_INNER_RX + 8));
  const minY = Math.max(0, Math.floor(CIRCLE_CENTER_Y - CIRCLE_INNER_RY - 8));
  const maxY = Math.min(POSTER_HEIGHT - 1, Math.ceil(CIRCLE_CENTER_Y + CIRCLE_INNER_RY + 8));

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const imageData = ctx.getImageData(minX, minY, boxW, boxH);
  const data = imageData.data;

  const rxNorm = CIRCLE_INNER_RX - 0.5;
  const ryNorm = CIRCLE_INNER_RY - 0.5;

  for (let row = 0; row < boxH; row++) {
    const py = minY + row;
    const dy = (py - CIRCLE_CENTER_Y) / ryNorm;
    const dy2 = dy * dy;

    for (let col = 0; col < boxW; col++) {
      const px = minX + col;
      const dx = (px - CIRCLE_CENTER_X) / rxNorm;
      const d = Math.sqrt(dx * dx + dy2);

      if (d >= 0.998) {
        continue; // Keep 100% opaque original white ring & poster pixels
      }

      const idx = (row * boxW + col) * 4;
      if (d <= 0.96) {
        data[idx + 3] = 0;
      } else {
        // Subtle inner drop shadow ramp from 0.96 -> 0.998
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const lum = (r + g + b) / 3;
        const ramp = (d - 0.96) / (0.998 - 0.96);

        if (lum >= 245) {
          // Empty light interior pixel: keep transparent until the white ring edge
          data[idx + 3] = 0;
        } else {
          // Natural inner shadow cast onto photo edge
          const darkness = Math.min(1, Math.max(0, (246 - lum) / 36));
          data[idx] = 12;
          data[idx + 1] = 24;
          data[idx + 2] = 62;
          data[idx + 3] = Math.round(255 * Math.min(0.45, darkness * ramp * 0.65));
        }
      }
    }
  }

  ctx.putImageData(imageData, minX, minY);
  return overlay;
}

/**
 * Computes object-fit: cover dimensions and clamped offsets for the uploaded photo inside the circle.
 */
export function computePhotoDrawRect(
  photo: HTMLImageElement,
  transform: PhotoTransform
): { drawX: number; drawY: number; drawW: number; drawH: number } {
  const natW = photo.naturalWidth || photo.width;
  const natH = photo.naturalHeight || photo.height;

  const targetW = PHOTO_CLIP_RX * 2;
  const targetH = PHOTO_CLIP_RY * 2;

  // Uniform scale (never stretches or distorts aspect ratio)
  const coverScale = Math.max(targetW / natW, targetH / natH);
  const scale = coverScale * Math.max(1, transform.zoom);

  const drawW = natW * scale;
  const drawH = natH * scale;

  // Clamp pan so the circle stays completely filled with the photograph (no blank gaps)
  const maxOffsetX = Math.max(0, (drawW - targetW) / 2);
  const maxOffsetY = Math.max(0, (drawH - targetH) / 2);

  const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, transform.offsetX));
  const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, transform.offsetY));

  const drawX = CIRCLE_CENTER_X + clampedX - drawW / 2;
  const drawY = CIRCLE_CENTER_Y + clampedY - drawH / 2;

  return { drawX, drawY, drawW, drawH };
}

/**
 * Clamps a requested offset to keep the circle completely covered by the photo.
 */
export function clampPhotoOffset(
  photo: HTMLImageElement | null,
  zoom: number,
  offsetX: number,
  offsetY: number
): { offsetX: number; offsetY: number } {
  if (!photo) return { offsetX: 0, offsetY: 0 };

  const natW = photo.naturalWidth || photo.width;
  const natH = photo.naturalHeight || photo.height;
  const targetW = PHOTO_CLIP_RX * 2;
  const targetH = PHOTO_CLIP_RY * 2;
  const coverScale = Math.max(targetW / natW, targetH / natH);
  const scale = coverScale * Math.max(1, zoom);

  const maxOffsetX = Math.max(0, (natW * scale - targetW) / 2);
  const maxOffsetY = Math.max(0, (natH * scale - targetH) / 2);

  return {
    offsetX: Math.max(-maxOffsetX, Math.min(maxOffsetX, offsetX)),
    offsetY: Math.max(-maxOffsetY, Math.min(maxOffsetY, offsetY)),
  };
}

/**
 * Computes maximum safe horizontal text chord inside the circle at a given Y coordinate.
 */
function getCircleChordWidth(y: number, horizontalPadding = 32): number {
  const dy = y - CIRCLE_CENTER_Y;
  const ratio = Math.min(0.96, Math.abs(dy) / CIRCLE_INNER_RY);
  const halfChord = CIRCLE_INNER_RX * Math.sqrt(Math.max(0, 1 - ratio * ratio));
  return Math.max(80, halfChord * 2 - horizontalPadding * 2);
}

/**
 * Fits and draws the user's name neatly inside the lower portion of the central circle
 * without covering the main facial area or overflowing the circular boundary.
 */
function drawPersonalizedName(
  ctx: CanvasRenderingContext2D,
  rawName: string,
  hasPhoto: boolean
) {
  const trimmed = rawName.trim().replace(/\s+/g, ' ');
  if (!trimmed) return;

  ctx.save();

  // Clip strictly to the inner circular opening so text & scrim never escape the circle
  ctx.beginPath();
  ctx.ellipse(
    CIRCLE_CENTER_X,
    CIRCLE_CENTER_Y,
    CIRCLE_INNER_RX - 1,
    CIRCLE_INNER_RY - 1,
    0,
    0,
    Math.PI * 2
  );
  ctx.clip();

  // When a photo is present, render a clean NDC navy readability scrim across the bottom arc
  if (hasPhoto) {
    const scrimTop = CIRCLE_CENTER_Y + 110;
    const scrimBottom = CIRCLE_CENTER_Y + CIRCLE_INNER_RY;
    const grad = ctx.createLinearGradient(0, scrimTop, 0, scrimBottom);
    grad.addColorStop(0, 'rgba(6, 20, 68, 0)');
    grad.addColorStop(0.38, 'rgba(6, 20, 68, 0.56)');
    grad.addColorStop(0.72, 'rgba(6, 20, 68, 0.84)');
    grad.addColorStop(1, 'rgba(6, 20, 68, 0.94)');
    ctx.fillStyle = grad;
    ctx.fillRect(
      CIRCLE_CENTER_X - CIRCLE_INNER_RX,
      scrimTop,
      CIRCLE_INNER_RX * 2,
      scrimBottom - scrimTop
    );
  }

  const fontFamily = '"Outfit", "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const singleLineY = CIRCLE_CENTER_Y + 206;
  const maxSingleWidth = getCircleChordWidth(singleLineY, 34);

  // Try single-line sizing from 36px down to 22px
  let chosenSize = 36;
  let fitsSingle = false;
  for (let size = 36; size >= 22; size -= 1) {
    ctx.font = `800 ${size}px ${fontFamily}`;
    if (ctx.measureText(trimmed).width <= maxSingleWidth) {
      chosenSize = size;
      fitsSingle = true;
      break;
    }
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (hasPhoto) {
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(4, 12, 42, 0.72)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 2;
  } else {
    ctx.fillStyle = '#081C5C';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.85)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
  }

  if (fitsSingle) {
    ctx.font = `800 ${chosenSize}px ${fontFamily}`;
    ctx.fillText(trimmed, CIRCLE_CENTER_X, singleLineY);
  } else {
    // Wrap gracefully into 2 balanced lines for very long names
    const words = trimmed.split(' ');
    let line1 = trimmed;
    let line2 = '';

    if (words.length >= 2) {
      let bestDiff = Infinity;
      for (let split = 1; split < words.length; split++) {
        const a = words.slice(0, split).join(' ');
        const b = words.slice(split).join(' ');
        const diff = Math.abs(a.length - b.length);
        if (diff < bestDiff) {
          bestDiff = diff;
          line1 = a;
          line2 = b;
        }
      }
    } else {
      const mid = Math.ceil(trimmed.length / 2);
      line1 = trimmed.slice(0, mid);
      line2 = trimmed.slice(mid);
    }

    const line1Y = CIRCLE_CENTER_Y + 184;
    const line2Y = CIRCLE_CENTER_Y + 220;
    const maxW1 = getCircleChordWidth(line1Y, 34);
    const maxW2 = getCircleChordWidth(line2Y, 38);

    let twoLineSize = 27;
    for (let size = 27; size >= 15; size -= 1) {
      ctx.font = `800 ${size}px ${fontFamily}`;
      if (
        ctx.measureText(line1).width <= maxW1 &&
        ctx.measureText(line2).width <= maxW2
      ) {
        twoLineSize = size;
        break;
      }
    }

    ctx.font = `800 ${twoLineSize}px ${fontFamily}`;
    const lineGap = Math.round(twoLineSize * 1.24);
    const centerBlockY = CIRCLE_CENTER_Y + 200;
    ctx.fillText(line1, CIRCLE_CENTER_X, centerBlockY - lineGap / 2, maxW1);
    ctx.fillText(line2, CIRCLE_CENTER_X, centerBlockY + lineGap / 2, maxW2);
  }

  ctx.restore();
}

/**
 * Renders all 4 required layers onto a canvas at native 1088x1445 resolution
 * (or scaled cleanly if the target canvas has a different pixel size via DPR).
 */
export function renderPosterToCanvas(
  canvas: HTMLCanvasElement,
  state: PosterRenderState,
  targetScale = 1
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const outW = Math.round(POSTER_WIDTH * targetScale);
  const outH = Math.round(POSTER_HEIGHT * targetScale);
  if (canvas.width !== outW || canvas.height !== outH) {
    canvas.width = outW;
    canvas.height = outH;
  }

  ctx.save();
  ctx.setTransform(targetScale, 0, 0, targetScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Layer 1: Original NDC poster background
  ctx.drawImage(state.posterImage, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  // Layer 2: User-uploaded photograph clipped into the central circular opening
  if (state.userPhoto) {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      CIRCLE_CENTER_X,
      CIRCLE_CENTER_Y,
      PHOTO_CLIP_RX,
      PHOTO_CLIP_RY,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();

    const { drawX, drawY, drawW, drawH } = computePhotoDrawRect(
      state.userPhoto,
      state.transform
    );
    ctx.drawImage(state.userPhoto, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  // Layer 4 scrim + typography inside the circle (drawn before Layer 3 white ring so the white ring cleanly frames everything)
  if (state.fullName.trim()) {
    drawPersonalizedName(ctx, state.fullName, Boolean(state.userPhoto));
  }

  // Layer 3: Original circular white border, inner/outer shadows, and decorative elements
  ctx.drawImage(state.ringOverlayCanvas, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

  ctx.restore();
}

/**
 * Generates a full-resolution (1088x1445) PNG Blob for download.
 */
export async function exportPosterPngBlob(state: PosterRenderState): Promise<Blob> {
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = POSTER_WIDTH;
  exportCanvas.height = POSTER_HEIGHT;

  renderPosterToCanvas(exportCanvas, state, 1);

  return new Promise<Blob>((resolve, reject) => {
    exportCanvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate poster PNG image.'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Formats filename strictly as NDC-Personalized-Poster-UserName.png
 */
export function buildDownloadFilename(fullName: string): string {
  const sanitized = fullName
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const userPart = sanitized || 'Supporter';
  return `NDC-Personalized-Poster-${userPart}.png`;
}
