import { useEffect } from "react";
import { Camera } from "lucide-react";

interface AvatarViewerProps {
  avatarUrl: string | null;
  displayName: string;
  isOwner: boolean;
  onEdit: () => void;
  onClose: () => void;
}

export default function AvatarViewer({
  avatarUrl,
  displayName,
  isOwner,
  onEdit,
  onClose,
}: Readonly<AvatarViewerProps>) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-50 bg-black/90"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 pointer-events-none">
        <div className="pointer-events-auto relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-72 w-72 rounded-full object-cover shadow-2xl"
            />
          ) : (
            <div className="h-72 w-72 rounded-full bg-muted flex items-center justify-center text-6xl font-bold text-muted-foreground">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={onEdit}
              className="absolute bottom-4 right-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              aria-label="Edit photo"
            >
              <Camera className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto text-white/70 hover:text-white text-sm"
        >
          Close
        </button>
      </div>
    </>
  );
}
