import { useRef, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const CROP_SIZE = 280;

interface AvatarCropModalProps {
  src: string;
  onSave: (f: File) => void;
  onCancel: () => void;
}

export default function AvatarCropModal({
  src,
  onSave,
  onCancel,
}: Readonly<AvatarCropModalProps>) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [naturalW, setNaturalW] = useState(0);
  const [naturalH, setNaturalH] = useState(0);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{
    mx: number;
    my: number;
    ox: number;
    oy: number;
  } | null>(null);

  function handleImageLoad() {
    const img = imgRef.current!;
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    setNaturalW(nw);
    setNaturalH(nh);
    const s = CROP_SIZE / Math.min(nw, nh);
    setScale(s);
    setOffset({ x: -(nw * s - CROP_SIZE) / 2, y: -(nh * s - CROP_SIZE) / 2 });
  }

  function onPointerDown(e: React.PointerEvent) {
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.mx;
    const dy = e.clientY - dragStart.current.my;
    const rw = naturalW * scale;
    const rh = naturalH * scale;
    setOffset({
      x: Math.min(0, Math.max(dragStart.current.ox + dx, CROP_SIZE - rw)),
      y: Math.min(0, Math.max(dragStart.current.oy + dy, CROP_SIZE - rh)),
    });
  }

  function onPointerUp() {
    dragStart.current = null;
  }

  function handleSave() {
    const img = imgRef.current;
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d")!;
    const sx = -offset.x / scale;
    const sy = -offset.y / scale;
    const sw = CROP_SIZE / scale;
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, 400, 400);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onSave(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  }

  return (
    <>
      <button
        type="button"
        aria-label="Cancel"
        className="fixed inset-0 z-50 bg-black/80"
        onClick={onCancel}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto bg-card rounded-2xl shadow-2xl p-5 space-y-4 w-full max-w-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Adjust photo</h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Drag to reposition</p>
          <div
            className="relative overflow-hidden rounded-full mx-auto cursor-grab active:cursor-grabbing select-none"
            style={{ width: CROP_SIZE, height: CROP_SIZE }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <img
              ref={imgRef}
              src={src}
              alt=""
              onLoad={handleImageLoad}
              draggable={false}
              className="absolute"
              style={{
                left: offset.x,
                top: offset.y,
                width: naturalW * scale,
                height: naturalH * scale,
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save photo
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
