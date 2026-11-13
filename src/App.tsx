import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  RotateCcw,
  Save,
  Shield,
} from 'lucide-react';
import {
  LocalPdfAttachment,
  SectionId,
  TenderFormData,
} from './types/tender';
import { createInitialFormData } from './schema/tenderSchema';
import { validateTenderForm } from './utils/validation';
import { exportDraftJson, parseAndValidateDraftFile } from './utils/draftStorage';
import { downloadTenderPdf } from './utils/pdfExport';
import { downloadTenderExcel } from './utils/excelExport';
import { ConfirmDialog } from './components/ConfirmDialog';
import { PdfPreviewModal } from './components/PdfPreviewModal';
import { OverviewSection } from './components/sections/OverviewSection';
import { ContractTermsSection } from './components/sections/ContractTermsSection';
import { PurchaseReqSection } from './components/sections/PurchaseReqSection';
import { ScheduleOfWorksSection } from './components/sections/ScheduleOfWorksSection';
import { TechnicalSchedulesSection } from './components/sections/TechnicalSchedulesSection';
import { DeclarationsSection } from './components/sections/DeclarationsSection';
import { AttachmentsSection } from './components/sections/AttachmentsSection';
import { ReviewExportSection } from './components/sections/ReviewExportSection';

const SECTION_ORDER: SectionId[] = [
  'overview',
  'contract-terms',
  'purchase-requisition',
  'schedule-of-works',
  'technical-schedules',
  'declarations',
  'attachments',
  'review',
];

export default function App() {
  const [formData, setFormData] = useState<TenderFormData>(() =>
    createInitialFormData()
  );
  const [attachments, setAttachments] = useState<LocalPdfAttachment[]>([]);
  const [activeSection, setActiveSection] = useState<SectionId>('overview');
  const [isDirty, setIsDirty] = useState(false);

  const [previewAttachment, setPreviewAttachment] =
    useState<LocalPdfAttachment | null>(null);

  const [exportBusy, setExportBusy] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<{
    tone: 'info' | 'warning' | 'error';
    message: string;
  } | null>(null);

  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [pendingDraftFile, setPendingDraftFile] = useState<File | null>(null);
  const [pendingDraftConfirmOpen, setPendingDraftConfirmOpen] = useState(false);
  const [draftExportConfirm, setDraftExportConfirm] = useState<
    null | 'form-pdf' | 'combined-pdf' | 'excel'
  >(null);

  const draftInputRef = useRef<HTMLInputElement | null>(null);

  const validation = useMemo(
    () => validateTenderForm(formData, attachments),
    [formData, attachments]
  );

  // Warn user if closing or refreshing with unsaved in-memory work
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty || attachments.length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, attachments.length]);

  const updateFormData = (updater: (prev: TenderFormData) => TenderFormData) => {
    setFormData(updater);
    setIsDirty(true);
  };

  const updateAttachments = (next: LocalPdfAttachment[]) => {
    setAttachments(next);
    setIsDirty(true);
  };

  const executeClearForm = () => {
    // Explicitly release in-memory PDF byte references
    setAttachments((prev) => {
      prev.forEach((a) => {
        a.bytes = null;
      });
      return [];
    });
    setFormData(createInitialFormData());
    setIsDirty(false);
    setActiveSection('overview');
    setExportError(null);
    setStatusBanner({
      tone: 'info',
      message: 'Started a fresh blank tender request form.',
    });
    setConfirmClearOpen(false);
  };

  const handleRequestClear = () => {
    if (isDirty || attachments.length > 0) {
      setConfirmClearOpen(true);
    } else {
      executeClearForm();
    }
  };

  const handleSaveDraft = () => {
    exportDraftJson(formData, attachments);
    setStatusBanner({
      tone: 'info',
      message:
        'Saved local draft JSON (form data and attachment metadata only; PDF binaries are not included).',
    });
  };

  const importDraftNow = async (file: File) => {
    const res = await parseAndValidateDraftFile(file);
    if (!res.ok || !res.formData) {
      setStatusBanner({
        tone: 'error',
        message: res.error || 'Could not import draft file.',
      });
      return;
    }

    // Release existing PDF memory references
    setAttachments((prev) => {
      prev.forEach((a) => {
        a.bytes = null;
      });
      return res.attachments || [];
    });
    setFormData(res.formData);
    setIsDirty(true);
    setExportError(null);

    const missingCount = (res.attachments || []).length;
    setStatusBanner({
      tone: missingCount > 0 ? 'warning' : 'info',
      message:
        missingCount > 0
          ? `Draft loaded. ${missingCount} PDF attachment(s) from this draft must be reselected in Section 7 before combined PDF export.`
          : 'Draft loaded into browser memory.',
    });
    if (missingCount > 0) {
      setActiveSection('attachments');
    }
  };

  const handleDraftFileSelected = (file: File | null) => {
    if (draftInputRef.current) {
      draftInputRef.current.value = '';
    }
    if (!file) return;
    if (isDirty || attachments.length > 0) {
      setPendingDraftFile(file);
      setPendingDraftConfirmOpen(true);
    } else {
      void importDraftNow(file);
    }
  };

  const runExport = async (mode: 'form-pdf' | 'combined-pdf' | 'excel') => {
    setExportBusy(mode);
    setExportError(null);
    const isDraft = !validation.isFormComplete;

    try {
      if (mode === 'form-pdf') {
        await downloadTenderPdf(formData, attachments, {
          includeAppendices: false,
          isDraft,
          validationIssueCount: validation.issues.length,
        });
      } else if (mode === 'combined-pdf') {
        await downloadTenderPdf(formData, attachments, {
          includeAppendices: true,
          isDraft,
          validationIssueCount: validation.issues.length,
        });
      } else {
        await downloadTenderExcel(formData, attachments, { isDraft });
      }
      setStatusBanner({
        tone: 'info',
        message:
          mode === 'excel'
            ? 'Editable Excel (.xlsx) workbook generated locally and downloaded.'
            : mode === 'combined-pdf'
            ? 'Combined Form + Appendices PDF generated locally and downloaded.'
            : 'Tender Request Form PDF generated locally and downloaded.',
      });
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Export failed. Check attached PDFs and form entries.';
      setExportError(msg);
      setStatusBanner({ tone: 'error', message: msg });
    } finally {
      setExportBusy(null);
    }
  };

  const requestExport = (mode: 'form-pdf' | 'combined-pdf' | 'excel') => {
    if (!validation.isFormComplete) {
      setDraftExportConfirm(mode);
    } else {
      void runExport(mode);
    }
  };

  const currentIdx = SECTION_ORDER.indexOf(activeSection);
  const goToSection = (sec: SectionId) => {
    setActiveSection(sec);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalCompleted = SECTION_ORDER.slice(0, 6).reduce(
    (acc, sec) => acc + validation.sectionProgress[sec].completed,
    0
  );
  const totalRequiredChecks = SECTION_ORDER.slice(0, 6).reduce(
    (acc, sec) => acc + validation.sectionProgress[sec].total,
    0
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Bar Contract: 3 zones (Brand wordmark — Nav links — 1 primary CTA) */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              goToSection('overview');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Tender Request Builder
          </a>

          <nav
            aria-label="Primary workspace views"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
          >
            <button
              type="button"
              onClick={() =>
                goToSection(
                  activeSection === 'attachments' || activeSection === 'review'
                    ? 'overview'
                    : activeSection
                )
              }
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection !== 'attachments' && activeSection !== 'review'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent'
              }`}
            >
              Tender Form
            </button>
            <button
              type="button"
              onClick={() => goToSection('attachments')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'attachments'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent'
              }`}
            >
              Attachments
            </button>
            <button
              type="button"
              onClick={() => goToSection('review')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeSection === 'review'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent'
              }`}
            >
              Preview
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => goToSection('review')}
              className="rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              Review &amp; Export
            </button>
          </div>
        </div>
      </header>

      {/* Workspace Action & Privacy Toolbar */}
      <div className="border-b border-slate-200 bg-slate-100/70">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-4 sm:px-6 py-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
              <Shield className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              Local Browser Session
            </span>
            <span aria-hidden="true">·</span>
            <span>{formData.overview.contractType}</span>
            <span aria-hidden="true">·</span>
            <span>
              {totalCompleted}/{totalRequiredChecks} core fields
            </span>
            <span aria-hidden="true">·</span>
            <span>{attachments.length} PDF(s)</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500">
              Refreshing or closing loses unsaved in-memory work
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRequestClear}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              New / Clear Form
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Save className="w-3.5 h-3.5" aria-hidden="true" />
              Save Draft
            </button>

            <input
              ref={draftInputRef}
              type="file"
              accept=".json,application/json"
              onChange={(e) => handleDraftFileSelected(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => draftInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <FolderOpen className="w-3.5 h-3.5" aria-hidden="true" />
              Load Draft
            </button>

            <button
              type="button"
              onClick={() => goToSection('review')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              Preview
            </button>

            <button
              type="button"
              disabled={exportBusy !== null}
              onClick={() => requestExport('form-pdf')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <FileText className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
              Export PDF
            </button>

            <button
              type="button"
              disabled={exportBusy !== null}
              onClick={() => requestExport('excel')}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <FileSpreadsheet
                className="w-3.5 h-3.5 text-emerald-700"
                aria-hidden="true"
              />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Status Notification Banner */}
      {statusBanner && (
        <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 pt-4">
          <div
            role={statusBanner.tone === 'error' ? 'alert' : 'status'}
            className={`flex items-center justify-between gap-4 rounded-md border px-4 py-2.5 text-xs font-medium ${
              statusBanner.tone === 'error'
                ? 'border-red-200 bg-red-50 text-red-900'
                : statusBanner.tone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
            }`}
          >
            <span>{statusBanner.message}</span>
            <button
              type="button"
              onClick={() => setStatusBanner(null)}
              className="underline shrink-0"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Content Layout: Left Sidebar + Form Canvas */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col lg:flex-row gap-8 px-4 sm:px-6 py-6">
        {/* Mobile Section Selector */}
        <div className="lg:hidden">
          <label htmlFor="mobile-section-select" className="sr-only">
            Jump to section
          </label>
          <select
            id="mobile-section-select"
            value={activeSection}
            onChange={(e) => goToSection(e.target.value as SectionId)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900"
          >
            {SECTION_ORDER.map((secId) => {
              const p = validation.sectionProgress[secId];
              return (
                <option key={secId} value={secId}>
                  {p.label} ({p.completed}/{p.total})
                </option>
              );
            })}
          </select>
        </div>

        {/* Desktop Sidebar Navigation */}
        <aside
          aria-label="Tender request sections"
          className="hidden lg:block w-[270px] shrink-0"
        >
          <div className="sticky top-20 space-y-4">
            <nav className="rounded-lg border border-slate-200 bg-white p-2 space-y-1">
              {SECTION_ORDER.map((secId) => {
                const prog = validation.sectionProgress[secId];
                const active = activeSection === secId;

                return (
                  <button
                    key={secId}
                    type="button"
                    onClick={() => goToSection(secId)}
                    aria-current={active ? 'step' : undefined}
                    className={`w-full flex items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                      active
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <span className="truncate">{prog.label}</span>
                    <span
                      className={`shrink-0 font-mono tabular-nums text-[11px] flex items-center gap-1 ${
                        active ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {prog.errorCount > 0 && secId !== 'review' && (
                        <AlertCircle
                          className={`w-3.5 h-3.5 ${
                            active ? 'text-amber-300' : 'text-amber-600'
                          }`}
                          aria-label={`${prog.errorCount} validation item(s)`}
                        />
                      )}
                      {secId === 'attachments'
                        ? `${prog.completed}/${prog.total}`
                        : secId === 'review'
                        ? validation.isFormComplete
                          ? 'Ready'
                          : 'Draft'
                        : `${prog.completed}/${prog.total}`}
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 text-xs text-slate-600 leading-relaxed">
              <p className="font-semibold text-slate-900">Privacy &amp; Local Memory</p>
              <p>
                All inputs, PDF validations, previews, and PDF/Excel exports run strictly
                inside your browser. Nothing is uploaded or stored on remote servers.
              </p>
            </div>
          </div>
        </aside>

        {/* Active Section Canvas */}
        <main className="flex-1 min-w-0 max-w-4xl">
          {activeSection === 'overview' && (
            <OverviewSection
              value={formData.overview}
              onChange={(next) =>
                updateFormData((prev) => ({ ...prev, overview: next }))
              }
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'contract-terms' && (
            <ContractTermsSection
              value={formData.contractTerms}
              contractType={formData.overview.contractType}
              onChange={(next) =>
                updateFormData((prev) => ({ ...prev, contractTerms: next }))
              }
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'purchase-requisition' && (
            <PurchaseReqSection
              value={formData.purchaseRequisition}
              overviewBusinessUnit={formData.overview.businessUnit}
              overviewMaterialGroup={formData.overview.materialGroup}
              onChange={(next) =>
                updateFormData((prev) => ({ ...prev, purchaseRequisition: next }))
              }
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'schedule-of-works' && (
            <ScheduleOfWorksSection
              value={formData.scheduleOfWorks}
              overview={formData.overview}
              contractTerms={formData.contractTerms}
              attachments={attachments}
              onChange={(next) =>
                updateFormData((prev) => ({ ...prev, scheduleOfWorks: next }))
              }
              onJumpToSection={(sec) => goToSection(sec)}
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'technical-schedules' && (
            <TechnicalSchedulesSection
              schedules={formData.technicalSchedules}
              adhocSpecs={formData.adhocSpecifications}
              contractType={formData.overview.contractType}
              attachments={attachments}
              onChangeSchedules={(next) =>
                updateFormData((prev) => ({ ...prev, technicalSchedules: next }))
              }
              onChangeAdhocSpecs={(next) =>
                updateFormData((prev) => ({ ...prev, adhocSpecifications: next }))
              }
              onJumpToAttachments={() => goToSection('attachments')}
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'declarations' && (
            <DeclarationsSection
              value={formData.declarations}
              onChange={(next) =>
                updateFormData((prev) => ({ ...prev, declarations: next }))
              }
              errors={validation.issuesByField}
            />
          )}

          {activeSection === 'attachments' && (
            <AttachmentsSection
              attachments={attachments}
              onChange={updateAttachments}
              onPreview={(att) => setPreviewAttachment(att)}
            />
          )}

          {activeSection === 'review' && (
            <ReviewExportSection
              formData={formData}
              attachments={attachments}
              validation={validation}
              exportBusy={exportBusy}
              exportError={exportError}
              onJumpToSection={goToSection}
              onExportFormPdf={() => void runExport('form-pdf')}
              onExportCombinedPdf={() => void runExport('combined-pdf')}
              onExportExcel={() => void runExport('excel')}
            />
          )}

          {/* Section Step Navigation */}
          <div className="mt-10 flex items-center justify-between border-t border-slate-200 pt-5">
            <button
              type="button"
              disabled={currentIdx <= 0}
              onClick={() => goToSection(SECTION_ORDER[currentIdx - 1])}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Previous Section
            </button>

            {currentIdx < SECTION_ORDER.length - 1 ? (
              <button
                type="button"
                onClick={() => goToSection(SECTION_ORDER[currentIdx + 1])}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
              >
                Next Section
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToSection('overview')}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
              >
                Back to Tender Overview
              </button>
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <PdfPreviewModal
        attachment={previewAttachment}
        onClose={() => setPreviewAttachment(null)}
      />

      <ConfirmDialog
        open={confirmClearOpen}
        title="Clear current tender request form?"
        description="This clears all form inputs and releases attached PDF files from browser memory. Unsaved changes will be lost unless you save a local draft first."
        confirmLabel="Clear Form"
        tone="danger"
        onConfirm={executeClearForm}
        onCancel={() => setConfirmClearOpen(false)}
      />

      <ConfirmDialog
        open={pendingDraftConfirmOpen}
        title="Replace current work with loaded draft?"
        description="Loading a saved JSON draft will replace the current form fields and clear currently attached PDFs. Original PDF files must be reselected after loading."
        confirmLabel="Load Draft"
        tone="warning"
        onConfirm={() => {
          const f = pendingDraftFile;
          setPendingDraftFile(null);
          setPendingDraftConfirmOpen(false);
          if (f) void importDraftNow(f);
        }}
        onCancel={() => {
          setPendingDraftFile(null);
          setPendingDraftConfirmOpen(false);
        }}
      />

      <ConfirmDialog
        open={draftExportConfirm !== null}
        title="Required fields are incomplete — Export as Draft?"
        description={`There are ${validation.issues.length} incomplete or flagged item(s). You can download a clearly labelled DRAFT export now, or go to Review & Export to complete missing fields.`}
        confirmLabel="Download Draft Export"
        tone="primary"
        onConfirm={() => {
          const mode = draftExportConfirm;
          setDraftExportConfirm(null);
          if (mode) void runExport(mode);
        }}
        onCancel={() => setDraftExportConfirm(null)}
      />
    </div>
  );
}
