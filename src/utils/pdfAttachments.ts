import { PDFDocument, EncryptedPDFError } from 'pdf-lib';
import {
  AttachmentCategory,
  INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES,
  LocalPdfAttachment,
} from '../types/tender';
import { createId } from '../schema/tenderSchema';

export const MAX_SINGLE_PDF_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_TOTAL_PDF_BYTES = 100 * 1024 * 1024; // 100 MB

export interface PdfValidationResult {
  ok: boolean;
  attachment?: LocalPdfAttachment;
  error?: string;
}

function hasPdfMagicHeader(bytes: Uint8Array): boolean {
  if (bytes.length < 5) return false;
  const headerSlice = bytes.subarray(0, Math.min(bytes.length, 1024));
  let headerStr = '';
  for (let i = 0; i < headerSlice.length; i++) {
    headerStr += String.fromCharCode(headerSlice[i]);
  }
  return headerStr.includes('%PDF-');
}

export function defaultIncludeForCategory(category: AttachmentCategory): boolean {
  return !INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES.includes(category);
}

export async function validateAndReadLocalPdf(
  file: File,
  category: AttachmentCategory,
  currentTotalBytes: number,
  existingId?: string,
  existingNotes = '',
  existingIncludeFlag?: boolean
): Promise<PdfValidationResult> {
  if (file.size === 0) {
    return {
      ok: false,
      error: `"${file.name}" is empty (0 bytes) and cannot be attached.`,
    };
  }

  if (file.size > MAX_SINGLE_PDF_BYTES) {
    return {
      ok: false,
      error: `"${file.name}" exceeds the 25 MB local processing limit per file.`,
    };
  }

  if (currentTotalBytes + file.size > MAX_TOTAL_PDF_BYTES) {
    return {
      ok: false,
      error: `Adding "${file.name}" would exceed the 100 MB total local attachment limit. Remove unused files or compress the PDF before attaching.`,
    };
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch {
    return {
      ok: false,
      error: `Could not read "${file.name}" from your device. Check file permissions and try again.`,
    };
  }

  const bytes = new Uint8Array(buffer);

  if (!hasPdfMagicHeader(bytes)) {
    return {
      ok: false,
      error: `"${file.name}" is not a readable PDF (missing %PDF- signature). Do not rename non-PDF files to .pdf.`,
    };
  }

  try {
    const pdfDoc = await PDFDocument.load(bytes, {
      ignoreEncryption: false,
      throwOnInvalidObject: true,
    });
    const pageCount = pdfDoc.getPageCount();
    if (pageCount < 1) {
      return {
        ok: false,
        error: `"${file.name}" contains 0 readable pages.`,
      };
    }

    const includeInCombinedPdf =
      typeof existingIncludeFlag === 'boolean'
        ? existingIncludeFlag
        : defaultIncludeForCategory(category);

    return {
      ok: true,
      attachment: {
        id: existingId || createId(),
        filename: file.name,
        sizeBytes: file.size,
        category,
        pageCount,
        includeInCombinedPdf,
        notes: existingNotes,
        status: 'loaded',
        bytes,
      },
    };
  } catch (err) {
    const isEncrypted =
      err instanceof EncryptedPDFError ||
      (err instanceof Error && err.message.toLowerCase().includes('encrypt'));

    if (isEncrypted) {
      return {
        ok: false,
        error: `"${file.name}" is encrypted or password-protected. Please remove password protection or supply an unlocked PDF before attaching.`,
      };
    }

    return {
      ok: false,
      error: `"${file.name}" could not be parsed as a valid PDF (it may be corrupted or use unsupported PDF structures).`,
    };
  }
}

export function triggerLocalDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1500);
}

export function sanitizeDownloadFilename(raw: string, fallback = 'tender-request'): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return cleaned || fallback;
}
