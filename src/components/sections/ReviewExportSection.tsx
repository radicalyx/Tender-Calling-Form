import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Files,
} from 'lucide-react';
import {
  LocalPdfAttachment,
  SectionId,
  TenderFormData,
} from '../../types/tender';
import { ValidationSummary } from '../../utils/validation';
import {
  BU_ENDORSEMENT_GUIDANCE,
  calculateContractDuration,
  formatBytes,
} from '../../schema/tenderSchema';

interface ReviewExportSectionProps {
  formData: TenderFormData;
  attachments: LocalPdfAttachment[];
  validation: ValidationSummary;
  exportBusy: string | null;
  exportError: string | null;
  onJumpToSection: (section: SectionId) => void;
  onExportFormPdf: () => void;
  onExportCombinedPdf: () => void;
  onExportExcel: () => void;
}

export const ReviewExportSection: React.FC<ReviewExportSectionProps> = ({
  formData,
  attachments,
  validation,
  exportBusy,
  exportError,
  onJumpToSection,
  onExportFormPdf,
  onExportCombinedPdf,
  onExportExcel,
}) => {
  const ov = formData.overview;
  const ct = formData.contractTerms;
  const pr = formData.purchaseRequisition;
  const sow = formData.scheduleOfWorks;
  const dec = formData.declarations;

  const duration = calculateContractDuration(
    ct.clause5_2_commencementDate,
    ct.clause5_2_completionDate
  );

  const includedAppendices = attachments.filter((a) => a.includeInCombinedPdf);
  const missingIncludedAppendices = includedAppendices.filter(
    (a) => a.status !== 'loaded'
  );

  const isDraft = !validation.isFormComplete;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          8. Review & Local Export
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Review all entered fields before generating your local PDF or editable Excel
          workbook. All exports are created directly in your browser.
        </p>
      </div>

      {/* Validation Status Summary */}
      {validation.isFormComplete ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3">
          <CheckCircle2
            className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <div className="text-sm text-emerald-950">
            <p className="font-semibold">All required fields are complete</p>
            <p className="text-xs text-emerald-800 mt-0.5">
              Ready to download the Tender Request PDF, combined PDF package, or
              editable Excel workbook.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="w-5 h-5 text-amber-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-semibold text-amber-950">
                {validation.issues.length} incomplete or flagged item(s) — Exports will
                be marked as DRAFT
              </p>
              <p className="text-xs text-amber-900 mt-0.5">
                You may fix the items below or export a clearly labelled Draft PDF /
                Excel copy for internal review.
              </p>
            </div>
          </div>
          <ul className="space-y-1.5 pl-7 text-xs">
            {validation.issues.map((issue) => (
              <li
                key={issue.id}
                className="flex flex-wrap items-center justify-between gap-2 text-amber-950"
              >
                <span>{issue.message}</span>
                <button
                  type="button"
                  onClick={() => onJumpToSection(issue.section)}
                  className="font-semibold text-blue-800 hover:underline shrink-0"
                >
                  Go to section
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Export Action Panel */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Local Document Exports
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Document is identified as a Tender Request (not an approved contract).
              Excel lists attachment metadata; Combined PDF appends selected PDF pages.
            </p>
          </div>
        </div>

        {exportError && (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-800"
          >
            {exportError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            type="button"
            disabled={exportBusy !== null}
            onClick={onExportFormPdf}
            className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <FileText className="w-4 h-4 shrink-0" aria-hidden="true" />
            {exportBusy === 'form-pdf'
              ? 'Generating PDF...'
              : isDraft
              ? 'Download Draft Form PDF'
              : 'Download Form PDF'}
          </button>

          <button
            type="button"
            disabled={
              exportBusy !== null ||
              includedAppendices.length === 0 ||
              missingIncludedAppendices.length > 0
            }
            onClick={onExportCombinedPdf}
            title={
              includedAppendices.length === 0
                ? 'Select at least one loaded PDF attachment to include in combined export'
                : missingIncludedAppendices.length > 0
                ? 'Reselect missing PDF attachments before combined export'
                : undefined
            }
            className="flex items-center justify-center gap-2 rounded-md bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <Files className="w-4 h-4 shrink-0" aria-hidden="true" />
            {exportBusy === 'combined-pdf'
              ? 'Merging Appendices...'
              : isDraft
              ? `Draft Form + ${includedAppendices.length} Appendices PDF`
              : `Download Form + ${includedAppendices.length} Appendices PDF`}
          </button>

          <button
            type="button"
            disabled={exportBusy !== null}
            onClick={onExportExcel}
            className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
            {exportBusy === 'excel'
              ? 'Building Workbook...'
              : isDraft
              ? 'Download Draft Excel (.xlsx)'
              : 'Download Editable Excel (.xlsx)'}
          </button>
        </div>

        {includedAppendices.length === 0 && (
          <p className="text-xs text-slate-500">
            Tip: Attach local PDFs and tick &ldquo;Include in Combined Appendices PDF&rdquo;
            in Section 7 to enable the combined Form + Appendices PDF download.
          </p>
        )}
        {missingIncludedAppendices.length > 0 && (
          <p className="text-xs font-medium text-amber-800">
            Combined PDF export is blocked until {missingIncludedAppendices.length}{' '}
            missing selected appendix file(s) are reselected in Section 7.
          </p>
        )}
      </div>

      {/* Document Preview Sheet */}
      <div className="rounded-lg border border-slate-300 bg-white overflow-hidden">
        <div className="bg-slate-900 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Preview · Tender Request ({ov.contractType}) · Not an Approved Contract
            </p>
            <h3 className="text-base font-semibold mt-0.5">
              {ov.tenderSubject || 'Untitled Tender Request'}
            </h3>
          </div>
          {isDraft && (
            <span className="rounded border border-amber-400/60 bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
              DRAFT — INCOMPLETE
            </span>
          )}
        </div>

        <div className="p-6 space-y-6 text-sm">
          {/* Overview Preview */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">
              1. Tender Overview
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Property</dt>
                <dd className="font-medium text-slate-900">
                  {ov.propertyName || <span className="italic text-slate-400">[Not provided]</span>}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Employer</dt>
                <dd className="font-medium text-slate-900">
                  {ov.employerName || <span className="italic text-slate-400">[Not provided]</span>}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Business Unit &amp; Material Group</dt>
                <dd className="font-medium text-slate-900">
                  {ov.businessUnit === 'Other'
                    ? `Other (${ov.businessUnitOther || 'unspecified'})`
                    : ov.businessUnit || '[Not provided]'}{' '}
                  · {ov.materialGroup || '[Not provided]'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Primary Contact</dt>
                <dd className="font-medium text-slate-900">
                  {ov.contactPerson || '[Not provided]'} ·{' '}
                  <span className="font-mono">{ov.contactPhone || '-'}</span> ·{' '}
                  {ov.contactEmail || '-'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-slate-500">Service / Site Address</dt>
                <dd className="font-medium text-slate-900 whitespace-pre-wrap">
                  {ov.serviceSiteAddress || (
                    <span className="italic text-slate-400">[Not provided]</span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Contract Terms Key Highlights */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">
              2. Contract Terms Summary
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Clause 5.2 Contract Period</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {ct.clause5_2_commencementDate || '[Start]'} to{' '}
                  {ct.clause5_2_completionDate || '[End]'} ({duration.formatted})
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Clause 13.1 Payment &amp; 13.2 Retention</dt>
                <dd className="font-medium text-slate-900">
                  {ct.clause13_1_paymentType || '[Unselected]'} · Retention:{' '}
                  {ct.clause13_2_notApplicable
                    ? 'N/A'
                    : ct.clause13_2_retentionRatePct
                    ? `${ct.clause13_2_retentionRatePct}%`
                    : '[Not provided]'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Clause 22.1 Insurances</dt>
                <dd className="font-medium text-slate-900">
                  {ct.clause22_1_notApplicable
                    ? `Not applicable (${ct.clause22_1_naReason || 'no reason'})`
                    : `${ct.clause22_1_insurances.length} policy requirement(s)`}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Clause 33 Option to Renew</dt>
                <dd className="font-medium text-slate-900">
                  {ct.clause33_applicable || '[Unselected]'}{' '}
                  {ct.clause33_applicable === 'Applicable' && ct.clause33_renewalDuration
                    ? `(${ct.clause33_renewalDuration})`
                    : ''}
                </dd>
              </div>
            </dl>
          </section>

          {/* PR & Budget */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">
              3. Purchase Requisition Supporting Information
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div>
                <dt className="text-slate-500">Approved Budget</dt>
                <dd className="font-medium text-slate-900 font-mono tabular-nums">
                  {pr.approvedBudgetAmount
                    ? `${pr.budgetCurrency} ${Number(pr.approvedBudgetAmount).toLocaleString()}`
                    : '[Not provided]'}{' '}
                  · {pr.latestBudgetChecked ? 'Budget checked' : 'Check pending'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">
                  Endorsement ({ov.businessUnit || 'BU unselected'})
                </dt>
                <dd className="font-medium text-slate-900">
                  {pr.approvalStatus || '[Unselected]'}
                  {ov.businessUnit && BU_ENDORSEMENT_GUIDANCE[ov.businessUnit]
                    ? ` · Guidance: ${BU_ENDORSEMENT_GUIDANCE[ov.businessUnit].requirement}`
                    : ''}
                </dd>
              </div>
            </dl>
          </section>

          {/* SOW & Technical */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">
              4 &amp; 5. Schedule of Works &amp; Technical Schedules
            </h4>
            <div className="text-xs text-slate-800 space-y-1">
              <p>
                <span className="text-slate-500">Planned Service Visits:</span>{' '}
                {sow.plannedServiceVisits || '[Not specified]'}{' '}
                <span className="text-slate-500">· Scope Items:</span>{' '}
                {sow.scopeItems.length} · <span className="text-slate-500">SOR Rows:</span>{' '}
                {sow.sorApplicable === 'Not applicable'
                  ? 'Not applicable'
                  : sow.sorRows.length}
              </p>
              <p className="whitespace-pre-wrap text-slate-700 bg-slate-50 rounded border border-slate-200 p-3">
                {sow.scopeDescription || '[No multiline scope description entered]'}
              </p>
            </div>
          </section>

          {/* Declarations & Attachments */}
          <section className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 pb-1">
              6 &amp; 7. Requestor Confirmation &amp; Attachment Register
            </h4>
            <p className="text-xs text-slate-700">
              Requestor: <strong>{dec.requestorName || '[Not provided]'}</strong> ·
              Legacy COVID-19 Clause:{' '}
              <strong>
                {dec.includeLegacyCovidDeclaration ? 'Included' : 'Excluded (default)'}
              </strong>
            </p>
            {attachments.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No local PDF attachments.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-1.5 pr-3">Filename</th>
                      <th className="py-1.5 pr-3">Category</th>
                      <th className="py-1.5 pr-3">Pages</th>
                      <th className="py-1.5 pr-3">Size</th>
                      <th className="py-1.5">Combined PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attachments.map((att) => (
                      <tr key={att.id}>
                        <td className="py-1.5 pr-3 font-medium text-slate-900">
                          {att.filename}
                        </td>
                        <td className="py-1.5 pr-3">{att.category}</td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">
                          {att.pageCount ?? '-'}
                        </td>
                        <td className="py-1.5 pr-3 font-mono tabular-nums">
                          {formatBytes(att.sizeBytes)}
                        </td>
                        <td className="py-1.5">
                          {att.includeInCombinedPdf ? 'Included' : 'Excluded'}
                          {att.status !== 'loaded' ? ' (Missing file)' : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Bottom quick-download note */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>
          Remember to save a local JSON draft or download your PDF/Excel files before
          closing or refreshing this page.
        </span>
      </div>
    </div>
  );
};
