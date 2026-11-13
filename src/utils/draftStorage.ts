import {
  ATTACHMENT_CATEGORIES,
  AttachmentCategory,
  AttachmentDraftMetadata,
  LocalPdfAttachment,
  TenderDraftFile,
  TenderFormData,
} from '../types/tender';
import { createInitialFormData } from '../schema/tenderSchema';
import { sanitizeDownloadFilename, triggerLocalDownload } from './pdfAttachments';

export const DRAFT_SCHEMA_VERSION = 1;
export const DRAFT_APP_ID = 'tender-request-builder';

export function exportDraftJson(
  formData: TenderFormData,
  attachments: LocalPdfAttachment[]
): void {
  const metadataOnly: AttachmentDraftMetadata[] = attachments.map((att) => ({
    id: att.id,
    filename: att.filename,
    sizeBytes: att.sizeBytes,
    category: att.category,
    pageCount: att.pageCount,
    includeInCombinedPdf: att.includeInCombinedPdf,
    notes: att.notes,
  }));

  const draft: TenderDraftFile = {
    schemaVersion: DRAFT_SCHEMA_VERSION,
    app: DRAFT_APP_ID,
    savedAt: new Date().toISOString(),
    formData,
    attachments: metadataOnly,
  };

  const json = JSON.stringify(draft, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const datePart = new Date().toISOString().slice(0, 10);
  const baseName = sanitizeDownloadFilename(
    formData.overview.tenderSubject || formData.overview.propertyName,
    'tender-request'
  );
  triggerLocalDownload(blob, `${baseName}-draft-${datePart}.json`);
}

export interface ImportedDraftResult {
  ok: boolean;
  formData?: TenderFormData;
  attachments?: LocalPdfAttachment[];
  savedAt?: string;
  error?: string;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

export async function parseAndValidateDraftFile(
  file: File
): Promise<ImportedDraftResult> {
  if (file.size === 0) {
    return { ok: false, error: 'The selected draft file is empty.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return {
      ok: false,
      error: 'Draft JSON file exceeds 5 MB limit. Drafts should only contain form data and attachment metadata.',
    };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: 'Could not read the selected draft file.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: 'The selected file is not valid JSON. Select a draft file exported from Tender Request Builder.',
    };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: 'Invalid draft structure: root value must be a JSON object.' };
  }

  if (parsed.app !== DRAFT_APP_ID) {
    return {
      ok: false,
      error: 'Unrecognised draft file. Expected a Tender Request Builder draft JSON.',
    };
  }

  if (parsed.schemaVersion !== DRAFT_SCHEMA_VERSION) {
    return {
      ok: false,
      error: `Unsupported draft version (${String(parsed.schemaVersion)}). Expected version ${DRAFT_SCHEMA_VERSION}.`,
    };
  }

  if (!isPlainObject(parsed.formData)) {
    return { ok: false, error: 'Invalid draft file: missing formData section.' };
  }

  const defaults = createInitialFormData();
  const rawForm = parsed.formData;

  const requiredSections = [
    'overview',
    'contractTerms',
    'purchaseRequisition',
    'scheduleOfWorks',
    'declarations',
  ] as const;

  for (const key of requiredSections) {
    if (!isPlainObject(rawForm[key])) {
      return {
        ok: false,
        error: `Invalid draft file: missing or malformed "${key}" section.`,
      };
    }
  }

  const mergedForm: TenderFormData = {
    overview: {
      ...defaults.overview,
      ...(rawForm.overview as Partial<TenderFormData['overview']>),
    },
    contractTerms: {
      ...defaults.contractTerms,
      ...(rawForm.contractTerms as Partial<TenderFormData['contractTerms']>),
      clause22_1_insurances: Array.isArray(
        (rawForm.contractTerms as Record<string, unknown>).clause22_1_insurances
      )
        ? ((rawForm.contractTerms as Record<string, unknown>)
            .clause22_1_insurances as TenderFormData['contractTerms']['clause22_1_insurances'])
        : [],
    },
    purchaseRequisition: {
      ...defaults.purchaseRequisition,
      ...(rawForm.purchaseRequisition as Partial<TenderFormData['purchaseRequisition']>),
      referenceQuotations: Array.isArray(
        (rawForm.purchaseRequisition as Record<string, unknown>).referenceQuotations
      )
        ? ((rawForm.purchaseRequisition as Record<string, unknown>)
            .referenceQuotations as TenderFormData['purchaseRequisition']['referenceQuotations'])
        : [],
    },
    scheduleOfWorks: {
      ...defaults.scheduleOfWorks,
      ...(rawForm.scheduleOfWorks as Partial<TenderFormData['scheduleOfWorks']>),
      scopeItems: Array.isArray(
        (rawForm.scheduleOfWorks as Record<string, unknown>).scopeItems
      )
        ? ((rawForm.scheduleOfWorks as Record<string, unknown>)
            .scopeItems as TenderFormData['scheduleOfWorks']['scopeItems'])
        : [],
      appendixAttachmentIds: Array.isArray(
        (rawForm.scheduleOfWorks as Record<string, unknown>).appendixAttachmentIds
      )
        ? ((rawForm.scheduleOfWorks as Record<string, unknown>)
            .appendixAttachmentIds as string[])
        : [],
      sorRows: Array.isArray((rawForm.scheduleOfWorks as Record<string, unknown>).sorRows)
        ? ((rawForm.scheduleOfWorks as Record<string, unknown>)
            .sorRows as TenderFormData['scheduleOfWorks']['sorRows'])
        : [],
    },
    technicalSchedules: Array.isArray(rawForm.technicalSchedules)
      ? defaults.technicalSchedules.map((defItem) => {
          const match = (rawForm.technicalSchedules as Array<Record<string, unknown>>).find(
            (x) => isPlainObject(x) && x.key === defItem.key
          );
          if (!match) return defItem;
          return {
            ...defItem,
            applicable:
              match.applicable === 'Applicable' || match.applicable === 'Not applicable'
                ? match.applicable
                : '',
            details: typeof match.details === 'string' ? match.details : '',
            validityGuidance:
              typeof match.validityGuidance === 'string'
                ? match.validityGuidance
                : defItem.validityGuidance,
            attachmentIds: Array.isArray(match.attachmentIds)
              ? match.attachmentIds.filter((id): id is string => typeof id === 'string')
              : [],
          };
        })
      : defaults.technicalSchedules,
    adhocSpecifications: isPlainObject(rawForm.adhocSpecifications)
      ? {
          ...defaults.adhocSpecifications,
          ...(rawForm.adhocSpecifications as Partial<TenderFormData['adhocSpecifications']>),
          items: Array.isArray(rawForm.adhocSpecifications.items)
            ? (rawForm.adhocSpecifications.items as TenderFormData['adhocSpecifications']['items'])
            : [],
        }
      : defaults.adhocSpecifications,
    declarations: {
      ...defaults.declarations,
      ...(rawForm.declarations as Partial<TenderFormData['declarations']>),
    },
  };

  // Validate contractType
  if (
    mergedForm.overview.contractType !== 'Term Contract' &&
    mergedForm.overview.contractType !== 'Ad-hoc Works'
  ) {
    mergedForm.overview.contractType = 'Term Contract';
  }

  // Reconstruct missing attachment placeholders (never store binary PDFs in drafts)
  const rawAttachments = Array.isArray(parsed.attachments) ? parsed.attachments : [];
  const reconstructedAttachments: LocalPdfAttachment[] = rawAttachments
    .filter(isPlainObject)
    .map((item) => {
      const cat =
        typeof item.category === 'string' &&
        (ATTACHMENT_CATEGORIES as string[]).includes(item.category)
          ? (item.category as AttachmentCategory)
          : 'Other';
      return {
        id: typeof item.id === 'string' ? item.id : `att-${Math.random().toString(36).slice(2)}`,
        filename: typeof item.filename === 'string' ? item.filename : 'unknown.pdf',
        sizeBytes: typeof item.sizeBytes === 'number' ? item.sizeBytes : 0,
        category: cat,
        pageCount: typeof item.pageCount === 'number' ? item.pageCount : null,
        includeInCombinedPdf:
          typeof item.includeInCombinedPdf === 'boolean' ? item.includeInCombinedPdf : false,
        notes: typeof item.notes === 'string' ? item.notes : '',
        status: 'missing',
        errorMessage: 'Original PDF file must be reselected from your computer.',
        bytes: null,
      };
    });

  return {
    ok: true,
    formData: mergedForm,
    attachments: reconstructedAttachments,
    savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : undefined,
  };
}
