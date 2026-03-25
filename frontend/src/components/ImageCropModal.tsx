import { useState, useCallback, useEffect, useRef } from "react";
import Cropper from "react-easy-crop";
import type { Point, Area } from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from "@/lib/cropImage";

interface ImageCropModalProps {
  imageSrc: string;
  fileName: string;
  type: "avatar" | "cover";
  onConfirm: (file: File) => void;
  onCancel: () => void;
}

export default function ImageCropModal({
  imageSrc,
  fileName,
  type,
  onConfirm,
  onCancel,
}: Readonly<ImageCropModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  // Open as a native modal (handles Escape + focus trapping automatically)
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  async function handleConfirm() {
    if (!croppedAreaPixels) return;
    const file = await getCroppedImg(imageSrc, croppedAreaPixels, fileName);
    onConfirm(file);
  }

  return (
    <dialog
      ref={dialogRef}
      // Reset browser dialog defaults; overlay handled by ::backdrop via CSS var below
      className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-0 bg-transparent p-4"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
    >
      {/* Backdrop dismiss button — visually fills the gap around the card */}
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 -z-10 cursor-default bg-black/60"
        onClick={onCancel}
        tabIndex={-1}
      />

      {/* Modal card */}
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <span className="text-sm font-medium">
            {type === "avatar" ? "Crop profile photo" : "Crop cover image"}
          </span>
          <Button size="sm" onClick={handleConfirm}>
            Apply
          </Button>
        </div>

        {/* Crop area */}
        <div className="relative h-72 bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={type === "avatar" ? 1 : 3}
            cropShape={type === "avatar" ? "round" : "rect"}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          <span className="shrink-0 text-xs text-muted-foreground">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
        </div>
      </div>
    </dialog>
  );
}
