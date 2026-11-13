import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  AdhocSpecifications,
  ContractType,
  LocalPdfAttachment,
  TechnicalScheduleItem,
} from '../../types/tender';
import { createEmptySpecificationItem } from '../../schema/tenderSchema';
import {
  FieldWrapper,
  GuidanceCallout,
  NaCheckboxRow,
  baseInputClass,
} from '../FormControls';

interface TechnicalSchedulesSectionProps {
  schedules: TechnicalScheduleItem[];
  adhocSpecs: AdhocSpecifications;
  contractType: ContractType;
  attachments: LocalPdfAttachment[];
  onChangeSchedules: (next: TechnicalScheduleItem[]) => void;
  onChangeAdhocSpecs: (next: AdhocSpecifications) => void;
  onJumpToAttachments: () => void;
  errors: Record<string, string>;
}

export const TechnicalSchedulesSection: React.FC<TechnicalSchedulesSectionProps> = ({
  schedules,
  adhocSpecs,
  contractType,
  attachments,
  onChangeSchedules,
  onChangeAdhocSpecs,
  onJumpToAttachments,
  errors,
}) => {
  const updateSchedule = (
    key: TechnicalScheduleItem['key'],
    patch: Partial<TechnicalScheduleItem>
  ) => {
    onChangeSchedules(
      schedules.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  };

  const toggleScheduleAttachment = (
    key: TechnicalScheduleItem['key'],
    attId: string
  ) => {
    const target = schedules.find((s) => s.key === key);
    if (!target) return;
    const exists = target.attachmentIds.includes(attId);
    updateSchedule(key, {
      attachmentIds: exists
        ? target.attachmentIds.filter((id) => id !== attId)
        : [...target.attachmentIds, attId],
    });
  };

  const addSpecItem = () => {
    onChangeAdhocSpecs({
      ...adhocSpecs,
      items: [...adhocSpecs.items, createEmptySpecificationItem()],
    });
  };

  const updateSpecItem = (
    idx: number,
    patch: Partial<AdhocSpecifications['items'][number]>
  ) => {
    onChangeAdhocSpecs({
      ...adhocSpecs,
      items: adhocSpecs.items.map((item, i) =>
        i === idx ? { ...item, ...patch } : item
      ),
    });
  };

  const removeSpecItem = (idx: number) => {
    onChangeAdhocSpecs({
      ...adhocSpecs,
      items: adhocSpecs.items.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          5. Technical & Supporting Schedules
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Specify applicability, details and PDF attachment references for technical
          schedules.
        </p>
      </div>

      {/* Ad-hoc Works Specification Section (highlighted at top when Ad-hoc selected) */}
      {contractType === 'Ad-hoc Works' ? (
        <div className="rounded-lg border border-blue-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Ad-hoc Works Specifications
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Add repeatable equipment/material specification items with preferred brands
                and models, or mark N.A. if no specifications apply.
              </p>
            </div>
            <NaCheckboxRow
              id="adhoc-spec-na"
              checked={adhocSpecs.notApplicable}
              onChange={(checked) =>
                onChangeAdhocSpecs({ ...adhocSpecs, notApplicable: checked })
              }
              label="N.A. — No specifications required"
            />
          </div>

          {adhocSpecs.notApplicable ? (
            <FieldWrapper
              id="adhoc-spec-na-reason"
              label="Explanation for N.A."
              required
              error={errors['adhocSpecifications.naReason']}
            >
              <input
                id="adhoc-spec-na-reason"
                type="text"
                value={adhocSpecs.naReason}
                onChange={(e) =>
                  onChangeAdhocSpecs({ ...adhocSpecs, naReason: e.target.value })
                }
                placeholder="e.g., Labour-only minor repair works without material specifications"
                className={baseInputClass(Boolean(errors['adhocSpecifications.naReason']))}
              />
            </FieldWrapper>
          ) : (
            <div className="space-y-3">
              {errors['adhocSpecifications.items'] && (
                <p role="alert" className="text-xs font-medium text-red-700">
                  {errors['adhocSpecifications.items']}
                </p>
              )}

              {adhocSpecs.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                  <p className="text-sm text-slate-600">
                    No specification items added yet.
                  </p>
                  <button
                    type="button"
                    onClick={addSpecItem}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Specification Item
                  </button>
                </div>
              ) : (
                <>
                  {adhocSpecs.items.map((spec, idx) => (
                    <div
                      key={spec.id}
                      className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-semibold text-slate-700">
                          Specification Item #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSpecItem(idx)}
                          aria-label={`Remove specification item ${idx + 1}`}
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FieldWrapper id={`sp-title-${spec.id}`} label="Item / System Title">
                          <input
                            id={`sp-title-${spec.id}`}
                            type="text"
                            value={spec.itemTitle}
                            onChange={(e) =>
                              updateSpecItem(idx, { itemTitle: e.target.value })
                            }
                            placeholder="e.g., Variable Speed Drive (VSD) Replacement"
                            className={baseInputClass()}
                          />
                        </FieldWrapper>
                        <FieldWrapper
                          id={`sp-brand-${spec.id}`}
                          label="Preferred Brand & Model (or Equivalent)"
                        >
                          <input
                            id={`sp-brand-${spec.id}`}
                            type="text"
                            value={spec.preferredBrandModel}
                            onChange={(e) =>
                              updateSpecItem(idx, {
                                preferredBrandModel: e.target.value,
                              })
                            }
                            placeholder="e.g., ABB ACS580 / Danfoss VLT HVAC Drive"
                            className={baseInputClass()}
                          />
                        </FieldWrapper>
                        <FieldWrapper
                          id={`sp-req-${spec.id}`}
                          label="Technical Requirements"
                        >
                          <textarea
                            id={`sp-req-${spec.id}`}
                            rows={2}
                            value={spec.technicalRequirements}
                            onChange={(e) =>
                              updateSpecItem(idx, {
                                technicalRequirements: e.target.value,
                              })
                            }
                            placeholder="Capacity, IP rating, compliance standards, testing..."
                            className={baseInputClass()}
                          />
                        </FieldWrapper>
                        <div className="grid grid-cols-2 gap-3">
                          <FieldWrapper id={`sp-qty-${spec.id}`} label="Qty / Unit">
                            <input
                              id={`sp-qty-${spec.id}`}
                              type="text"
                              value={spec.quantityOrUnit}
                              onChange={(e) =>
                                updateSpecItem(idx, { quantityOrUnit: e.target.value })
                              }
                              placeholder="e.g., 2 sets"
                              className={baseInputClass()}
                            />
                          </FieldWrapper>
                          <FieldWrapper id={`sp-rem-${spec.id}`} label="Remarks">
                            <input
                              id={`sp-rem-${spec.id}`}
                              type="text"
                              value={spec.remarks}
                              onChange={(e) =>
                                updateSpecItem(idx, { remarks: e.target.value })
                              }
                              placeholder="Optional notes"
                              className={baseInputClass()}
                            />
                          </FieldWrapper>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSpecItem}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    Add Specification Item
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <GuidanceCallout title="Term Contract Selected — Specification Section">
          <p>
            The dedicated Ad-hoc Works Specification table is hidden while Contract Type is
            set to <strong>Term Contract</strong> (the Excel <code>3.Specification</code>{' '}
            sheet will indicate it is not applicable). Use the schedules below for new
            system specifications, preferred brands and existing equipment details.
          </p>
        </GuidanceCallout>
      )}

      {/* 11 Technical & Supporting Schedules */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-900">
            Supporting Schedules & Attachment Mapping
          </h3>
          <button
            type="button"
            onClick={onJumpToAttachments}
            className="text-xs font-medium text-blue-700 hover:underline"
          >
            Add / Manage Local PDFs
          </button>
        </div>

        <div className="space-y-4">
          {schedules.map((item, idx) => {
            const disabledForAdhoc = contractType === 'Ad-hoc Works' && item.termOnly;

            return (
              <div
                key={item.key}
                className={`rounded-lg border p-4 space-y-3 ${
                  disabledForAdhoc
                    ? 'border-slate-200 bg-slate-100/80 opacity-80'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs text-slate-500 mr-2 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <span className="text-sm font-semibold text-slate-900">
                      {item.label}
                    </span>
                    {item.termOnly && (
                      <span className="ml-2 text-xs text-slate-500">
                        · Term Contract specific
                      </span>
                    )}
                  </div>

                  {disabledForAdhoc ? (
                    <span className="text-xs font-medium text-slate-500">
                      Not applicable (Ad-hoc Works)
                    </span>
                  ) : (
                    <select
                      aria-label={`${item.label} applicability`}
                      value={item.applicable}
                      onChange={(e) =>
                        updateSchedule(item.key, {
                          applicable: e.target.value as TechnicalScheduleItem['applicable'],
                        })
                      }
                      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                    >
                      <option value="">Select applicability...</option>
                      <option value="Applicable">Applicable</option>
                      <option value="Not applicable">Not applicable</option>
                    </select>
                  )}
                </div>

                {!disabledForAdhoc && (
                  <>
                    {typeof item.validityGuidance === 'string' && (
                      <FieldWrapper
                        id={`ts-guid-${item.key}`}
                        label="Editable Validity Guidance (not a binding contractual default)"
                      >
                        <input
                          id={`ts-guid-${item.key}`}
                          type="text"
                          value={item.validityGuidance}
                          onChange={(e) =>
                            updateSchedule(item.key, {
                              validityGuidance: e.target.value,
                            })
                          }
                          className={`${baseInputClass()} text-xs bg-amber-50/40`}
                        />
                      </FieldWrapper>
                    )}

                    <FieldWrapper
                      id={`ts-det-${item.key}`}
                      label={
                        item.applicable === 'Not applicable'
                          ? 'Explanation / Notes'
                          : 'Details & Reference Notes'
                      }
                    >
                      <textarea
                        id={`ts-det-${item.key}`}
                        rows={2}
                        value={item.details}
                        onChange={(e) =>
                          updateSchedule(item.key, { details: e.target.value })
                        }
                        placeholder={
                          item.applicable === 'Not applicable'
                            ? 'Optional explanation why this schedule is not applicable'
                            : 'Enter schedule details, existing OEM/contractor info, phasing notes or validity terms...'
                        }
                        className={baseInputClass()}
                      />
                    </FieldWrapper>

                    {attachments.length > 0 && item.applicable !== 'Not applicable' && (
                      <div className="pt-1">
                        <p className="text-xs font-medium text-slate-600 mb-1.5">
                          Linked PDF Attachments:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {attachments.map((att) => (
                            <label
                              key={att.id}
                              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 cursor-pointer hover:bg-slate-100"
                            >
                              <input
                                type="checkbox"
                                checked={item.attachmentIds.includes(att.id)}
                                onChange={() =>
                                  toggleScheduleAttachment(item.key, att.id)
                                }
                                className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700"
                              />
                              <span className="max-w-[220px] truncate">
                                {att.filename}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
