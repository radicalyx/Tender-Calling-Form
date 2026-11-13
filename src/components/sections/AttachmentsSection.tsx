import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Eye,
  FilePlus2,
  Lock,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ATTACHMENT_CATEGORIES,
  AttachmentCategory,
  INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES,
  LocalPdfAttachment,
} from '../../types/tender';
import { formatBytes } from '../../schema/tenderSchema';
import {
  MAX_SINGLE_PDF_BYTES,
  MAX_TOTAL_PDF_BYTES,
  defaultIncludeForCategory,
  validateAndReadLocalPdf,
} from '../../utils/pdfAttachments';

interface AttachmentsSectionProps {
  attachments: LocalPdfAttachment[];
  onChange: (next: LocalPdfAttachment[]) => void;
  onPreview: (attachment: LocalPdfAttachment) => void;
}

export const AttachmentsSection: React.FC<AttachmentsSectionProps> = ({
  attachments,
  onChange,
  onPreview,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [defaultCategory, setDefaultCategory] =
    useState<AttachmentCategory>('Technical Scope');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const totalLoadedBytes = attachments.reduce(
    (sum, a) => sum + (a.status === 'loaded' ? a.sizeBytes : 0),
    0
  );

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);
    setUploadErrors([]);

    const files = Array.from(fileList);
    let runningBytes = totalLoadedBytes;
    const added: LocalPdfAttachment[] = [];
    const errors: string[] = [];

    for (const file of files) {
      const result = await validateAndReadLocalPdf(
        file,
        defaultCategory,
        runningBytes
      );
      if (result.ok && result.attachment) {
        added.push(result.attachment);
        runningBytes += result.attachment.sizeBytes;
      } else if (result.error) {
        errors.push(result.error);
      }
    }

    if (added.length > 0) {
      onChange([...attachments, ...added]);
    }
    if (errors.length > 0) {
      setUploadErrors(errors);
    }
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReattach = async (targetAtt: LocalPdfAttachment, file: File | null) => {
    if (!file) return;
    setIsProcessing(true);
    setUploadErrors([]);

    const otherBytes = attachments.reduce(
      (sum, a) =>
        a.id !== targetAtt.id && a.status === 'loaded' ? sum + a.sizeBytes : sum,
      0
    );

    const result = await validateAndReadLocalPdf(
      file,
      targetAtt.category,
      otherBytes,
      targetAtt.id,
      targetAtt.notes,
      targetAtt.includeInCombinedPdf
    );

    if (result.ok && result.attachment) {
      onChange(
        attachments.map((a) => (a.id === targetAtt.id ? result.attachment! : a))
      );
    } else if (result.error) {
      setUploadErrors([result.error]);
    }
    setIsProcessing(false);
  };

  const updateAttachment = (
    id: string,
    patch: Partial<LocalPdfAttachment>
  ) => {
    onChange(attachments.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const handleCategoryChange = (att: LocalPdfAttachment, nextCat: AttachmentCategory) => {
    const isInternal = INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES.includes(nextCat);
    updateAttachment(att.id, {
      category: nextCat,
      includeInCombinedPdf: isInternal ? false : defaultIncludeForCategory(nextCat),
    });
  };

  const moveAttachment = (index: number, delta: -1 | 1) => {
    const nextIdx = index + delta;
    if (nextIdx < 0 || nextIdx >= attachments.length) return;
    const copy = [...attachments];
    const [item] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, item);
    onChange(copy);
  };

  const removeAttachment = (id: string) => {
    // Release Uint8Array reference explicitly before filtering
    onChange(
      attachments
        .map((a) => (a.id === id ? { ...a, bytes: null } : a))
        .filter((a) => a.id !== id)
    );
  };

  const missingCount = attachments.filter((a) => a.status !== 'loaded').length;
  let appendixCounter = 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          7. Local PDF Attachments
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Attach technical scopes, Schedules of Rates, drawings, house rules, reference
          quotations or approval records from your computer.
        </p>
      </div>

      {/* Mandatory Privacy Notice right near attachment controls */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck
            className="w-5 h-5 text-blue-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="space-y-1 text-xs text-blue-950 leading-relaxed">
            <p className="font-semibold">
              Your form data and selected documents are processed in your browser and are
              not uploaded to our servers. Download your work before closing or refreshing
              this page.
            </p>
            <p className="text-blue-900/90 tabular-nums">
              Local processing limits: max {formatBytes(MAX_SINGLE_PDF_BYTES)} per PDF ·{' '}
              max {formatBytes(MAX_TOTAL_PDF_BYTES)} total (currently using{' '}
              {formatBytes(totalLoadedBytes)}). Embedded PDF scripts are never executed.
            </p>
          </div>
        </div>
      </div>

      {/* Missing attachments alert (after draft reload) */}
      {missingCount > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 space-y-1"
        >
          <p className="font-semibold">
            {missingCount} attachment(s) from the loaded draft require reselection
          </p>
          <p>
            Draft JSON files store metadata only, not PDF contents. Use the{' '}
            <strong>Reselect PDF</strong> control on each flagged row below before
            generating a combined PDF export.
          </p>
        </div>
      )}

      {/* Upload / Dropzone Controls */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragging
            ? 'border-blue-600 bg-blue-50/60'
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              Drop local PDF files here or browse your device
            </p>
            <p className="text-xs text-slate-500">
              Files are validated for genuine PDF structure and page count in browser
              memory. Reference Quotations and Approvals are excluded from the combined
              tender appendix PDF by default.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <label className="sr-only" htmlFor="att-default-category">
              Default category for added PDFs
            </label>
            <select
              id="att-default-category"
              value={defaultCategory}
              onChange={(e) =>
                setDefaultCategory(e.target.value as AttachmentCategory)
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
            >
              {ATTACHMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat}
                </option>
              ))}
            </select>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={(e) => handleFiles(e.target.files)}
              className="hidden"
              id="local-pdf-picker"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
            >
              <FilePlus2 className="w-4 h-4" aria-hidden="true" />
              {isProcessing ? 'Validating PDF...' : 'Add local PDF'}
            </button>
          </div>
        </div>
      </div>

      {/* Actionable Upload Errors */}
      {uploadErrors.length > 0 && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-1.5"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-900">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              Attachment Validation Error
            </span>
            <button
              type="button"
              onClick={() => setUploadErrors([])}
              className="text-xs text-red-700 hover:underline"
            >
              Dismiss
            </button>
          </div>
          <ul className="list-disc pl-5 text-xs text-red-800 space-y-1">
            {uploadErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Attachment Register List */}
      {attachments.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-medium text-slate-700">
            No local PDF attachments added yet
          </p>
          <p className="text-xs text-slate-500 mt-1">
            You can still preview and export the standalone Tender Request PDF or Excel
            workbook without attachments.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {attachments.map((att, idx) => {
            const isInternalCategory =
              INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES.includes(att.category);
            const appendixCode = att.includeInCombinedPdf
              ? `Appendix ${String.fromCharCode(65 + appendixCounter++)}`
              : 'Excluded from combined PDF';

            return (
              <div
                key={att.id}
                className={`rounded-lg border p-4 space-y-3 ${
                  att.status !== 'loaded'
                    ? 'border-amber-300 bg-amber-50/50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      <span className="truncate max-w-md">{att.filename}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 tabular-nums">
                      <span>{formatBytes(att.sizeBytes)}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {att.pageCount !== null ? `${att.pageCount} page(s)` : 'Pages unknown'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          att.includeInCombinedPdf
                            ? 'font-semibold text-blue-700'
                            : 'text-slate-500'
                        }
                      >
                        {appendixCode}
                      </span>
                      {att.status !== 'loaded' && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-semibold text-amber-800">
                            Missing PDF file — reselect from device
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Row Controls */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveAttachment(idx, -1)}
                      aria-label={`Move ${att.filename} up`}
                      className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === attachments.length - 1}
                      onClick={() => moveAttachment(idx, 1)}
                      aria-label={`Move ${att.filename} down`}
                      className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    {att.status === 'loaded' ? (
                      <button
                        type="button"
                        onClick={() => onPreview(att)}
                        className="inline-flex items-center gap-1 rounded border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        Preview
                      </button>
                    ) : (
                      <label className="inline-flex items-center gap-1 rounded bg-amber-700 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-800 cursor-pointer whitespace-nowrap">
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        Reselect PDF
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="hidden"
                          onChange={(e) =>
                            handleReattach(att, e.target.files?.[0] || null)
                          }
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() => removeAttachment(att.id)}
                      aria-label={`Remove ${att.filename}`}
                      className="rounded border border-slate-200 bg-white p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700 hover:border-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Category, Combined PDF Checkbox & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 items-center">
                  <div className="md:col-span-3">
                    <label
                      htmlFor={`att-cat-${att.id}`}
                      className="sr-only"
                    >
                      Category for {att.filename}
                    </label>
                    <select
                      id={`att-cat-${att.id}`}
                      value={att.category}
                      onChange={(e) =>
                        handleCategoryChange(att, e.target.value as AttachmentCategory)
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      {ATTACHMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-5">
                    <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={att.includeInCombinedPdf}
                        onChange={(e) =>
                          updateAttachment(att.id, {
                            includeInCombinedPdf: e.target.checked,
                          })
                        }
                        className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span>Include in Combined Appendices PDF</span>
                    </label>
                    {isInternalCategory && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-amber-800">
                        <Lock className="w-3 h-3 shrink-0" aria-hidden="true" />
                        <span>
                          Internal record ({att.category}) — excluded by default unless
                          explicitly selected.
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-4">
                    <input
                      type="text"
                      aria-label={`Notes for ${att.filename}`}
                      value={att.notes}
                      onChange={(e) =>
                        updateAttachment(att.id, { notes: e.target.value })
                      }
                      placeholder="Optional appendix note or revision"
                      className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
