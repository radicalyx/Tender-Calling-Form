import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { DeclarationAndConfirmation } from '../../types/tender';
import {
  DEFAULT_BIZSAFE_DECLARATION,
  DEFAULT_MACHINERY_DECLARATION,
  DEFAULT_PWM_DECLARATION,
  LEGACY_COVID_DECLARATION_TEXT,
} from '../../schema/tenderSchema';
import { FieldWrapper, GuidanceCallout, baseInputClass } from '../FormControls';

interface DeclarationsSectionProps {
  value: DeclarationAndConfirmation;
  onChange: (next: DeclarationAndConfirmation) => void;
  errors: Record<string, string>;
}

export const DeclarationsSection: React.FC<DeclarationsSectionProps> = ({
  value,
  onChange,
  errors,
}) => {
  const update = <K extends keyof DeclarationAndConfirmation>(
    key: K,
    fieldVal: DeclarationAndConfirmation[K]
  ) => {
    onChange({ ...value, [key]: fieldVal });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          6. Declaration and Confirmation
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Internal requestor confirmations are separated from tenderer declarations that
          bidding vendors will sign later upon submission.
        </p>
      </div>

      <GuidanceCallout title="Template Verification Notice">
        <p>
          Standard template clauses below are provided as editable starting text and have
          <strong> not been legally verified</strong>. Confirm final wording with your
          Legal and Procurement teams. Do not pre-confirm declarations or fabricate vendor
          signatures.
        </p>
      </GuidanceCallout>

      {/* Part A: Requestor Confirmations */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Part A. Requestor Confirmation (Internal Preparation)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Completed by the staff member preparing this request to call for tender.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FieldWrapper
            id="dec-req-name"
            label="Requestor Name"
            required
            error={errors.requestorName}
          >
            <input
              id="dec-req-name"
              type="text"
              value={value.requestorName}
              onChange={(e) => update('requestorName', e.target.value)}
              placeholder="e.g., Jordan Lim"
              className={baseInputClass(Boolean(errors.requestorName))}
            />
          </FieldWrapper>

          <FieldWrapper id="dec-req-desig" label="Designation">
            <input
              id="dec-req-desig"
              type="text"
              value={value.requestorDesignation}
              onChange={(e) => update('requestorDesignation', e.target.value)}
              placeholder="e.g., Senior Facilities Manager"
              className={baseInputClass()}
            />
          </FieldWrapper>

          <FieldWrapper id="dec-req-date" label="Confirmation Date">
            <input
              id="dec-req-date"
              type="date"
              value={value.requestorConfirmationDate}
              onChange={(e) => update('requestorConfirmationDate', e.target.value)}
              className={`${baseInputClass()} font-mono tabular-nums`}
            />
          </FieldWrapper>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <label className="inline-flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={value.requestorConfirmedScopeComplete}
                onChange={(e) =>
                  update('requestorConfirmedScopeComplete', e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                I confirm that the Schedule of Works, technical specifications and
                contract checklist inputs accurately reflect operational requirements for
                tender issuance.
                <span className="text-red-600 ml-1" aria-hidden="true">
                  *
                </span>
              </span>
            </label>
            {errors.requestorConfirmedScopeComplete && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {errors.requestorConfirmedScopeComplete}
              </p>
            )}
          </div>

          <div>
            <label className="inline-flex items-start gap-2.5 text-sm text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={value.requestorConfirmedBudgetAndApprovals}
                onChange={(e) =>
                  update('requestorConfirmedBudgetAndApprovals', e.target.checked)
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>
                I confirm that budget checks, reference quotations (where required) and
                applicable internal endorsements have been reviewed.
                <span className="text-red-600 ml-1" aria-hidden="true">
                  *
                </span>
              </span>
            </label>
            {errors.requestorConfirmedBudgetAndApprovals && (
              <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                {errors.requestorConfirmedBudgetAndApprovals}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Part B: Tenderer Declarations (to be completed later by vendor) */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            Part B. Tenderer Declaration Clauses (To Be Completed by Tenderer Later)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Edit the declaration wording printed on the tender document. Signature and
            company stamp blocks remain blank for the bidding vendor.
          </p>
        </div>

        <FieldWrapper
          id="dec-machinery"
          label="Inclusion of Machinery, Tools and Equipment"
        >
          <textarea
            id="dec-machinery"
            rows={2}
            value={value.machineryToolsText}
            onChange={(e) => update('machineryToolsText', e.target.value)}
            className={baseInputClass()}
          />
          <button
            type="button"
            onClick={() => update('machineryToolsText', DEFAULT_MACHINERY_DECLARATION)}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Reset to template wording
          </button>
        </FieldWrapper>

        <FieldWrapper
          id="dec-pwm"
          label="Applicable Progressive Wage Model (PWM) Requirements"
        >
          <textarea
            id="dec-pwm"
            rows={2}
            value={value.pwmText}
            onChange={(e) => update('pwmText', e.target.value)}
            className={baseInputClass()}
          />
          <button
            type="button"
            onClick={() => update('pwmText', DEFAULT_PWM_DECLARATION)}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Reset to template wording
          </button>
        </FieldWrapper>

        <FieldWrapper
          id="dec-bizsafe"
          label="bizSAFE Level & Certification Expiry Declaration"
        >
          <textarea
            id="dec-bizsafe"
            rows={2}
            value={value.bizSafeDeclarationText}
            onChange={(e) => update('bizSafeDeclarationText', e.target.value)}
            className={baseInputClass()}
          />
          <button
            type="button"
            onClick={() => update('bizSafeDeclarationText', DEFAULT_BIZSAFE_DECLARATION)}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Reset to template wording
          </button>
        </FieldWrapper>

        {/* Legacy COVID-19 Declaration — excluded by default */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="w-4 h-4 text-amber-700 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-950 uppercase tracking-wide">
                Legacy Template Clause — COVID-19 Vaccination Declaration
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">
                The source template contains a COVID-19 vaccination declaration. This is
                flagged as legacy wording requiring internal review and is{' '}
                <strong>excluded by default</strong> from exports unless you explicitly
                choose to include it.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-amber-950 cursor-pointer">
            <input
              type="checkbox"
              checked={value.includeLegacyCovidDeclaration}
              onChange={(e) =>
                update('includeLegacyCovidDeclaration', e.target.checked)
              }
              className="h-4 w-4 rounded border-amber-400 text-amber-700 focus:ring-amber-600"
            />
            <span>Explicitly include legacy COVID-19 vaccination declaration in exports</span>
          </label>

          {value.includeLegacyCovidDeclaration && (
            <div className="space-y-1.5">
              <textarea
                aria-label="Legacy COVID-19 declaration wording"
                rows={2}
                value={value.legacyCovidDeclarationText}
                onChange={(e) =>
                  update('legacyCovidDeclarationText', e.target.value)
                }
                className={baseInputClass()}
              />
              <button
                type="button"
                onClick={() =>
                  update('legacyCovidDeclarationText', LEGACY_COVID_DECLARATION_TEXT)
                }
                className="text-xs text-amber-800 hover:text-amber-950 underline"
              >
                Reset legacy text
              </button>
            </div>
          )}
        </div>

        {/* Blank Sign-off Placeholders Preview */}
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Tenderer Sign-Off Placeholders Included in Exports (Blank)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <div>Authorised Signatory Name &amp; Signature: ________________________</div>
            <div>Company Name &amp; Official Stamp: ______________________________</div>
            <div>bizSAFE Level &amp; Expiry Date: ________________________________</div>
            <div>Date of Submission: _________________________________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
