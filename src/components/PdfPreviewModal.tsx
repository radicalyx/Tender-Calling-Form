import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { LocalPdfAttachment } from '../types/tender';
import { formatBytes } from '../schema/tenderSchema';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfPreviewModalProps {
  attachment: LocalPdfAttachment | null;
  onClose: () => void;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  attachment,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [loading, setLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!attachment) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [attachment, onClose]);

  useEffect(() => {
    let active = true;
    let loadingTask: pdfjsLib.PDFDocumentLoadingTask | null = null;

    async function loadDocument() {
      if (!attachment || !attachment.bytes) {
        setPdfDoc(null);
        setTotalPages(0);
        return;
      }
      setLoading(true);
      setRenderError(null);
      setPageNumber(1);

      try {
        // Pass a cloned Uint8Array so worker postMessage never detaches attachment.bytes
        loadingTask = pdfjsLib.getDocument({
          data: attachment.bytes.slice(),
          enableXfa: false,
          useSystemFonts: false,
          disableAutoFetch: true,
          stopAtErrors: true,
        });
        const loadedDoc = await loadingTask.promise;
        if (!active) {
          await loadingTask.destroy();
          return;
        }
        setPdfDoc(loadedDoc);
        setTotalPages(loadedDoc.numPages);
      } catch {
        if (active) {
          setRenderError(
            'Unable to render this PDF preview safely in the browser. Verify the file is not encrypted or corrupted.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDocument();

    return () => {
      active = false;
      if (loadingTask) {
        loadingTask.destroy().catch(() => {});
      }
    };
  }, [attachment]);

  useEffect(() => {
    let cancelled = false;
    let renderTask: pdfjsLib.RenderTask | null = null;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (cancelled) return;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform =
          outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        renderTask = page.render({
          canvasContext: context,
          canvas,
          transform,
          viewport,
        });
        await renderTask.promise;
      } catch (err) {
        if (!cancelled && err instanceof Error && err.name !== 'RenderingCancelledException') {
          setRenderError('Failed to render PDF page.');
        }
      }
    }

    renderPage();
    return () => {
      cancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  if (!attachment) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-preview-title"
    >
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3">
          <div className="min-w-0">
            <h2
              id="pdf-preview-title"
              className="truncate text-sm font-semibold text-slate-900"
            >
              {attachment.filename}
            </h2>
            <p className="text-xs text-slate-500 tabular-nums">
              {attachment.category} · {formatBytes(attachment.sizeBytes)} ·{' '}
              {totalPages || attachment.pageCount || '-'} page(s) · Local sandboxed preview
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(2)))}
              className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-slate-700 tabular-nums w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setScale((s) => Math.min(2.4, +(s + 0.2).toFixed(2)))}
              className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="mx-2 h-5 w-px bg-slate-300" aria-hidden="true" />

            <button
              type="button"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs text-slate-700 tabular-nums whitespace-nowrap px-1">
              {pageNumber} / {totalPages || '-'}
            </span>
            <button
              type="button"
              disabled={pageNumber >= totalPages}
              onClick={() => setPageNumber((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-slate-300 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Close
            </button>
          </div>
        </div>

        {/* Canvas viewport */}
        <div className="flex-1 overflow-auto bg-slate-200/70 p-6 flex justify-center items-start">
          {loading && (
            <div className="rounded-md bg-white border border-slate-200 px-5 py-4 text-sm text-slate-600">
              Rendering PDF locally...
            </div>
          )}
          {renderError && (
            <div className="rounded-md bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-800 max-w-lg">
              {renderError}
            </div>
          )}
          {!loading && !renderError && pdfDoc && (
            <canvas
              ref={canvasRef}
              className="shadow-md bg-white border border-slate-300"
            />
          )}
        </div>
      </div>
    </div>
  );
};
