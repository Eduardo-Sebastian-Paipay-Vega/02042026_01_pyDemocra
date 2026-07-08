import { useCallback, useRef, useState } from "react";
import { ImageIcon, Upload, X } from "lucide-react";

interface ImageUploadFieldProps {
  label?: string;
  existingUrl?: string | null;
  previewFile?: File | null;
  onFileSelect: (file: File) => void;
  onClear: () => void;
  disabled?: boolean;
  accept?: string;
}

export function ImageUploadField({
  label = "Imagen",
  existingUrl,
  previewFile,
  onFileSelect,
  onClear,
  disabled = false,
  accept = "image/png,image/jpeg,image/webp,image/gif",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const previewSrc = previewFile
    ? URL.createObjectURL(previewFile)
    : existingUrl ?? null;

  const hasImage = Boolean(previewSrc);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        onFileSelect(file);
      }
    },
    [disabled, onFileSelect]
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-[11px]" style={{ color: "var(--t-text-dim)" }}>{label}</p>
      )}

      <div
        className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors"
        style={{
          border: isDragging
            ? "1.5px dashed var(--t-accent, #6366f1)"
            : "1px solid var(--t-border)",
          background: isDragging ? "var(--t-hover)" : "var(--t-input-bg)",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {hasImage ? (
          <img
            src={previewSrc!}
            alt="preview"
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--t-hover)" }}
          >
            <ImageIcon className="h-4 w-4" style={{ color: "var(--t-text-dim)" }} />
          </div>
        )}

        <span className="flex-1 truncate text-[12px]" style={{ color: "var(--t-text-tertiary)" }}>
          {previewFile
            ? previewFile.name
            : existingUrl
            ? "Imagen actual"
            : isDragging
            ? "Suelta la imagen aquí"
            : "Sin imagen — arrastra o usa el botón"}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] transition-colors hover:bg-[var(--t-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{ color: "var(--t-text-secondary)" }}
          >
            <Upload className="h-3 w-3" />
            {hasImage ? "Cambiar" : "Subir"}
          </button>

          {hasImage && (
            <button
              type="button"
              disabled={disabled}
              onClick={onClear}
              className="flex h-6 w-6 items-center justify-center rounded-lg transition-colors hover:bg-[var(--t-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: "var(--t-text-dim)" }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
