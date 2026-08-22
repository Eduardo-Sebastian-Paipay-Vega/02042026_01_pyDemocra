import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import type { IdCardRenderSubject, IdCardTemplateFieldRow } from "../types";
import {
  downloadIdCardPng,
  exportIdCardPngDataUrl,
  renderIdCardCanvas,
} from "../idCardCanvas";

export interface IdCardCanvasPreviewHandle {
  exportPngDataUrl: () => Promise<string>;
  downloadPng: (filename: string) => Promise<void>;
}

export const IdCardCanvasPreview = forwardRef<
  IdCardCanvasPreviewHandle,
  {
    baseImageUrl: string | null;
    templateWidth: number;
    templateHeight: number;
    fields: IdCardTemplateFieldRow[];
    subject: IdCardRenderSubject;
    className?: string;
  }
>(function IdCardCanvasPreview(
  { baseImageUrl, templateWidth, templateHeight, fields, subject, className },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const renderInput = {
    baseImageUrl,
    templateWidth,
    templateHeight,
    fields,
    subject,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let active = true;
    setError(null);

    renderIdCardCanvas(canvas, renderInput).catch((renderError: unknown) => {
      if (!active) {
        return;
      }

      setError(
        renderError instanceof Error
          ? renderError.message
          : "No se pudo renderizar la credencial."
      );
    });

    return () => {
      active = false;
    };
  }, [baseImageUrl, fields, renderInput, subject, templateHeight, templateWidth]);

  useImperativeHandle(
    ref,
    () => ({
      exportPngDataUrl: async () => exportIdCardPngDataUrl(renderInput),
      downloadPng: async (filename: string) => downloadIdCardPng(renderInput, filename),
    }),
    [renderInput]
  );

  const previewWidth = Math.min(420, Math.max(220, templateWidth));
  const scale = previewWidth / Math.max(1, templateWidth);

  return (
    <div className={className}>
      <div
        className="overflow-hidden rounded-2xl"
        style={{
          background: "var(--t-hover)",
          border: "1px solid var(--t-border)",
          width: previewWidth,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            width: previewWidth,
            height: Math.round(templateHeight * scale),
          }}
        />
      </div>
      {error && (
        <p className="mt-2 text-[11px]" style={{ color: "var(--t-danger, #ef4444)" }}>
          {error}
        </p>
      )}
    </div>
  );
});

