import { useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { uploadImage } from "@/api/upload.api";
import ImageCropModal from "@/components/ImageCropModal";

interface ImageUploadProps {
  type: "avatar" | "cover";
  currentUrl?: string;
  onUploaded: (url: string) => void;
}

interface UploadState {
  preview: string | null;
  loading: boolean;
  error: string | null;
  cropSrc: string | null;
  pendingFileName: string;
}

function useUpload(
  type: "avatar" | "cover",
  onUploaded: (url: string) => void
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>({
    preview: null,
    loading: false,
    error: null,
    cropSrc: null,
    pendingFileName: "",
  });

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (inputRef.current) inputRef.current.value = "";
    const objectUrl = URL.createObjectURL(file);
    setState((s) => ({
      ...s,
      cropSrc: objectUrl,
      pendingFileName: file.name,
      error: null,
    }));
  }

  async function onCropConfirm(croppedFile: File) {
    // Perform side effects outside setState to avoid double-execution in StrictMode
    if (state.cropSrc) URL.revokeObjectURL(state.cropSrc);
    const objectUrl = URL.createObjectURL(croppedFile);
    setState((s) => ({
      ...s,
      cropSrc: null,
      preview: objectUrl,
      loading: true,
    }));

    try {
      const url = await uploadImage(croppedFile, type);
      onUploaded(url);
      URL.revokeObjectURL(objectUrl);
      setState((s) => ({ ...s, preview: url, loading: false }));
    } catch {
      URL.revokeObjectURL(objectUrl);
      setState((s) => ({
        ...s,
        preview: null,
        loading: false,
        error: "Upload failed. Try again.",
      }));
    }
  }

  function onCropCancel() {
    if (state.cropSrc) URL.revokeObjectURL(state.cropSrc);
    setState((s) => ({ ...s, cropSrc: null }));
  }

  function clear() {
    setState((s) => ({ ...s, preview: null }));
    onUploaded("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return {
    inputRef,
    state,
    pickFile,
    onFileChange,
    onCropConfirm,
    onCropCancel,
    clear,
  };
}

function AvatarUpload({
  currentUrl,
  onUploaded,
}: Readonly<Omit<ImageUploadProps, "type">>) {
  const {
    inputRef,
    state,
    pickFile,
    onFileChange,
    onCropConfirm,
    onCropCancel,
    clear,
  } = useUpload("avatar", onUploaded);
  const displayUrl = state.preview ?? currentUrl ?? null;

  return (
    <>
      {state.cropSrc && (
        <ImageCropModal
          imageSrc={state.cropSrc}
          fileName={state.pendingFileName}
          type="avatar"
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
        />
      )}

      <div className="flex items-center gap-4">
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

          <button
            type="button"
            onClick={pickFile}
            disabled={state.loading}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
            aria-label="Change avatar"
          >
            {state.loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </button>

          {displayUrl && !state.loading && (
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
            onClick={pickFile}
            disabled={state.loading}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {state.loading ? "Uploading…" : "Change photo"}
          </button>
          <p className="text-xs text-muted-foreground mt-0.5">
            JPG, PNG or WebP · max 5 MB
          </p>
          {state.error && (
            <p className="text-xs text-destructive mt-1">{state.error}</p>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </>
  );
}

function coverButtonLabel(loading: boolean, hasUrl: boolean): string {
  if (loading) return "Uploading…";
  if (hasUrl) return "Change cover";
  return "Add cover";
}

function CoverUpload({
  currentUrl,
  onUploaded,
}: Readonly<Omit<ImageUploadProps, "type">>) {
  const {
    inputRef,
    state,
    pickFile,
    onFileChange,
    onCropConfirm,
    onCropCancel,
    clear,
  } = useUpload("cover", onUploaded);
  const displayUrl = state.preview ?? currentUrl ?? null;

  return (
    <>
      {state.cropSrc && (
        <ImageCropModal
          imageSrc={state.cropSrc}
          fileName={state.pendingFileName}
          type="cover"
          onConfirm={onCropConfirm}
          onCancel={onCropCancel}
        />
      )}

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

          <div className="absolute inset-0 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={pickFile}
              disabled={state.loading}
              className="flex items-center gap-2 rounded-lg bg-black/60 px-3 py-2 text-sm text-white hover:bg-black/75 transition-colors disabled:cursor-not-allowed"
            >
              {state.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {coverButtonLabel(state.loading, !!displayUrl)}
            </button>

            {displayUrl && !state.loading && (
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

        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WebP · max 5 MB · 1200×400 recommended
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    </>
  );
}

export default function ImageUpload({
  type,
  currentUrl,
  onUploaded,
}: Readonly<ImageUploadProps>) {
  if (type === "avatar") {
    return <AvatarUpload currentUrl={currentUrl} onUploaded={onUploaded} />;
  }
  return <CoverUpload currentUrl={currentUrl} onUploaded={onUploaded} />;
}
