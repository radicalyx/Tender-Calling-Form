import React from 'react';
import { BusinessUnit, ContractType, TenderOverview } from '../../types/tender';
import { FieldWrapper, baseInputClass } from '../FormControls';

interface OverviewSectionProps {
  value: TenderOverview;
  onChange: (next: TenderOverview) => void;
  errors: Record<string, string>;
}

const BUSINESS_UNITS: Array<{ value: Exclude<BusinessUnit, ''>; label: string }> = [
  { value: 'HBG', label: 'HBG' },
  { value: 'RBG', label: 'RBG' },
  { value: 'SLG', label: 'SLG' },
  { value: 'CED', label: 'CED' },
  { value: 'Other', label: 'Other' },
];

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  value,
  onChange,
  errors,
}) => {
  const update = <K extends keyof TenderOverview>(key: K, fieldVal: TenderOverview[K]) => {
    onChange({ ...value, [key]: fieldVal });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">1. Tender Overview</h2>
        <p className="mt-1 text-sm text-slate-600">
          Identify the property, tender title, contract structure, business unit and site
          showround contacts. All fields start blank; placeholder text shows formatting examples.
        </p>
      </div>

      {/* Contract Type Segmented Switch */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">Contract Type</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Selecting Term Contract or Ad-hoc Works dynamically adapts Schedule of Works,
              Technical Schedules and Specifications.
            </p>
          </div>
          <div
            className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1"
            role="radiogroup"
            aria-label="Contract type"
          >
            {(['Term Contract', 'Ad-hoc Works'] as ContractType[]).map((type) => {
              const active = value.contractType === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => update('contractType', type)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                    active
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <FieldWrapper
          id="ov-propertyName"
          label="Name of Property"
          required
          error={errors.propertyName}
        >
          <input
            id="ov-propertyName"
            type="text"
            value={value.propertyName}
            onChange={(e) => update('propertyName', e.target.value)}
            placeholder="e.g., Harbourfront Commercial Plaza"
            aria-invalid={Boolean(errors.propertyName)}
            className={baseInputClass(Boolean(errors.propertyName))}
          />
        </FieldWrapper>

        <FieldWrapper
          id="ov-employerName"
          label="Name of Employer"
          required
          error={errors.employerName}
        >
          <input
            id="ov-employerName"
            type="text"
            value={value.employerName}
            onChange={(e) => update('employerName', e.target.value)}
            placeholder="e.g., Harbourfront Property Management Pte Ltd"
            aria-invalid={Boolean(errors.employerName)}
            className={baseInputClass(Boolean(errors.employerName))}
          />
        </FieldWrapper>

        <div className="md:col-span-2">
          <FieldWrapper
            id="ov-tenderSubject"
            label="Tender Subject / Title"
            required
            error={errors.tenderSubject}
          >
            <input
              id="ov-tenderSubject"
              type="text"
              value={value.tenderSubject}
              onChange={(e) => update('tenderSubject', e.target.value)}
              placeholder="e.g., Term Contract for Chiller Plant Preventive Maintenance and Servicing"
              aria-invalid={Boolean(errors.tenderSubject)}
              className={baseInputClass(Boolean(errors.tenderSubject))}
            />
          </FieldWrapper>
        </div>

        <FieldWrapper
          id="ov-businessUnit"
          label="Business Unit"
          required
          error={errors.businessUnit}
        >
          <select
            id="ov-businessUnit"
            value={value.businessUnit}
            onChange={(e) => update('businessUnit', e.target.value as BusinessUnit)}
            aria-invalid={Boolean(errors.businessUnit)}
            className={baseInputClass(Boolean(errors.businessUnit))}
          >
            <option value="">Select business unit...</option>
            {BUSINESS_UNITS.map((bu) => (
              <option key={bu.value} value={bu.value}>
                {bu.label}
              </option>
            ))}
          </select>
        </FieldWrapper>

        {value.businessUnit === 'Other' ? (
          <FieldWrapper
            id="ov-businessUnitOther"
            label="Specify Other Business Unit"
            required
            error={errors.businessUnitOther}
          >
            <input
              id="ov-businessUnitOther"
              type="text"
              value={value.businessUnitOther}
              onChange={(e) => update('businessUnitOther', e.target.value)}
              placeholder="e.g., Industrial Logistics Division"
              aria-invalid={Boolean(errors.businessUnitOther)}
              className={baseInputClass(Boolean(errors.businessUnitOther))}
            />
          </FieldWrapper>
        ) : (
          <FieldWrapper
            id="ov-materialGroup"
            label="Material Group"
            required
            error={errors.materialGroup}
          >
            <input
              id="ov-materialGroup"
              type="text"
              value={value.materialGroup}
              onChange={(e) => update('materialGroup', e.target.value)}
              placeholder="e.g., M&E Maintenance / ACMV (MG-2040)"
              aria-invalid={Boolean(errors.materialGroup)}
              className={baseInputClass(Boolean(errors.materialGroup))}
            />
          </FieldWrapper>
        )}

        {value.businessUnit === 'Other' && (
          <div className="md:col-span-2">
            <FieldWrapper
              id="ov-materialGroup"
              label="Material Group"
              required
              error={errors.materialGroup}
            >
              <input
                id="ov-materialGroup"
                type="text"
                value={value.materialGroup}
                onChange={(e) => update('materialGroup', e.target.value)}
                placeholder="e.g., M&E Maintenance / ACMV (MG-2040)"
                aria-invalid={Boolean(errors.materialGroup)}
                className={baseInputClass(Boolean(errors.materialGroup))}
              />
            </FieldWrapper>
          </div>
        )}
      </div>

      {/* Primary Contact & Address */}
      <div className="border-t border-slate-200 pt-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">
          Primary Requestor Contact & Service Address
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <FieldWrapper
            id="ov-contactPerson"
            label="Contact Person"
            required
            error={errors.contactPerson}
          >
            <input
              id="ov-contactPerson"
              type="text"
              value={value.contactPerson}
              onChange={(e) => update('contactPerson', e.target.value)}
              placeholder="e.g., Alex Tan"
              aria-invalid={Boolean(errors.contactPerson)}
              className={baseInputClass(Boolean(errors.contactPerson))}
            />
          </FieldWrapper>

          <FieldWrapper
            id="ov-contactPhone"
            label="Telephone Number"
            required
            error={errors.contactPhone}
          >
            <input
              id="ov-contactPhone"
              type="tel"
              value={value.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
              placeholder="e.g., +65 6123 4567"
              aria-invalid={Boolean(errors.contactPhone)}
              className={`${baseInputClass(Boolean(errors.contactPhone))} font-mono tabular-nums`}
            />
          </FieldWrapper>

          <FieldWrapper
            id="ov-contactEmail"
            label="Email Address"
            required
            error={errors.contactEmail}
          >
            <input
              id="ov-contactEmail"
              type="email"
              value={value.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
              placeholder="e.g., facilities@example.com"
              aria-invalid={Boolean(errors.contactEmail)}
              className={baseInputClass(Boolean(errors.contactEmail))}
            />
          </FieldWrapper>
        </div>

        <FieldWrapper
          id="ov-serviceSiteAddress"
          label="Service / Site Address"
          required
          error={errors.serviceSiteAddress}
        >
          <textarea
            id="ov-serviceSiteAddress"
            rows={2}
            value={value.serviceSiteAddress}
            onChange={(e) => update('serviceSiteAddress', e.target.value)}
            placeholder="e.g., 10 Maritime Square, Level 3 Plant Room, Singapore 099253"
            aria-invalid={Boolean(errors.serviceSiteAddress)}
            className={baseInputClass(Boolean(errors.serviceSiteAddress))}
          />
        </FieldWrapper>
      </div>

      {/* Site Showround */}
      <div className="border-t border-slate-200 pt-6 space-y-5">
        <h3 className="text-sm font-semibold text-slate-900">Site Showround Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.showroundSameAsContact}
                onChange={(e) => update('showroundSameAsContact', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Showround contact person is same as above</span>
            </label>

            <FieldWrapper
              id="ov-showroundContactPerson"
              label="Site Showround Contact Person"
              required={!value.showroundSameAsContact}
              error={errors.showroundContactPerson}
            >
              <input
                id="ov-showroundContactPerson"
                type="text"
                disabled={value.showroundSameAsContact}
                value={
                  value.showroundSameAsContact
                    ? value.contactPerson
                    : value.showroundContactPerson
                }
                onChange={(e) => update('showroundContactPerson', e.target.value)}
                placeholder="e.g., Siti Rahman (Site Engineer)"
                className={baseInputClass(
                  Boolean(errors.showroundContactPerson),
                  value.showroundSameAsContact
                )}
              />
            </FieldWrapper>

            {!value.showroundSameAsContact && (
              <FieldWrapper
                id="ov-showroundContactPhone"
                label="Showround Contact Phone (Optional)"
              >
                <input
                  id="ov-showroundContactPhone"
                  type="tel"
                  value={value.showroundContactPhone}
                  onChange={(e) => update('showroundContactPhone', e.target.value)}
                  placeholder="e.g., +65 9876 5432"
                  className={`${baseInputClass()} font-mono tabular-nums`}
                />
              </FieldWrapper>
            )}
          </div>

          <div className="space-y-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={value.showroundSameAsSiteAddress}
                onChange={(e) => update('showroundSameAsSiteAddress', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              <span>Showround meeting point is same as service/site address</span>
            </label>

            <FieldWrapper
              id="ov-showroundMeetingPoint"
              label="Site Showround Meeting Point"
              required={!value.showroundSameAsSiteAddress}
              error={errors.showroundMeetingPoint}
            >
              <textarea
                id="ov-showroundMeetingPoint"
                rows={2}
                disabled={value.showroundSameAsSiteAddress}
                value={
                  value.showroundSameAsSiteAddress
                    ? value.serviceSiteAddress
                    : value.showroundMeetingPoint
                }
                onChange={(e) => update('showroundMeetingPoint', e.target.value)}
                placeholder="e.g., Main Concierge Lobby, Level 1, 10:00 AM"
                className={baseInputClass(
                  Boolean(errors.showroundMeetingPoint),
                  value.showroundSameAsSiteAddress
                )}
              />
            </FieldWrapper>
          </div>
        </div>
      </div>
    </div>
  );
};
