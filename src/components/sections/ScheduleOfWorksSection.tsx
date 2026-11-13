import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  ContractTerms,
  ContractType,
  LocalPdfAttachment,
  ScheduleOfWorks,
  TenderOverview,
} from '../../types/tender';
import {
  CURRENCY_OPTIONS,
  calculateContractDuration,
  createEmptyScopeItem,
  createEmptySorRow,
} from '../../schema/tenderSchema';
import {
  FieldWrapper,
  GuidanceCallout,
  baseInputClass,
} from '../FormControls';

interface ScheduleOfWorksSectionProps {
  value: ScheduleOfWorks;
  overview: TenderOverview;
  contractTerms: ContractTerms;
  attachments: LocalPdfAttachment[];
  onChange: (next: ScheduleOfWorks) => void;
  onJumpToSection: (sec: 'contract-terms' | 'attachments' | 'declarations') => void;
  errors: Record<string, string>;
}

export const ScheduleOfWorksSection: React.FC<ScheduleOfWorksSectionProps> = ({
  value,
  overview,
  contractTerms,
  attachments,
  onChange,
  onJumpToSection,
  errors,
}) => {
  const update = <K extends keyof ScheduleOfWorks>(key: K, fieldVal: ScheduleOfWorks[K]) => {
    onChange({ ...value, [key]: fieldVal });
  };

  const duration = calculateContractDuration(
    contractTerms.clause5_2_commencementDate,
    contractTerms.clause5_2_completionDate
  );

  const toggleAppendix = (id: string) => {
    const exists = value.appendixAttachmentIds.includes(id);
    update(
      'appendixAttachmentIds',
      exists
        ? value.appendixAttachmentIds.filter((x) => x !== id)
        : [...value.appendixAttachmentIds, id]
    );
  };

  const addScopeItem = () => {
    update('scopeItems', [
      ...value.scopeItems,
      createEmptyScopeItem(value.scopeItems.length + 1),
    ]);
  };

  const updateScopeItem = (
    idx: number,
    patch: Partial<ScheduleOfWorks['scopeItems'][number]>
  ) => {
    update(
      'scopeItems',
      value.scopeItems.map((item, i) => (i === idx ? { ...item, ...patch } : item))
    );
  };

  const removeScopeItem = (idx: number) => {
    update(
      'scopeItems',
      value.scopeItems.filter((_, i) => i !== idx)
    );
  };

  const addSorRow = () => {
    update('sorRows', [...value.sorRows, createEmptySorRow()]);
  };

  const updateSorRow = (
    idx: number,
    patch: Partial<ScheduleOfWorks['sorRows'][number]>
  ) => {
    update(
      'sorRows',
      value.sorRows.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const removeSorRow = (idx: number) => {
    update(
      'sorRows',
      value.sorRows.filter((_, i) => i !== idx)
    );
  };

  const contractType: ContractType = overview.contractType;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          4. Schedule of Works (Sections A–G)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Structured schedule matching the source SOW sections A through G.
          {contractType === 'Ad-hoc Works' &&
            ' Recurring service frequency and manpower fields are optional for Ad-hoc Works.'}
        </p>
      </div>

      {/* Section A */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          A. Project & Site Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.projectTitleSameAsOverview}
                onChange={(e) => update('projectTitleSameAsOverview', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Same as Tender Subject in Overview</span>
            </label>
            <FieldWrapper
              id="sow-projectTitle"
              label="Project Title"
              error={errors.projectTitle}
            >
              <input
                id="sow-projectTitle"
                type="text"
                disabled={value.projectTitleSameAsOverview}
                value={
                  value.projectTitleSameAsOverview
                    ? overview.tenderSubject
                    : value.projectTitle
                }
                onChange={(e) => update('projectTitle', e.target.value)}
                placeholder="Enter project title"
                className={baseInputClass(
                  Boolean(errors.projectTitle),
                  value.projectTitleSameAsOverview
                )}
              />
            </FieldWrapper>
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.siteAddressSameAsOverview}
                onChange={(e) => update('siteAddressSameAsOverview', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Same as Service / Site Address in Overview</span>
            </label>
            <FieldWrapper
              id="sow-siteAddress"
              label="Site Address"
              error={errors.siteAddress}
            >
              <textarea
                id="sow-siteAddress"
                rows={2}
                disabled={value.siteAddressSameAsOverview}
                value={
                  value.siteAddressSameAsOverview
                    ? overview.serviceSiteAddress
                    : value.siteAddress
                }
                onChange={(e) => update('siteAddress', e.target.value)}
                placeholder="Enter site address"
                className={baseInputClass(
                  Boolean(errors.siteAddress),
                  value.siteAddressSameAsOverview
                )}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>

      {/* Section B */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">B. Contract Period</h3>
          <button
            type="button"
            onClick={() => onJumpToSection('contract-terms')}
            className="text-xs font-medium text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Edit Clause 5.2 Dates
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-md bg-slate-50 border border-slate-200 p-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">Commencement Date (Clause 5.2)</p>
            <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
              {contractTerms.clause5_2_commencementDate || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Completion Date (Clause 5.2)</p>
            <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
              {contractTerms.clause5_2_completionDate || 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Calculated Contract Duration</p>
            <p className="text-sm font-semibold text-slate-900 tabular-nums mt-0.5">
              {duration.formatted}
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">{duration.conventionNote}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          <FieldWrapper
            id="sow-visits"
            label="Confirmed Planned Service Visits (Count)"
            hint="Enter or confirm exact number of planned service visits — never inferred from dates alone."
            error={errors.plannedServiceVisits}
          >
            <input
              id="sow-visits"
              type="number"
              min="0"
              step="1"
              value={value.plannedServiceVisits}
              onChange={(e) => update('plannedServiceVisits', e.target.value)}
              placeholder="e.g., 24"
              className={`${baseInputClass(Boolean(errors.plannedServiceVisits))} font-mono tabular-nums`}
            />
          </FieldWrapper>
          <FieldWrapper
            id="sow-visit-notes"
            label="Service Visits Schedule Notes"
          >
            <input
              id="sow-visit-notes"
              type="text"
              value={value.serviceVisitsNotes}
              onChange={(e) => update('serviceVisitsNotes', e.target.value)}
              placeholder="e.g., 12 monthly PM + 4 quarterly overhaul visits"
              className={baseInputClass()}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Section C */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          C. Service Frequency & Manpower Deployment
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper id="sow-freq" label="Frequency and Interval">
            <input
              id="sow-freq"
              type="text"
              value={value.frequencyAndInterval}
              onChange={(e) => update('frequencyAndInterval', e.target.value)}
              placeholder="e.g., Monthly servicing within first 10 business days"
              className={baseInputClass()}
            />
          </FieldWrapper>
          <FieldWrapper id="sow-hours" label="Working Days and Hours">
            <input
              id="sow-hours"
              type="text"
              value={value.workingDaysAndHours}
              onChange={(e) => update('workingDaysAndHours', e.target.value)}
              placeholder="e.g., Mon–Fri 8:30 AM – 5:30 PM; noisy works after 7:00 PM"
              className={baseInputClass()}
            />
          </FieldWrapper>
          <FieldWrapper id="sow-manpower" label="Minimum Manpower and Roles">
            <textarea
              id="sow-manpower"
              rows={2}
              value={value.minManpowerAndRoles}
              onChange={(e) => update('minManpowerAndRoles', e.target.value)}
              placeholder="e.g., 1 Senior HVAC Technician (certified) + 1 Assistant per visit"
              className={baseInputClass()}
            />
          </FieldWrapper>
          <FieldWrapper id="sow-deploy-req" label="Additional Deployment Requirements">
            <textarea
              id="sow-deploy-req"
              rows={2}
              value={value.additionalDeploymentReqs}
              onChange={(e) => update('additionalDeploymentReqs', e.target.value)}
              placeholder="e.g., 2-hour emergency call-out response time; uniform & security pass required"
              className={baseInputClass()}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Section D */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">D. Scope of Work</h3>

        <FieldWrapper
          id="sow-scope-desc"
          label="Detailed Scope of Work Description"
          required={value.scopeItems.length === 0}
          error={errors.scopeDescription}
        >
          <textarea
            id="sow-scope-desc"
            rows={4}
            value={value.scopeDescription}
            onChange={(e) => update('scopeDescription', e.target.value)}
            placeholder="Describe the full scope of works, equipment covered, exclusions and performance standards..."
            className={baseInputClass(Boolean(errors.scopeDescription))}
          />
        </FieldWrapper>

        {/* Repeatable Scope Items */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Line-Item Scope Breakdown
            </span>
            <button
              type="button"
              onClick={addScopeItem}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Scope Item
            </button>
          </div>

          {value.scopeItems.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3 items-start"
            >
              <div className="md:col-span-2">
                <FieldWrapper id={`sc-no-${item.id}`} label="Item No.">
                  <input
                    id={`sc-no-${item.id}`}
                    type="text"
                    value={item.itemNo}
                    onChange={(e) => updateScopeItem(idx, { itemNo: e.target.value })}
                    className={`${baseInputClass()} font-mono`}
                  />
                </FieldWrapper>
              </div>
              <div className="md:col-span-4">
                <FieldWrapper id={`sc-desc-${item.id}`} label="Description">
                  <textarea
                    id={`sc-desc-${item.id}`}
                    rows={2}
                    value={item.description}
                    onChange={(e) =>
                      updateScopeItem(idx, { description: e.target.value })
                    }
                    placeholder="Scope task description"
                    className={baseInputClass()}
                  />
                </FieldWrapper>
              </div>
              <div className="md:col-span-3">
                <FieldWrapper id={`sc-freq-${item.id}`} label="Frequency / Spec">
                  <input
                    id={`sc-freq-${item.id}`}
                    type="text"
                    value={item.frequencyOrSpec}
                    onChange={(e) =>
                      updateScopeItem(idx, { frequencyOrSpec: e.target.value })
                    }
                    placeholder="e.g., Quarterly"
                    className={baseInputClass()}
                  />
                </FieldWrapper>
              </div>
              <div className="md:col-span-2">
                <FieldWrapper id={`sc-rem-${item.id}`} label="Remarks">
                  <input
                    id={`sc-rem-${item.id}`}
                    type="text"
                    value={item.remarks}
                    onChange={(e) => updateScopeItem(idx, { remarks: e.target.value })}
                    className={baseInputClass()}
                  />
                </FieldWrapper>
              </div>
              <div className="md:col-span-1 flex md:justify-end md:pt-6">
                <button
                  type="button"
                  onClick={() => removeScopeItem(idx)}
                  aria-label={`Remove scope item ${idx + 1}`}
                  className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Linked Technical PDF Appendices */}
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              References to Attached Technical PDFs
            </span>
            <button
              type="button"
              onClick={() => onJumpToSection('attachments')}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Manage Local PDFs
            </button>
          </div>
          {attachments.length === 0 ? (
            <p className="text-xs text-slate-500">
              No local PDFs attached yet. Attach technical scope PDFs in Section 7 to link them
              here.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachments.map((att) => (
                <label
                  key={att.id}
                  className="flex items-center gap-2.5 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 cursor-pointer hover:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={value.appendixAttachmentIds.includes(att.id)}
                    onChange={() => toggleAppendix(att.id)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                  />
                  <span className="truncate font-medium">{att.filename}</span>
                  <span className="text-slate-500 shrink-0">· {att.category}</span>
                </label>
              ))}
            </div>
          )}
          <FieldWrapper id="sow-app-notes" label="Additional Appendix Reference Notes">
            <input
              id="sow-app-notes"
              type="text"
              value={value.scopeAppendixNotes}
              onChange={(e) => update('scopeAppendixNotes', e.target.value)}
              placeholder="e.g., Refer to Appendix A (Asset List) and Appendix B (Floor Plans)"
              className={baseInputClass()}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Section E */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">E. Schedule of Rates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper
            id="sow-sor-app"
            label="Schedule of Rates Applicability"
            required
            error={errors.sorApplicable}
          >
            <select
              id="sow-sor-app"
              value={value.sorApplicable}
              onChange={(e) =>
                update(
                  'sorApplicable',
                  e.target.value as ScheduleOfWorks['sorApplicable']
                )
              }
              className={baseInputClass(Boolean(errors.sorApplicable))}
            >
              <option value="">Select...</option>
              <option value="Applicable">Applicable</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </FieldWrapper>

          {value.sorApplicable === 'Not applicable' ? (
            <FieldWrapper
              id="sow-sor-na"
              label="Explanation for Not Applicable"
              required
              error={errors.sorNaReason}
            >
              <input
                id="sow-sor-na"
                type="text"
                value={value.sorNaReason}
                onChange={(e) => update('sorNaReason', e.target.value)}
                placeholder="e.g., Lump sum fixed-price contract without unit rate schedule"
                className={baseInputClass(Boolean(errors.sorNaReason))}
              />
            </FieldWrapper>
          ) : (
            <FieldWrapper
              id="sow-sor-val"
              label="SOR Validity Period"
              hint="Editable guidance — confirm validity duration against tender requirements."
            >
              <input
                id="sow-sor-val"
                type="text"
                value={value.sorValidityPeriod}
                onChange={(e) => update('sorValidityPeriod', e.target.value)}
                placeholder="e.g., Valid for contract duration + renewal option"
                className={baseInputClass()}
              />
            </FieldWrapper>
          )}
        </div>

        {value.sorApplicable !== 'Not applicable' && (
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Schedule of Rates Line Items
              </span>
              <button
                type="button"
                onClick={addSorRow}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                Add Rate Item
              </button>
            </div>

            {value.sorRows.map((row, idx) => {
              const qErr = errors[`sorRows.${idx}.quantity`];
              const rErr = errors[`sorRows.${idx}.rate`];
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-md border border-slate-200 bg-slate-50/70 p-3 items-start"
                >
                  <div className="md:col-span-4">
                    <FieldWrapper id={`sor-desc-${row.id}`} label="Description">
                      <input
                        id={`sor-desc-${row.id}`}
                        type="text"
                        value={row.description}
                        onChange={(e) =>
                          updateSorRow(idx, { description: e.target.value })
                        }
                        placeholder="e.g., Supply & replace 50mm isolation valve"
                        className={baseInputClass()}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1">
                    <FieldWrapper id={`sor-unit-${row.id}`} label="Unit">
                      <input
                        id={`sor-unit-${row.id}`}
                        type="text"
                        value={row.unit}
                        onChange={(e) => updateSorRow(idx, { unit: e.target.value })}
                        placeholder="Nos"
                        className={baseInputClass()}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-2">
                    <FieldWrapper
                      id={`sor-qty-${row.id}`}
                      label="Est. Qty"
                      error={qErr}
                    >
                      <input
                        id={`sor-qty-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantity}
                        onChange={(e) => updateSorRow(idx, { quantity: e.target.value })}
                        placeholder="Optional"
                        className={`${baseInputClass(Boolean(qErr))} font-mono tabular-nums`}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1">
                    <FieldWrapper id={`sor-cur-${row.id}`} label="Curr">
                      <select
                        id={`sor-cur-${row.id}`}
                        value={row.currency}
                        onChange={(e) => updateSorRow(idx, { currency: e.target.value })}
                        className={baseInputClass()}
                      >
                        {CURRENCY_OPTIONS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-2">
                    <FieldWrapper
                      id={`sor-rate-${row.id}`}
                      label="Unit Rate"
                      error={rErr}
                    >
                      <input
                        id={`sor-rate-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.rate}
                        onChange={(e) => updateSorRow(idx, { rate: e.target.value })}
                        placeholder="0.00"
                        className={`${baseInputClass(Boolean(rErr))} font-mono tabular-nums`}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1">
                    <FieldWrapper id={`sor-rem-${row.id}`} label="Remarks">
                      <input
                        id={`sor-rem-${row.id}`}
                        type="text"
                        value={row.remarks}
                        onChange={(e) => updateSorRow(idx, { remarks: e.target.value })}
                        className={baseInputClass()}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1 flex md:justify-end md:pt-6">
                    <button
                      type="button"
                      onClick={() => removeSorRow(idx)}
                      aria-label={`Remove SOR row ${idx + 1}`}
                      className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sections F & G */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900">
          F. Contact Person & G. Declaration and Confirmation
        </h3>
        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={value.contactSameAsOverview}
            onChange={(e) => update('contactSameAsOverview', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          <span>Contact person and number same as Tender Overview</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FieldWrapper id="sow-contact-person" label="Section F Contact Person">
            <input
              id="sow-contact-person"
              type="text"
              disabled={value.contactSameAsOverview}
              value={value.contactSameAsOverview ? overview.contactPerson : value.contactPerson}
              onChange={(e) => update('contactPerson', e.target.value)}
              className={baseInputClass(false, value.contactSameAsOverview)}
            />
          </FieldWrapper>
          <FieldWrapper id="sow-contact-num" label="Section F Contact Number">
            <input
              id="sow-contact-num"
              type="tel"
              disabled={value.contactSameAsOverview}
              value={value.contactSameAsOverview ? overview.contactPhone : value.contactNumber}
              onChange={(e) => update('contactNumber', e.target.value)}
              className={`${baseInputClass(false, value.contactSameAsOverview)} font-mono tabular-nums`}
            />
          </FieldWrapper>
        </div>

        <GuidanceCallout title="Section G — Declaration & Confirmation">
          <p>
            Declaration clauses (Machinery/Tools, Progressive Wage Model, bizSAFE certification
            and Requestor Confirmation) are managed in{' '}
            <button
              type="button"
              onClick={() => onJumpToSection('declarations')}
              className="font-semibold underline text-amber-950 hover:text-blue-800"
            >
              Section 6: Declarations
            </button>{' '}
            and included automatically in PDF & Excel exports.
          </p>
        </GuidanceCallout>
      </div>
    </div>
  );
};
