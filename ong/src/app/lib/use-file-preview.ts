import { useEffect, useState } from "react";

export function useFilePreview(
  file: File | null,
  fallbackUrl: string | null
): string | null {
  const [previewUrl, setPreviewUrl] = useState<string | null>(fallbackUrl);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(fallbackUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [fallbackUrl, file]);

  return previewUrl;
}

