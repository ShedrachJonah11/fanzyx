"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";

type Props = {
  open: boolean;
  file: File | null;
  /** Crop viewport aspect ratio (width / height). 1 for avatar, 3 for cover. */
  aspect: number;
  /** Output image width in pixels. Height is derived from `aspect`. */
  outputWidth: number;
  /** Called with the cropped file. Original file name is preserved with .jpg. */
  onCropped: (file: File) => void | Promise<void>;
  onClose: () => void;
  title?: string;
  /** Render the crop area as a circle (avatars). */
  circle?: boolean;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/**
 * Wraps `react-easy-crop` in a themed modal. That library gives us
 * pinch-to-zoom, mouse-wheel zoom, drag-to-pan, and momentum for free —
 * the same interaction model as Instagram / iOS photo picker.
 *
 * On confirm we draw the cropped-area pixels into a canvas sized to
 * `outputWidth × outputWidth/aspect` and export as JPEG.
 */
export function ImageCropper({
  open,
  file,
  aspect,
  outputWidth,
  onCropped,
  onClose,
  title,
  circle,
}: Props) {
  // Object URL — created + revoked inside effect so strict-mode remounts
  // always own a valid blob.
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [busy, setBusy] = useState(false);
  const [pixelCrop, setPixelCrop] = useState<Area | null>(null);

  const onCropComplete = useCallback(
    (_croppedArea: Area, croppedAreaPixels: Area) => {
      setPixelCrop(croppedAreaPixels);
    },
    []
  );

  // Body scroll lock + Esc.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, busy]);

  const confirm = async () => {
    if (!file || !imgUrl || !pixelCrop || busy) return;
    setBusy(true);
    try {
      const outW = outputWidth;
      const outH = Math.round(outputWidth / aspect);
      const blob = await renderCropToBlob(imgUrl, pixelCrop, rotation, outW, outH);
      if (!blob) throw new Error("Couldn't encode image");
      const stem = file.name.replace(/\.[^.]+$/, "") || "image";
      const cropped = new File([blob], `${stem}.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
      await onCropped(cropped);
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;
  if (typeof document === "undefined") return null;

  const ui = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={busy ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        aria-label={title ?? "Adjust image"}
        className="relative w-full max-w-lg rounded-[20px] overflow-hidden surface-card flex flex-col max-h-[92dvh]"
      >
        <div className="flex items-start justify-between px-5 pt-5 pb-4 gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">
              {title ?? "Adjust image"}
            </h2>
            <p className="text-[11px] text-white/50 mt-0.5">
              Output: {outputWidth} × {Math.round(outputWidth / aspect)}
              <span className="text-white/30"> · </span>
              {formatAspect(aspect)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.08] disabled:opacity-50 shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Cropper stage — fixed 320px tall, black background */}
        <div className="relative w-full h-[360px] bg-black">
          {imgUrl ? (
            <Cropper
              image={imgUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              minZoom={MIN_ZOOM}
              maxZoom={MAX_ZOOM}
              cropShape={circle ? "round" : "rect"}
              objectFit="contain"
              showGrid
              zoomWithScroll
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: { background: "#000" },
              }}
            />
          ) : null}
        </div>

        {/* Controls */}
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
              aria-label="Zoom out"
              className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] shrink-0"
            >
              <ZoomOut className="size-4" />
            </button>
            <input
              type="range"
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-[#FD23A7]"
              aria-label="Zoom"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
              aria-label="Zoom in"
              className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] shrink-0"
            >
              <ZoomIn className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Rotate 90°"
              title="Rotate"
              className="inline-flex items-center justify-center size-8 rounded-full text-white/70 hover:text-white hover:bg-white/[0.06] shrink-0"
            >
              <RotateCw className="size-4" />
            </button>
          </div>
          <p className="text-[11px] text-white/45 text-center">
            Drag to reposition · scroll or pinch to zoom · rotate for orientation
          </p>
        </div>

        <div className="border-t border-white/[0.05] px-5 py-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="inline-flex items-center h-10 px-4 rounded-full text-[13px] font-medium text-white/80 hover:text-white hover:bg-white/[0.06] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !pixelCrop}
            className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full text-[13px] font-bold text-white on-media bg-gradient-brand shadow-[0_10px_30px_-12px_rgba(253,35,167,0.55)] hover:opacity-95 disabled:opacity-50"
          >
            {busy ? (
              <>
                <span
                  aria-hidden
                  className="size-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"
                />
                Uploading…
              </>
            ) : (
              "Use photo"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(ui, document.body);
}

/**
 * Draw the cropped-region pixels onto a canvas at the target output size,
 * applying rotation. Returns a JPEG blob at quality 0.9.
 */
async function renderCropToBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotationDeg: number,
  outW: number,
  outH: number
): Promise<Blob | null> {
  const image = await loadImage(imageSrc);
  const rot = ((rotationDeg % 360) + 360) % 360;

  // We first draw the rotated image on an intermediate canvas sized to fit
  // the rotated bounding box, then crop `pixelCrop` (which is expressed in
  // the *rotated* image's pixel space by react-easy-crop).
  const rad = (rot * Math.PI) / 180;
  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));
  const rotatedW = image.width * cos + image.height * sin;
  const rotatedH = image.width * sin + image.height * cos;

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = rotatedW;
  rotCanvas.height = rotatedH;
  const rotCtx = rotCanvas.getContext("2d");
  if (!rotCtx) return null;
  rotCtx.translate(rotatedW / 2, rotatedH / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(image, -image.width / 2, -image.height / 2);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = outW;
  outCanvas.height = outH;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) return null;
  outCtx.drawImage(
    rotCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outW,
    outH
  );

  return new Promise((resolve) =>
    outCanvas.toBlob(resolve, "image/jpeg", 0.9)
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** "1", "3", "1.5" → "1:1", "3:1", "3:2". Keeps common ratios readable. */
function formatAspect(aspect: number): string {
  if (!Number.isFinite(aspect) || aspect <= 0) return "";
  // Snap common aspects to nice integer ratios.
  const common: [number, string][] = [
    [1, "1:1"],
    [4 / 3, "4:3"],
    [3 / 2, "3:2"],
    [16 / 9, "16:9"],
    [2, "2:1"],
    [3, "3:1"],
    [21 / 9, "21:9"],
  ];
  for (const [v, label] of common) {
    if (Math.abs(aspect - v) < 0.02) return label;
  }
  // Fallback — reduce to simplest fraction.
  const scaled = Math.round(aspect * 100);
  const g = gcd(scaled, 100);
  return `${scaled / g}:${100 / g}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
