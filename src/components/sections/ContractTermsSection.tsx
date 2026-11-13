import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ContractTerms, ContractType } from '../../types/tender';
import {
  CURRENCY_OPTIONS,
  GENERAL_TEMPLATE_NOTES,
  createEmptyInsurance,
} from '../../schema/tenderSchema';
import {
  FieldWrapper,
  GuidanceCallout,
  NaCheckboxRow,
  baseInputClass,
} from '../FormControls';

interface ContractTermsSectionProps {
  value: ContractTerms;
  contractType: ContractType;
  onChange: (next: ContractTerms) => void;
  errors: Record<string, string>;
}

export const ContractTermsSection: React.FC<ContractTermsSectionProps> = ({
  value,
  contractType,
  onChange,
  errors,
}) => {
  const update = <K extends keyof ContractTerms>(key: K, fieldVal: ContractTerms[K]) => {
    onChange({ ...value, [key]: fieldVal });
  };

  const addInsurance = () => {
    update('clause22_1_insurances', [
      ...value.clause22_1_insurances,
      createEmptyInsurance(),
    ]);
  };

  const updateInsurance = (
    idx: number,
    patch: Partial<ContractTerms['clause22_1_insurances'][number]>
  ) => {
    const next = value.clause22_1_insurances.map((item, i) =>
      i === idx ? { ...item, ...patch } : item
    );
    update('clause22_1_insurances', next);
  };

  const removeInsurance = (idx: number) => {
    update(
      'clause22_1_insurances',
      value.clause22_1_insurances.filter((_, i) => i !== idx)
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          2. General Information / Contract Terms
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Checklist clauses preserved from the reference tender template. Mark inapplicable
          clauses with an explanation where appropriate.
        </p>
      </div>

      <GuidanceCallout title="Source Template Procedural Notes — Internal Confirmation Required">
        <ul className="list-disc pl-4 space-y-1">
          {GENERAL_TEMPLATE_NOTES.map((note, idx) => (
            <li key={idx}>{note}</li>
          ))}
        </ul>
      </GuidanceCallout>

      {/* Scope & Dates (5.1, 5.2, 6.3, 7.1) */}
      <div className="space-y-6 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Scope, Contract Dates, Safety & Programme
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <FieldWrapper
              id="ct-5-1-scope"
              clauseRef="Clause 5.1"
              label="Scope of Works Summary"
              required
              error={errors.clause5_1_scopeSummary}
            >
              <textarea
                id="ct-5-1-scope"
                rows={3}
                value={value.clause5_1_scopeSummary}
                onChange={(e) => update('clause5_1_scopeSummary', e.target.value)}
                placeholder="e.g., Comprehensive preventive and corrective maintenance of water-cooled chiller plant and cooling towers"
                aria-invalid={Boolean(errors.clause5_1_scopeSummary)}
                className={baseInputClass(Boolean(errors.clause5_1_scopeSummary))}
              />
            </FieldWrapper>
          </div>

          <div className="md:col-span-2">
            <FieldWrapper
              id="ct-5-1-freq"
              clauseRef="Clause 5.1"
              label="Service Frequency"
              required={contractType === 'Term Contract'}
              hint={
                contractType === 'Ad-hoc Works'
                  ? 'Optional for Ad-hoc Works; describe milestones or single deployment if relevant.'
                  : undefined
              }
              error={errors.clause5_1_serviceFrequency}
            >
              <input
                id="ct-5-1-freq"
                type="text"
                value={value.clause5_1_serviceFrequency}
                onChange={(e) => update('clause5_1_serviceFrequency', e.target.value)}
                placeholder="e.g., Monthly preventive servicing, quarterly chemical dosing, 24/7 emergency call-out"
                aria-invalid={Boolean(errors.clause5_1_serviceFrequency)}
                className={baseInputClass(Boolean(errors.clause5_1_serviceFrequency))}
              />
            </FieldWrapper>
          </div>

          <FieldWrapper
            id="ct-5-2-start"
            clauseRef="Clause 5.2"
            label="Contract Commencement Date"
            required
            error={errors.clause5_2_commencementDate}
          >
            <input
              id="ct-5-2-start"
              type="date"
              value={value.clause5_2_commencementDate}
              onChange={(e) => update('clause5_2_commencementDate', e.target.value)}
              aria-invalid={Boolean(errors.clause5_2_commencementDate)}
              className={`${baseInputClass(Boolean(errors.clause5_2_commencementDate))} font-mono tabular-nums`}
            />
          </FieldWrapper>

          <FieldWrapper
            id="ct-5-2-end"
            clauseRef="Clause 5.2"
            label="Contract Completion Date"
            required
            error={errors.clause5_2_completionDate}
          >
            <input
              id="ct-5-2-end"
              type="date"
              value={value.clause5_2_completionDate}
              onChange={(e) => update('clause5_2_completionDate', e.target.value)}
              aria-invalid={Boolean(errors.clause5_2_completionDate)}
              className={`${baseInputClass(Boolean(errors.clause5_2_completionDate))} font-mono tabular-nums`}
            />
          </FieldWrapper>

          <FieldWrapper
            id="ct-6-3"
            clauseRef="Clause 6.3"
            label="bizSAFE Level 3 Certification or Equivalent"
            required
            error={errors.clause6_3_bizSafeRequired}
          >
            <select
              id="ct-6-3"
              value={value.clause6_3_bizSafeRequired}
              onChange={(e) =>
                update(
                  'clause6_3_bizSafeRequired',
                  e.target.value as ContractTerms['clause6_3_bizSafeRequired']
                )
              }
              className={baseInputClass(Boolean(errors.clause6_3_bizSafeRequired))}
            >
              <option value="">Select requirement...</option>
              <option value="Yes">Yes — bizSAFE Level 3 or equivalent required</option>
              <option value="No">No — Not required</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </FieldWrapper>

          <FieldWrapper
            id="ct-6-3-details"
            clauseRef="Clause 6.3"
            label="Safety / Certification Notes"
          >
            <input
              id="ct-6-3-details"
              type="text"
              value={value.clause6_3_details}
              onChange={(e) => update('clause6_3_details', e.target.value)}
              placeholder="e.g., Valid bizSAFE Level 3 / ISO 45001 at tender closing"
              className={baseInputClass()}
            />
          </FieldWrapper>

          <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 7.1
                </span>
                Deadline for Submitting Detailed Programme
              </span>
              <NaCheckboxRow
                id="ct-7-1-na"
                checked={value.clause7_1_notApplicable}
                onChange={(checked) => update('clause7_1_notApplicable', checked)}
              />
            </div>
            {!value.clause7_1_notApplicable ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <FieldWrapper
                  id="ct-7-1-val"
                  label="Deadline Duration"
                  required
                  error={errors.clause7_1_deadlineValue}
                >
                  <input
                    id="ct-7-1-val"
                    type="number"
                    min="0"
                    step="1"
                    value={value.clause7_1_deadlineValue}
                    onChange={(e) => update('clause7_1_deadlineValue', e.target.value)}
                    placeholder="e.g., 14"
                    className={`${baseInputClass(Boolean(errors.clause7_1_deadlineValue))} font-mono tabular-nums`}
                  />
                </FieldWrapper>
                <FieldWrapper id="ct-7-1-unit" label="Unit">
                  <select
                    id="ct-7-1-unit"
                    value={value.clause7_1_deadlineUnit}
                    onChange={(e) =>
                      update(
                        'clause7_1_deadlineUnit',
                        e.target.value as ContractTerms['clause7_1_deadlineUnit']
                      )
                    }
                    className={baseInputClass()}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                  </select>
                </FieldWrapper>
                <FieldWrapper id="ct-7-1-details" label="Trigger / Notes">
                  <input
                    id="ct-7-1-details"
                    type="text"
                    value={value.clause7_1_details}
                    onChange={(e) => update('clause7_1_details', e.target.value)}
                    placeholder="e.g., from Letter of Award"
                    className={baseInputClass()}
                  />
                </FieldWrapper>
              </div>
            ) : (
              <FieldWrapper id="ct-7-1-na-reason" label="Explanation for N/A">
                <input
                  id="ct-7-1-na-reason"
                  type="text"
                  value={value.clause7_1_details}
                  onChange={(e) => update('clause7_1_details', e.target.value)}
                  placeholder="Explain why a detailed programme deadline is not applicable"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            )}
          </div>
        </div>
      </div>

      {/* Warranties, Variations & Payment (10.1, 12.1, 12.2.4, 13.1, 13.2, 13.7) */}
      <div className="space-y-5 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Warranties, Variations & Payment Terms
        </h3>

        {/* Clause 10.1 */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                Clause 10.1
              </span>
              List of Warranties
            </span>
            <NaCheckboxRow
              id="ct-10-1-na"
              checked={value.clause10_1_notApplicable}
              onChange={(checked) => update('clause10_1_notApplicable', checked)}
            />
          </div>
          {value.clause10_1_notApplicable ? (
            <FieldWrapper
              id="ct-10-1-na-reason"
              label="Explanation for Not Applicable"
              required
              error={errors.clause10_1_naReason}
            >
              <input
                id="ct-10-1-na-reason"
                type="text"
                value={value.clause10_1_naReason}
                onChange={(e) => update('clause10_1_naReason', e.target.value)}
                placeholder="State why no separate warranty list applies"
                className={baseInputClass(Boolean(errors.clause10_1_naReason))}
              />
            </FieldWrapper>
          ) : (
            <FieldWrapper id="ct-10-1-val" label="Required Warranties">
              <textarea
                id="ct-10-1-val"
                rows={2}
                value={value.clause10_1_warranties}
                onChange={(e) => update('clause10_1_warranties', e.target.value)}
                placeholder="e.g., Compressor parts & workmanship warranty; OEM manufacturer warranty certificates"
                className={baseInputClass()}
              />
            </FieldWrapper>
          )}
        </div>

        {/* Clause 12.1 & 12.2.4 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 12.1
                </span>
                Variation Notice Requirements
              </span>
              <NaCheckboxRow
                id="ct-12-1-na"
                checked={value.clause12_1_notApplicable}
                onChange={(checked) => update('clause12_1_notApplicable', checked)}
              />
            </div>
            {value.clause12_1_notApplicable ? (
              <FieldWrapper
                id="ct-12-1-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause12_1_naReason}
              >
                <input
                  id="ct-12-1-na-reason"
                  type="text"
                  value={value.clause12_1_naReason}
                  onChange={(e) => update('clause12_1_naReason', e.target.value)}
                  placeholder="State reason"
                  className={baseInputClass(Boolean(errors.clause12_1_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper id="ct-12-1-val" label="Notice Requirements">
                <textarea
                  id="ct-12-1-val"
                  rows={2}
                  value={value.clause12_1_noticeRequirements}
                  onChange={(e) => update('clause12_1_noticeRequirements', e.target.value)}
                  placeholder="e.g., Written variation instruction required prior to execution; claim submitted within 14 days"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 12.2.4
                </span>
                Overheads, Profits & All Necessary Costs
              </span>
              <NaCheckboxRow
                id="ct-12-2-4-na"
                checked={value.clause12_2_4_notApplicable}
                onChange={(checked) => update('clause12_2_4_notApplicable', checked)}
              />
            </div>
            {value.clause12_2_4_notApplicable ? (
              <FieldWrapper
                id="ct-12-2-4-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause12_2_4_naReason}
              >
                <input
                  id="ct-12-2-4-na-reason"
                  type="text"
                  value={value.clause12_2_4_naReason}
                  onChange={(e) => update('clause12_2_4_naReason', e.target.value)}
                  placeholder="State reason"
                  className={baseInputClass(Boolean(errors.clause12_2_4_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper
                id="ct-12-2-4-pct"
                label="Percentage (%)"
                required
                error={errors.clause12_2_4_overheadProfitPct}
              >
                <div className="relative">
                  <input
                    id="ct-12-2-4-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={value.clause12_2_4_overheadProfitPct}
                    onChange={(e) =>
                      update('clause12_2_4_overheadProfitPct', e.target.value)
                    }
                    placeholder="e.g., 10"
                    className={`${baseInputClass(Boolean(errors.clause12_2_4_overheadProfitPct))} pr-8 font-mono tabular-nums`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    %
                  </span>
                </div>
              </FieldWrapper>
            )}
          </div>
        </div>

        {/* Clause 13.1, 13.2, 13.7 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FieldWrapper
            id="ct-13-1-type"
            clauseRef="Clause 13.1"
            label="Payment Type and Frequency"
            required
            error={errors.clause13_1_paymentType}
          >
            <select
              id="ct-13-1-type"
              value={value.clause13_1_paymentType}
              onChange={(e) =>
                update(
                  'clause13_1_paymentType',
                  e.target.value as ContractTerms['clause13_1_paymentType']
                )
              }
              className={baseInputClass(Boolean(errors.clause13_1_paymentType))}
            >
              <option value="">Select payment type...</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Milestone / Progress">Milestone / Progress</option>
              <option value="Lump Sum on Completion">Lump Sum on Completion</option>
              <option value="Other">Other</option>
            </select>
          </FieldWrapper>

          <FieldWrapper
            id="ct-13-1-details"
            clauseRef="Clause 13.1"
            label="Payment Frequency / Invoicing Details"
          >
            <input
              id="ct-13-1-details"
              type="text"
              value={value.clause13_1_frequencyDetails}
              onChange={(e) => update('clause13_1_frequencyDetails', e.target.value)}
              placeholder="e.g., Monthly in arrears upon certified service reports, 30 days credit"
              className={baseInputClass()}
            />
          </FieldWrapper>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 13.2
                </span>
                Retention Rate (%)
              </span>
              <NaCheckboxRow
                id="ct-13-2-na"
                checked={value.clause13_2_notApplicable}
                onChange={(checked) => update('clause13_2_notApplicable', checked)}
              />
            </div>
            {value.clause13_2_notApplicable ? (
              <FieldWrapper
                id="ct-13-2-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause13_2_naReason}
              >
                <input
                  id="ct-13-2-na-reason"
                  type="text"
                  value={value.clause13_2_naReason}
                  onChange={(e) => update('clause13_2_naReason', e.target.value)}
                  placeholder="e.g., Routine term servicing with no retention sum"
                  className={baseInputClass(Boolean(errors.clause13_2_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper
                id="ct-13-2-pct"
                label="Retention Percentage"
                error={errors.clause13_2_retentionRatePct}
              >
                <div className="relative">
                  <input
                    id="ct-13-2-pct"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={value.clause13_2_retentionRatePct}
                    onChange={(e) => update('clause13_2_retentionRatePct', e.target.value)}
                    placeholder="e.g., 5"
                    className={`${baseInputClass(Boolean(errors.clause13_2_retentionRatePct))} pr-8 font-mono tabular-nums`}
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-mono">
                    %
                  </span>
                </div>
              </FieldWrapper>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <FieldWrapper
              id="ct-13-7"
              clauseRef="Clause 13.7"
              label="SOP Act Applicability"
              required
              error={errors.clause13_7_sopApplicable}
            >
              <select
                id="ct-13-7"
                value={value.clause13_7_sopApplicable}
                onChange={(e) =>
                  update(
                    'clause13_7_sopApplicable',
                    e.target.value as ContractTerms['clause13_7_sopApplicable']
                  )
                }
                className={baseInputClass(Boolean(errors.clause13_7_sopApplicable))}
              >
                <option value="">Select applicability...</option>
                <option value="Applicable">Applicable (Building & Construction Industry SOP Act)</option>
                <option value="Not applicable">Not applicable</option>
              </select>
            </FieldWrapper>
            <FieldWrapper id="ct-13-7-details" label="SOP Act Details / Timeline Notes">
              <input
                id="ct-13-7-details"
                type="text"
                value={value.clause13_7_details}
                onChange={(e) => update('clause13_7_details', e.target.value)}
                placeholder="e.g., Payment response within 21 days of payment claim"
                className={baseInputClass()}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>

      {/* Site Control, Completion, Maintenance & Warranty (14, 17, 18, 18.1, 19) */}
      <div className="space-y-5 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Site Control, Completion, Maintenance & Warranty Periods
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 14
                </span>
                Vendor&apos;s Control of Site
              </span>
              <NaCheckboxRow
                id="ct-14-na"
                checked={value.clause14_notApplicable}
                onChange={(checked) => update('clause14_notApplicable', checked)}
              />
            </div>
            {value.clause14_notApplicable ? (
              <FieldWrapper
                id="ct-14-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause14_naReason}
              >
                <input
                  id="ct-14-na-reason"
                  type="text"
                  value={value.clause14_naReason}
                  onChange={(e) => update('clause14_naReason', e.target.value)}
                  className={baseInputClass(Boolean(errors.clause14_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper id="ct-14-val" label="Site Control & Access Conditions">
                <textarea
                  id="ct-14-val"
                  rows={2}
                  value={value.clause14_controlOfSite}
                  onChange={(e) => update('clause14_controlOfSite', e.target.value)}
                  placeholder="e.g., Non-exclusive access; subject to building management security sign-in & PTW"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 17
                </span>
                Completion Certificate Requirements
              </span>
              <NaCheckboxRow
                id="ct-17-na"
                checked={value.clause17_notApplicable}
                onChange={(checked) => update('clause17_notApplicable', checked)}
              />
            </div>
            {value.clause17_notApplicable ? (
              <FieldWrapper
                id="ct-17-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause17_naReason}
              >
                <input
                  id="ct-17-na-reason"
                  type="text"
                  value={value.clause17_naReason}
                  onChange={(e) => update('clause17_naReason', e.target.value)}
                  className={baseInputClass(Boolean(errors.clause17_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper id="ct-17-val" label="Certificate / Handover Requirements">
                <textarea
                  id="ct-17-val"
                  rows={2}
                  value={value.clause17_completionCertificate}
                  onChange={(e) => update('clause17_completionCertificate', e.target.value)}
                  placeholder="e.g., Joint inspection, O&M manuals, test & commissioning records prior to completion cert"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <FieldWrapper
              id="ct-18-app"
              clauseRef="Clause 18 & 18.1"
              label="Maintenance Period Applicability"
              required
              error={errors.clause18_maintenanceApplicable}
            >
              <select
                id="ct-18-app"
                value={value.clause18_maintenanceApplicable}
                onChange={(e) =>
                  update(
                    'clause18_maintenanceApplicable',
                    e.target.value as ContractTerms['clause18_maintenanceApplicable']
                  )
                }
                className={baseInputClass(Boolean(errors.clause18_maintenanceApplicable))}
              >
                <option value="">Select...</option>
                <option value="Applicable">Applicable (Defects Liability / Maintenance Period)</option>
                <option value="Not applicable">Not applicable</option>
              </select>
            </FieldWrapper>

            {value.clause18_maintenanceApplicable === 'Applicable' && (
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper
                  id="ct-18-1-dur"
                  clauseRef="Clause 18.1"
                  label="Duration"
                  error={errors.clause18_1_durationValue}
                >
                  <input
                    id="ct-18-1-dur"
                    type="number"
                    min="0"
                    step="1"
                    value={value.clause18_1_durationValue}
                    onChange={(e) => update('clause18_1_durationValue', e.target.value)}
                    placeholder="e.g., 12"
                    className={`${baseInputClass(Boolean(errors.clause18_1_durationValue))} font-mono tabular-nums`}
                  />
                </FieldWrapper>
                <FieldWrapper id="ct-18-1-unit" label="Unit">
                  <select
                    id="ct-18-1-unit"
                    value={value.clause18_1_durationUnit}
                    onChange={(e) =>
                      update(
                        'clause18_1_durationUnit',
                        e.target.value as ContractTerms['clause18_1_durationUnit']
                      )
                    }
                    className={baseInputClass()}
                  >
                    <option value="months">Months</option>
                    <option value="days">Days</option>
                    <option value="years">Years</option>
                  </select>
                </FieldWrapper>
              </div>
            )}

            <FieldWrapper id="ct-18-details" label="Maintenance Period Details / Explanation">
              <input
                id="ct-18-details"
                type="text"
                value={value.clause18_details}
                onChange={(e) => update('clause18_details', e.target.value)}
                placeholder="e.g., Defects rectification within 48 hours of notice"
                className={baseInputClass()}
              />
            </FieldWrapper>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 19
                </span>
                Warranty Period
              </span>
              <NaCheckboxRow
                id="ct-19-na"
                checked={value.clause19_notApplicable}
                onChange={(checked) => update('clause19_notApplicable', checked)}
              />
            </div>

            {!value.clause19_notApplicable && (
              <div className="grid grid-cols-2 gap-3">
                <FieldWrapper
                  id="ct-19-dur"
                  label="Duration"
                  error={errors.clause19_durationValue}
                >
                  <input
                    id="ct-19-dur"
                    type="number"
                    min="0"
                    step="1"
                    value={value.clause19_durationValue}
                    onChange={(e) => update('clause19_durationValue', e.target.value)}
                    placeholder="e.g., 12"
                    className={`${baseInputClass(Boolean(errors.clause19_durationValue))} font-mono tabular-nums`}
                  />
                </FieldWrapper>
                <FieldWrapper id="ct-19-unit" label="Unit">
                  <select
                    id="ct-19-unit"
                    value={value.clause19_durationUnit}
                    onChange={(e) =>
                      update(
                        'clause19_durationUnit',
                        e.target.value as ContractTerms['clause19_durationUnit']
                      )
                    }
                    className={baseInputClass()}
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                </FieldWrapper>
              </div>
            )}

            <FieldWrapper
              id="ct-19-details"
              label={
                value.clause19_notApplicable ? 'Explanation for Not Applicable' : 'Warranty Details'
              }
            >
              <input
                id="ct-19-details"
                type="text"
                value={value.clause19_details}
                onChange={(e) => update('clause19_details', e.target.value)}
                placeholder="e.g., Parts & workmanship warranty from date of completion"
                className={baseInputClass()}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>

      {/* Performance Bond & Liquidated Damages (20.1, 20.3, 21.1) */}
      <div className="space-y-5 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Performance Bond & Liquidated Damages
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 20.1
                </span>
                Quantum of Performance Bond
              </span>
              <NaCheckboxRow
                id="ct-20-1-na"
                checked={value.clause20_1_notApplicable}
                onChange={(checked) => update('clause20_1_notApplicable', checked)}
              />
            </div>

            {value.clause20_1_notApplicable ? (
              <FieldWrapper
                id="ct-20-1-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause20_1_naReason}
              >
                <input
                  id="ct-20-1-na-reason"
                  type="text"
                  value={value.clause20_1_naReason}
                  onChange={(e) => update('clause20_1_naReason', e.target.value)}
                  className={baseInputClass(Boolean(errors.clause20_1_naReason))}
                />
              </FieldWrapper>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldWrapper id="ct-20-1-basis" label="Basis">
                  <select
                    id="ct-20-1-basis"
                    value={value.clause20_1_quantumBasis}
                    onChange={(e) =>
                      update(
                        'clause20_1_quantumBasis',
                        e.target.value as ContractTerms['clause20_1_quantumBasis']
                      )
                    }
                    className={baseInputClass()}
                  >
                    <option value="percentage">% of Contract Sum</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </FieldWrapper>
                <FieldWrapper
                  id="ct-20-1-val"
                  label={
                    value.clause20_1_quantumBasis === 'percentage'
                      ? 'Percentage (%)'
                      : `Amount (${value.clause20_1_currency || 'SGD'})`
                  }
                  error={errors.clause20_1_quantumValue}
                >
                  <input
                    id="ct-20-1-val"
                    type="number"
                    min="0"
                    step="0.5"
                    value={value.clause20_1_quantumValue}
                    onChange={(e) => update('clause20_1_quantumValue', e.target.value)}
                    placeholder={
                      value.clause20_1_quantumBasis === 'percentage' ? 'e.g., 5' : 'e.g., 10000'
                    }
                    className={`${baseInputClass(Boolean(errors.clause20_1_quantumValue))} font-mono tabular-nums`}
                  />
                </FieldWrapper>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-800">
                <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                  Clause 20.3
                </span>
                Duration of Performance Bond
              </span>
              <NaCheckboxRow
                id="ct-20-3-na"
                checked={value.clause20_3_notApplicable}
                onChange={(checked) => update('clause20_3_notApplicable', checked)}
              />
            </div>

            {value.clause20_3_notApplicable ? (
              <FieldWrapper
                id="ct-20-3-na-reason"
                label="Explanation for Not Applicable"
                required
                error={errors.clause20_3_naReason}
              >
                <input
                  id="ct-20-3-na-reason"
                  type="text"
                  value={value.clause20_3_naReason}
                  onChange={(e) => update('clause20_3_naReason', e.target.value)}
                  className={baseInputClass(Boolean(errors.clause20_3_naReason))}
                />
              </FieldWrapper>
            ) : (
              <FieldWrapper id="ct-20-3-val" label="Bond Validity Duration">
                <input
                  id="ct-20-3-val"
                  type="text"
                  value={value.clause20_3_duration}
                  onChange={(e) => update('clause20_3_duration', e.target.value)}
                  placeholder="e.g., Contract period plus 3 months after expiry / DLP"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            )}
          </div>
        </div>

        {/* Clause 21.1 Liquidated Damages */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                Clause 21.1
              </span>
              Liquidated Damages (Amount, Basis & Cap)
            </span>
            <NaCheckboxRow
              id="ct-21-1-na"
              checked={value.clause21_1_notApplicable}
              onChange={(checked) => update('clause21_1_notApplicable', checked)}
            />
          </div>

          {value.clause21_1_notApplicable ? (
            <FieldWrapper
              id="ct-21-1-na-reason"
              label="Explanation for Not Applicable"
              required
              error={errors.clause21_1_naReason}
            >
              <input
                id="ct-21-1-na-reason"
                type="text"
                value={value.clause21_1_naReason}
                onChange={(e) => update('clause21_1_naReason', e.target.value)}
                className={baseInputClass(Boolean(errors.clause21_1_naReason))}
              />
            </FieldWrapper>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <FieldWrapper id="ct-21-1-cur" label="Currency">
                <select
                  id="ct-21-1-cur"
                  value={value.clause21_1_currency}
                  onChange={(e) => update('clause21_1_currency', e.target.value)}
                  className={baseInputClass()}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </FieldWrapper>

              <FieldWrapper
                id="ct-21-1-amt"
                label="Amount"
                error={errors.clause21_1_amount}
              >
                <input
                  id="ct-21-1-amt"
                  type="number"
                  min="0"
                  step="1"
                  value={value.clause21_1_amount}
                  onChange={(e) => update('clause21_1_amount', e.target.value)}
                  placeholder="e.g., 500"
                  className={`${baseInputClass(Boolean(errors.clause21_1_amount))} font-mono tabular-nums`}
                />
              </FieldWrapper>

              <FieldWrapper id="ct-21-1-basis" label="Basis">
                <select
                  id="ct-21-1-basis"
                  value={value.clause21_1_basis}
                  onChange={(e) =>
                    update(
                      'clause21_1_basis',
                      e.target.value as ContractTerms['clause21_1_basis']
                    )
                  }
                  className={baseInputClass()}
                >
                  <option value="">Select basis...</option>
                  <option value="Per calendar day">Per calendar day</option>
                  <option value="Per week">Per week</option>
                  <option value="Per incident / SLA breach">Per incident / SLA breach</option>
                  <option value="Other">Other</option>
                </select>
              </FieldWrapper>

              <FieldWrapper id="ct-21-1-cap" label="Applicable Cap">
                <input
                  id="ct-21-1-cap"
                  type="text"
                  value={value.clause21_1_cap}
                  onChange={(e) => update('clause21_1_cap', e.target.value)}
                  placeholder="e.g., 10% of contract sum"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            </div>
          )}
        </div>
      </div>

      {/* Clause 22.1 Insurances */}
      <div className="space-y-4 border-t border-slate-200 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                Clause 22.1
              </span>
              Insurance Types & Required Coverage
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Add one row per required policy (e.g., Public Liability, Work Injury Compensation).
            </p>
          </div>
          <NaCheckboxRow
            id="ct-22-1-na"
            checked={value.clause22_1_notApplicable}
            onChange={(checked) => update('clause22_1_notApplicable', checked)}
          />
        </div>

        {value.clause22_1_notApplicable ? (
          <FieldWrapper
            id="ct-22-1-na-reason"
            label="Explanation for Not Applicable"
            required
            error={errors.clause22_1_naReason}
          >
            <input
              id="ct-22-1-na-reason"
              type="text"
              value={value.clause22_1_naReason}
              onChange={(e) => update('clause22_1_naReason', e.target.value)}
              className={baseInputClass(Boolean(errors.clause22_1_naReason))}
            />
          </FieldWrapper>
        ) : (
          <div className="space-y-3">
            {value.clause22_1_insurances.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                <p className="text-sm text-slate-600">No insurance entries added yet.</p>
                <button
                  type="button"
                  onClick={addInsurance}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Add Insurance Requirement
                </button>
              </div>
            ) : (
              <>
                {value.clause22_1_insurances.map((ins, idx) => {
                  const amtErr = errors[`clause22_1_insurances.${idx}.coverageAmount`];
                  return (
                    <div
                      key={ins.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-lg border border-slate-200 bg-white p-3.5 items-start"
                    >
                      <div className="md:col-span-4">
                        <FieldWrapper
                          id={`ins-type-${ins.id}`}
                          label="Insurance Type"
                        >
                          <input
                            id={`ins-type-${ins.id}`}
                            type="text"
                            value={ins.type}
                            onChange={(e) =>
                              updateInsurance(idx, { type: e.target.value })
                            }
                            placeholder="e.g., Public Liability"
                            className={baseInputClass()}
                          />
                        </FieldWrapper>
                      </div>
                      <div className="md:col-span-2">
                        <FieldWrapper id={`ins-cur-${ins.id}`} label="Currency">
                          <select
                            id={`ins-cur-${ins.id}`}
                            value={ins.currency}
                            onChange={(e) =>
                              updateInsurance(idx, { currency: e.target.value })
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
                      <div className="md:col-span-3">
                        <FieldWrapper
                          id={`ins-amt-${ins.id}`}
                          label="Coverage Amount"
                          error={amtErr}
                        >
                          <input
                            id={`ins-amt-${ins.id}`}
                            type="number"
                            min="0"
                            step="1"
                            value={ins.coverageAmount}
                            onChange={(e) =>
                              updateInsurance(idx, { coverageAmount: e.target.value })
                            }
                            placeholder="e.g., 2000000"
                            className={`${baseInputClass(Boolean(amtErr))} font-mono tabular-nums`}
                          />
                        </FieldWrapper>
                      </div>
                      <div className="md:col-span-2">
                        <FieldWrapper id={`ins-rem-${ins.id}`} label="Remarks">
                          <input
                            id={`ins-rem-${ins.id}`}
                            type="text"
                            value={ins.remarks}
                            onChange={(e) =>
                              updateInsurance(idx, { remarks: e.target.value })
                            }
                            placeholder="e.g., Any one occurrence"
                            className={baseInputClass()}
                          />
                        </FieldWrapper>
                      </div>
                      <div className="md:col-span-1 flex md:justify-end md:pt-6">
                        <button
                          type="button"
                          onClick={() => removeInsurance(idx)}
                          aria-label={`Remove insurance row ${idx + 1}`}
                          className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={addInsurance}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  Add Another Insurance
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Termination & Renewal (25.1, 26.1, 33) */}
      <div className="space-y-5 border-t border-slate-200 pt-6">
        <h3 className="text-sm font-semibold text-slate-900">
          Termination Notice & Option to Renew
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <span className="block text-sm font-medium text-slate-800">
              <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                Clause 25.1
              </span>
              Employer Termination Notice
            </span>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper
                id="ct-25-1-val"
                label="Notice Period"
                error={errors.clause25_1_noticeValue}
              >
                <input
                  id="ct-25-1-val"
                  type="number"
                  min="0"
                  step="1"
                  value={value.clause25_1_noticeValue}
                  onChange={(e) => update('clause25_1_noticeValue', e.target.value)}
                  placeholder="e.g., 30"
                  className={`${baseInputClass(Boolean(errors.clause25_1_noticeValue))} font-mono tabular-nums`}
                />
              </FieldWrapper>
              <FieldWrapper id="ct-25-1-unit" label="Unit">
                <select
                  id="ct-25-1-unit"
                  value={value.clause25_1_noticeUnit}
                  onChange={(e) =>
                    update(
                      'clause25_1_noticeUnit',
                      e.target.value as ContractTerms['clause25_1_noticeUnit']
                    )
                  }
                  className={baseInputClass()}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </FieldWrapper>
            </div>
            <FieldWrapper id="ct-25-1-det" label="Notice Details">
              <input
                id="ct-25-1-det"
                type="text"
                value={value.clause25_1_details}
                onChange={(e) => update('clause25_1_details', e.target.value)}
                placeholder="e.g., Written notice without cause"
                className={baseInputClass()}
              />
            </FieldWrapper>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <span className="block text-sm font-medium text-slate-800">
              <span className="font-mono text-xs font-semibold text-blue-700 mr-2">
                Clause 26.1
              </span>
              Vendor Termination Notice
            </span>
            <div className="grid grid-cols-2 gap-3">
              <FieldWrapper
                id="ct-26-1-val"
                label="Notice Period"
                error={errors.clause26_1_noticeValue}
              >
                <input
                  id="ct-26-1-val"
                  type="number"
                  min="0"
                  step="1"
                  value={value.clause26_1_noticeValue}
                  onChange={(e) => update('clause26_1_noticeValue', e.target.value)}
                  placeholder="e.g., 60"
                  className={`${baseInputClass(Boolean(errors.clause26_1_noticeValue))} font-mono tabular-nums`}
                />
              </FieldWrapper>
              <FieldWrapper id="ct-26-1-unit" label="Unit">
                <select
                  id="ct-26-1-unit"
                  value={value.clause26_1_noticeUnit}
                  onChange={(e) =>
                    update(
                      'clause26_1_noticeUnit',
                      e.target.value as ContractTerms['clause26_1_noticeUnit']
                    )
                  }
                  className={baseInputClass()}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </FieldWrapper>
            </div>
            <FieldWrapper id="ct-26-1-det" label="Notice Details">
              <input
                id="ct-26-1-det"
                type="text"
                value={value.clause26_1_details}
                onChange={(e) => update('clause26_1_details', e.target.value)}
                placeholder="e.g., Written notice subject to handover obligations"
                className={baseInputClass()}
              />
            </FieldWrapper>
          </div>
        </div>

        {/* Clause 33 */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <FieldWrapper
            id="ct-33-app"
            clauseRef="Clause 33"
            label="Option to Renew"
            required
            hint="Preserve exact template renewal-notice wording for internal legal/procurement review; do not silently reinterpret ambiguous notice periods."
            error={errors.clause33_applicable}
          >
            <select
              id="ct-33-app"
              value={value.clause33_applicable}
              onChange={(e) =>
                update(
                  'clause33_applicable',
                  e.target.value as ContractTerms['clause33_applicable']
                )
              }
              className={baseInputClass(Boolean(errors.clause33_applicable))}
            >
              <option value="">Select...</option>
              <option value="Applicable">Applicable</option>
              <option value="Not applicable">Not applicable</option>
            </select>
          </FieldWrapper>

          {value.clause33_applicable === 'Not applicable' ? (
            <FieldWrapper
              id="ct-33-na-reason"
              label="Explanation for Not Applicable"
              required
              error={errors.clause33_naReason}
            >
              <input
                id="ct-33-na-reason"
                type="text"
                value={value.clause33_naReason}
                onChange={(e) => update('clause33_naReason', e.target.value)}
                placeholder="e.g., One-off works with no renewal option"
                className={baseInputClass(Boolean(errors.clause33_naReason))}
              />
            </FieldWrapper>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldWrapper id="ct-33-dur" label="Renewal Option Duration">
                <input
                  id="ct-33-dur"
                  type="text"
                  value={value.clause33_renewalDuration}
                  onChange={(e) => update('clause33_renewalDuration', e.target.value)}
                  placeholder="e.g., Option to extend for 1 + 1 year"
                  className={baseInputClass()}
                />
              </FieldWrapper>
              <FieldWrapper
                id="ct-33-notice"
                label="Renewal Notice Requirements (Preserved Wording for Review)"
              >
                <textarea
                  id="ct-33-notice"
                  rows={2}
                  value={value.clause33_noticeRequirements}
                  onChange={(e) => update('clause33_noticeRequirements', e.target.value)}
                  placeholder="Enter exact renewal notice wording from template / contract instructions for review"
                  className={baseInputClass()}
                />
              </FieldWrapper>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
