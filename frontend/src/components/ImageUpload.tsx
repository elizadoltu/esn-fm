import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { uploadImage } from "@/api/upload.api";

interface ImageUploadProps {
  type: "avatar" | "cover";
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

export default function ImageUpload({
  type,
  currentUrl,
  onUploaded,
}: Readonly<ImageUploadProps>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? currentUrl ?? null;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setError(null);
    setLoading(true);

    try {
      const url = await uploadImage(file, type);
      onUploaded(url);
      // Replace blob URL with the real Cloudinary URL
      setPreview(url);
    } catch {
      setError("Upload failed. Try again.");
      setPreview(null);
    } finally {
      setLoading(false);
      // Reset input so the same file can be re-selected after an error
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    setPreview(null);
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  if (type === "avatar") {
    return (
      <div className="flex items-center gap-4">
        {/* Avatar circle */}
        <div className="relative shrink-0">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
              <Camera className="h-7 w-7 text-muted-foreground/50" />
            </div>
          )}

          {/* Overlay button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            aria-label="Change avatar"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>

          {/* Clear button */}
          {displayUrl && !loading && (
            <button
              type="button"
              onClick={clear}
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white shadow"
              aria-label="Remove avatar"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {loading ? "Uploading…" : "Change photo"}
          </button>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG or WebP · max 5 MB
          </p>
          {error && <p className="text-xs text-destructive mt-1">{error}</p>}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
    );
  }

  // Cover banner
  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Cover"
            className="h-32 w-full object-cover"
          />
        ) : (
          <div className="h-32 flex items-center justify-center">
            <Camera className="h-8 w-8 text-muted-foreground/40" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-sm text-white hover:bg-black/75 transition-colors disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {loading ? "Uploading…" : displayUrl ? "Change cover" : "Add cover"}
          </button>

          {displayUrl && !loading && (
            <button
              type="button"
              onClick={clear}
              className="flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 text-sm text-white hover:bg-black/75 transition-colors"
            >
              <X className="h-4 w-4" />
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        JPG, PNG or WebP · max 5 MB · 1200×400 recommended
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
