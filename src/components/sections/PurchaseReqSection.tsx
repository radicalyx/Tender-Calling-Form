import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { BusinessUnit, PurchaseRequisitionInfo } from '../../types/tender';
import {
  BU_ENDORSEMENT_GUIDANCE,
  CURRENCY_OPTIONS,
  createEmptyQuotation,
} from '../../schema/tenderSchema';
import { FieldWrapper, GuidanceCallout, baseInputClass } from '../FormControls';

interface PurchaseReqSectionProps {
  value: PurchaseRequisitionInfo;
  overviewBusinessUnit: BusinessUnit;
  overviewMaterialGroup: string;
  onChange: (next: PurchaseRequisitionInfo) => void;
  errors: Record<string, string>;
}

export const PurchaseReqSection: React.FC<PurchaseReqSectionProps> = ({
  value,
  overviewBusinessUnit,
  overviewMaterialGroup,
  onChange,
  errors,
}) => {
  const update = <K extends keyof PurchaseRequisitionInfo>(
    key: K,
    fieldVal: PurchaseRequisitionInfo[K]
  ) => {
    onChange({ ...value, [key]: fieldVal });
  };

  const addQuotation = () => {
    update('referenceQuotations', [...value.referenceQuotations, createEmptyQuotation()]);
  };

  const updateQuotation = (
    idx: number,
    patch: Partial<PurchaseRequisitionInfo['referenceQuotations'][number]>
  ) => {
    update(
      'referenceQuotations',
      value.referenceQuotations.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  };

  const removeQuotation = (idx: number) => {
    update(
      'referenceQuotations',
      value.referenceQuotations.filter((_, i) => i !== idx)
    );
  };

  const selectedBuGuidance =
    overviewBusinessUnit && BU_ENDORSEMENT_GUIDANCE[overviewBusinessUnit]
      ? BU_ENDORSEMENT_GUIDANCE[overviewBusinessUnit]
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          3. Purchase Requisition Supporting Information
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Record budget checks, existing contract overlap checks, reference quotations and
          internal endorsement status.
        </p>
      </div>

      {/* Existing warranty / contract check */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <FieldWrapper
          id="pr-covered"
          label="Are the works covered by an existing warranty, term contract or maintenance contract?"
          required
          error={errors.coveredByExistingContract}
        >
          <select
            id="pr-covered"
            value={value.coveredByExistingContract}
            onChange={(e) =>
              update(
                'coveredByExistingContract',
                e.target.value as PurchaseRequisitionInfo['coveredByExistingContract']
              )
            }
            className={baseInputClass(Boolean(errors.coveredByExistingContract))}
          >
            <option value="">Select...</option>
            <option value="No">No — Not covered by an existing contract or warranty</option>
            <option value="Yes">Yes — Covered by existing contract / warranty (explain below)</option>
          </select>
        </FieldWrapper>

        {value.coveredByExistingContract === 'Yes' && (
          <FieldWrapper
            id="pr-justification"
            label="Explanation of Why a New PR is Necessary"
            required
            error={errors.existingContractJustification}
          >
            <textarea
              id="pr-justification"
              rows={3}
              value={value.existingContractJustification}
              onChange={(e) => update('existingContractJustification', e.target.value)}
              placeholder="Explain why these works fall outside the current contractor's scope or require a new tender / PR"
              className={baseInputClass(Boolean(errors.existingContractJustification))}
            />
          </FieldWrapper>
        )}
      </div>

      {/* Budget & Material Group */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">Approved Budget</h3>
          <div className="grid grid-cols-3 gap-3">
            <FieldWrapper id="pr-currency" label="Currency">
              <select
                id="pr-currency"
                value={value.budgetCurrency}
                onChange={(e) => update('budgetCurrency', e.target.value)}
                className={baseInputClass()}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FieldWrapper>
            <div className="col-span-2">
              <FieldWrapper
                id="pr-budget"
                label="Approved Budget Amount"
                required
                error={errors.approvedBudgetAmount}
              >
                <input
                  id="pr-budget"
                  type="number"
                  min="0"
                  step="0.01"
                  value={value.approvedBudgetAmount}
                  onChange={(e) => update('approvedBudgetAmount', e.target.value)}
                  placeholder="e.g., 120000.00"
                  className={`${baseInputClass(Boolean(errors.approvedBudgetAmount))} font-mono tabular-nums`}
                />
              </FieldWrapper>
            </div>
          </div>

          <div>
            <label className="inline-flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={value.latestBudgetChecked}
                onChange={(e) => update('latestBudgetChecked', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                I confirm that the latest approved budget has been checked.
                <span className="text-red-600 ml-1" aria-hidden="true">
                  *
                </span>
              </span>
            </label>
            {errors.latestBudgetChecked && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {errors.latestBudgetChecked}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Additional Budget & Material Group
          </h3>

          <FieldWrapper
            id="pr-add-budget"
            label="Additional Budget Approval Status"
          >
            <select
              id="pr-add-budget"
              value={value.additionalBudgetApprovalStatus}
              onChange={(e) =>
                update(
                  'additionalBudgetApprovalStatus',
                  e.target.value as PurchaseRequisitionInfo['additionalBudgetApprovalStatus']
                )
              }
              className={baseInputClass()}
            >
              <option value="">Select status...</option>
              <option value="Not required">Not required (within approved budget)</option>
              <option value="Pending">Pending additional budget approval</option>
              <option value="Approved">Approved</option>
              <option value="Other">Other</option>
            </select>
          </FieldWrapper>

          <FieldWrapper id="pr-add-exp" label="Additional Budget Explanation (where applicable)">
            <input
              id="pr-add-exp"
              type="text"
              value={value.additionalBudgetExplanation}
              onChange={(e) => update('additionalBudgetExplanation', e.target.value)}
              placeholder="e.g., Cost centre reallocation memo dated..."
              className={baseInputClass()}
            />
          </FieldWrapper>

          <div className="space-y-2 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.prMaterialGroupSameAsOverview}
                onChange={(e) => update('prMaterialGroupSameAsOverview', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Material group same as Tender Overview</span>
            </label>

            <FieldWrapper id="pr-mat-grp" label="PR Material Group">
              <input
                id="pr-mat-grp"
                type="text"
                disabled={value.prMaterialGroupSameAsOverview}
                value={
                  value.prMaterialGroupSameAsOverview
                    ? overviewMaterialGroup
                    : value.prMaterialGroup
                }
                onChange={(e) => update('prMaterialGroup', e.target.value)}
                placeholder="Enter material group"
                className={baseInputClass(false, value.prMaterialGroupSameAsOverview)}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>

      {/* Endorsement Guidance */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <GuidanceCallout title="Template-Based Endorsement Requirements — Verify Internally">
          {selectedBuGuidance ? (
            <p className="font-semibold text-amber-950">
              Selected Business Unit ({selectedBuGuidance.label}):{' '}
              {selectedBuGuidance.requirement}
            </p>
          ) : (
            <p>
              Select a Business Unit in Section 1 (Tender Overview) to highlight its
              template endorsement requirement below.
            </p>
          )}
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-amber-300/70">
                  <th className="py-1.5 pr-4 font-semibold">Business Unit</th>
                  <th className="py-1.5 font-semibold">Template Internal Requirement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-200/60">
                {Object.values(BU_ENDORSEMENT_GUIDANCE).map((item) => {
                  const isMatch =
                    overviewBusinessUnit &&
                    BU_ENDORSEMENT_GUIDANCE[overviewBusinessUnit]?.label === item.label;
                  return (
                    <tr
                      key={item.label}
                      className={isMatch ? 'bg-amber-100/80 font-semibold' : ''}
                    >
                      <td className="py-1.5 pr-4 whitespace-nowrap">{item.label}</td>
                      <td className="py-1.5">{item.requirement}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="pt-1 italic">
            Labelled as template-based internal guidance; confirm current approval matrix with
            your organisation&apos;s Finance and Procurement teams.
          </p>
        </GuidanceCallout>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldWrapper
            id="pr-approval-status"
            label="Approval / Endorsement Status"
            required
            error={errors.approvalStatus}
          >
            <select
              id="pr-approval-status"
              value={value.approvalStatus}
              onChange={(e) =>
                update(
                  'approvalStatus',
                  e.target.value as PurchaseRequisitionInfo['approvalStatus']
                )
              }
              className={baseInputClass(Boolean(errors.approvalStatus))}
            >
              <option value="">Select endorsement status...</option>
              <option value="Pending">Pending</option>
              <option value="Submitted for endorsement">Submitted for endorsement</option>
              <option value="Endorsed / Approved">Endorsed / Approved</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </FieldWrapper>

          <FieldWrapper
            id="pr-supporting-refs"
            label="Supporting Document References"
          >
            <input
              id="pr-supporting-refs"
              type="text"
              value={value.supportingDocumentRefs}
              onChange={(e) => update('supportingDocumentRefs', e.target.value)}
              placeholder="e.g., SRF-2026-041, GM Email Approval"
              className={baseInputClass()}
            />
          </FieldWrapper>
        </div>
      </div>

      {/* Reference Quotations */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Reference Quotations</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              For urgent works requiring award within 1 month, template notes recommend 3
              reference quotations. Note: Quotation PDFs are excluded from combined tender
              appendices by default.
            </p>
          </div>
          <button
            type="button"
            onClick={addQuotation}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Quotation
          </button>
        </div>

        {value.referenceQuotations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
            <p className="text-sm text-slate-600">No reference quotations added.</p>
            <button
              type="button"
              onClick={addQuotation}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              Add Reference Quotation
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {value.referenceQuotations.map((q, idx) => {
              const amtErr = errors[`referenceQuotations.${idx}.amount`];
              return (
                <div
                  key={q.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-lg border border-slate-200 bg-white p-3.5 items-start"
                >
                  <div className="md:col-span-3">
                    <FieldWrapper id={`rq-vendor-${q.id}`} label="Vendor Name">
                      <input
                        id={`rq-vendor-${q.id}`}
                        type="text"
                        value={q.vendorName}
                        onChange={(e) =>
                          updateQuotation(idx, { vendorName: e.target.value })
                        }
                        placeholder="e.g., Vendor A Pte Ltd"
                        className={baseInputClass()}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-2">
                    <FieldWrapper id={`rq-ref-${q.id}`} label="Quotation Ref">
                      <input
                        id={`rq-ref-${q.id}`}
                        type="text"
                        value={q.quotationRef}
                        onChange={(e) =>
                          updateQuotation(idx, { quotationRef: e.target.value })
                        }
                        placeholder="e.g., QT-1024"
                        className={`${baseInputClass()} font-mono`}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-2">
                    <FieldWrapper id={`rq-date-${q.id}`} label="Date">
                      <input
                        id={`rq-date-${q.id}`}
                        type="date"
                        value={q.quotationDate}
                        onChange={(e) =>
                          updateQuotation(idx, { quotationDate: e.target.value })
                        }
                        className={`${baseInputClass()} font-mono tabular-nums`}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1">
                    <FieldWrapper id={`rq-cur-${q.id}`} label="Curr">
                      <select
                        id={`rq-cur-${q.id}`}
                        value={q.currency}
                        onChange={(e) =>
                          updateQuotation(idx, { currency: e.target.value })
                        }
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
                      id={`rq-amt-${q.id}`}
                      label="Amount"
                      error={amtErr}
                    >
                      <input
                        id={`rq-amt-${q.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={q.amount}
                        onChange={(e) =>
                          updateQuotation(idx, { amount: e.target.value })
                        }
                        placeholder="0.00"
                        className={`${baseInputClass(Boolean(amtErr))} font-mono tabular-nums`}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1">
                    <FieldWrapper id={`rq-rem-${q.id}`} label="Notes">
                      <input
                        id={`rq-rem-${q.id}`}
                        type="text"
                        value={q.remarks}
                        onChange={(e) =>
                          updateQuotation(idx, { remarks: e.target.value })
                        }
                        placeholder="Notes"
                        className={baseInputClass()}
                      />
                    </FieldWrapper>
                  </div>
                  <div className="md:col-span-1 flex md:justify-end md:pt-6">
                    <button
                      type="button"
                      onClick={() => removeQuotation(idx)}
                      aria-label={`Remove reference quotation ${idx + 1}`}
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
    </div>
  );
};
