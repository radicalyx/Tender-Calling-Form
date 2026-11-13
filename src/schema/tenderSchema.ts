import {
  BusinessUnit,
  InsuranceEntry,
  ReferenceQuotationEntry,
  ScheduleOfRatesRow,
  ScopeItemEntry,
  SpecificationItemEntry,
  TechnicalScheduleItem,
  TenderFormData,
} from '../types/tender';

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const GENERAL_TEMPLATE_NOTES: string[] = [
  'Submit tender requests four (4) months before contract commencement, subject to scope and complexity.',
  'For urgent works requiring award within one (1) month, provide three (3) reference quotations.',
  'Preserve and review Clause 33 renewal-notice wording carefully before issuance; do not rely on unverified template wording as legal advice.',
];

export const BU_ENDORSEMENT_GUIDANCE: Record<
  Exclude<BusinessUnit, ''>,
  { label: string; requirement: string }
> = {
  HBG: {
    label: 'HBG',
    requirement: 'SRF / MRF / eIM endorsed by GMs / HMs / RMs.',
  },
  RBG: {
    label: 'RBG',
    requirement: 'PRF endorsed by GMs.',
  },
  SLG: {
    label: 'SLG',
    requirement: 'Email approval from SM.',
  },
  CED: {
    label: 'CED',
    requirement: 'Email approval from the respective BU.',
  },
  Other: {
    label: 'Other BU',
    requirement: 'Endorsement by HOD.',
  },
};

export const CURRENCY_OPTIONS = ['SGD', 'USD', 'MYR', 'EUR', 'GBP', 'AUD'] as const;

export const DEFAULT_MACHINERY_DECLARATION =
  'The Tenderer confirms that all necessary machinery, tools, ladders/scaffolding, test instruments, personal protective equipment and consumables required to execute the works are included in the tender offer.';

export const DEFAULT_PWM_DECLARATION =
  'Where applicable to the contracted trades, the Tenderer confirms compliance with Singapore Progressive Wage Model (PWM) wage, training and reporting requirements throughout the contract period.';

export const DEFAULT_BIZSAFE_DECLARATION =
  'The Tenderer confirms possession of valid bizSAFE Level 3 certification (or equivalent recognised safety certification) and will provide the certificate number, level and expiry date upon tender submission.';

export const LEGACY_COVID_DECLARATION_TEXT =
  '[LEGACY TEMPLATE WORDING — REVIEW REQUIRED] The Tenderer confirms that all personnel deployed to the site comply with prevailing national vaccination and workplace safe-management requirements.';

export function createInitialTechnicalSchedules(): TechnicalScheduleItem[] {
  return [
    {
      key: 'scheduleOfWorks',
      label: 'Schedule of Works',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'scheduleOfRates',
      label: 'Schedule of Rates and Validity Period',
      applicable: '',
      details: '',
      validityGuidance:
        'Template guidance: Confirm SOR validity period (e.g., 90 calendar days from tender closing or aligned with contract period). Editable guidance — not a binding contractual default.',
      attachmentIds: [],
    },
    {
      key: 'scheduleOfOptionalWorks',
      label: 'Schedule of Optional Works and Validity Period',
      applicable: '',
      details: '',
      validityGuidance:
        'Template guidance: State validity period for optional works pricing separately if optional items may be exercised post-award. Editable guidance — not a binding contractual default.',
      attachmentIds: [],
    },
    {
      key: 'houseRules',
      label: 'House Rules / Retail Mall Guidelines',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'newSystemSpecs',
      label: 'Specifications for New Systems or Equipment',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'preferredBrands',
      label: 'Preferred Brands and Models',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'drawingsAndPhotos',
      label: 'Drawings, Photographs and Layout Plans (PDF)',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'termContractTenure',
      label: 'Term Contract Tenure',
      termOnly: true,
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'existingInstaller',
      label: 'Original Equipment Installer / Existing Maintenance Contractor',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'existingEquipmentOverview',
      label: 'Existing Equipment Overview',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
    {
      key: 'replacementPhasedPlan',
      label: 'Replacement Proposals and Phased Implementation Plans',
      applicable: '',
      details: '',
      attachmentIds: [],
    },
  ];
}

export function createInitialFormData(): TenderFormData {
  return {
    overview: {
      propertyName: '',
      tenderSubject: '',
      contractType: 'Term Contract',
      employerName: '',
      businessUnit: '',
      businessUnitOther: '',
      materialGroup: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      serviceSiteAddress: '',
      showroundSameAsContact: false,
      showroundContactPerson: '',
      showroundContactPhone: '',
      showroundSameAsSiteAddress: false,
      showroundMeetingPoint: '',
    },
    contractTerms: {
      clause5_1_scopeSummary: '',
      clause5_1_serviceFrequency: '',
      clause5_2_commencementDate: '',
      clause5_2_completionDate: '',
      clause6_3_bizSafeRequired: '',
      clause6_3_details: '',
      clause7_1_notApplicable: false,
      clause7_1_deadlineValue: '',
      clause7_1_deadlineUnit: 'days',
      clause7_1_details: '',
      clause10_1_notApplicable: false,
      clause10_1_warranties: '',
      clause10_1_naReason: '',
      clause12_1_notApplicable: false,
      clause12_1_noticeRequirements: '',
      clause12_1_naReason: '',
      clause12_2_4_notApplicable: false,
      clause12_2_4_overheadProfitPct: '',
      clause12_2_4_naReason: '',
      clause13_1_paymentType: '',
      clause13_1_frequencyDetails: '',
      clause13_2_notApplicable: false,
      clause13_2_retentionRatePct: '',
      clause13_2_naReason: '',
      clause13_7_sopApplicable: '',
      clause13_7_details: '',
      clause14_notApplicable: false,
      clause14_controlOfSite: '',
      clause14_naReason: '',
      clause17_notApplicable: false,
      clause17_completionCertificate: '',
      clause17_naReason: '',
      clause18_maintenanceApplicable: '',
      clause18_details: '',
      clause18_1_durationValue: '',
      clause18_1_durationUnit: 'months',
      clause19_notApplicable: false,
      clause19_durationValue: '',
      clause19_durationUnit: 'months',
      clause19_details: '',
      clause20_1_notApplicable: false,
      clause20_1_quantumBasis: 'percentage',
      clause20_1_quantumValue: '',
      clause20_1_currency: 'SGD',
      clause20_1_naReason: '',
      clause20_3_notApplicable: false,
      clause20_3_duration: '',
      clause20_3_naReason: '',
      clause21_1_notApplicable: false,
      clause21_1_amount: '',
      clause21_1_currency: 'SGD',
      clause21_1_basis: '',
      clause21_1_cap: '',
      clause21_1_naReason: '',
      clause22_1_notApplicable: false,
      clause22_1_naReason: '',
      clause22_1_insurances: [],
      clause25_1_noticeValue: '',
      clause25_1_noticeUnit: 'days',
      clause25_1_details: '',
      clause26_1_noticeValue: '',
      clause26_1_noticeUnit: 'days',
      clause26_1_details: '',
      clause33_applicable: '',
      clause33_renewalDuration: '',
      clause33_noticeRequirements: '',
      clause33_naReason: '',
    },
    purchaseRequisition: {
      coveredByExistingContract: '',
      existingContractJustification: '',
      approvedBudgetAmount: '',
      budgetCurrency: 'SGD',
      latestBudgetChecked: false,
      additionalBudgetApprovalStatus: '',
      additionalBudgetExplanation: '',
      referenceQuotations: [],
      approvalStatus: '',
      supportingDocumentRefs: '',
      prMaterialGroupSameAsOverview: true,
      prMaterialGroup: '',
    },
    scheduleOfWorks: {
      projectTitleSameAsOverview: true,
      projectTitle: '',
      siteAddressSameAsOverview: true,
      siteAddress: '',
      plannedServiceVisits: '',
      serviceVisitsNotes: '',
      frequencyAndInterval: '',
      minManpowerAndRoles: '',
      workingDaysAndHours: '',
      additionalDeploymentReqs: '',
      scopeDescription: '',
      scopeItems: [],
      appendixAttachmentIds: [],
      scopeAppendixNotes: '',
      sorApplicable: '',
      sorNaReason: '',
      sorValidityPeriod: '',
      sorRows: [],
      contactSameAsOverview: true,
      contactPerson: '',
      contactNumber: '',
    },
    technicalSchedules: createInitialTechnicalSchedules(),
    adhocSpecifications: {
      notApplicable: false,
      naReason: '',
      items: [],
    },
    declarations: {
      requestorConfirmedScopeComplete: false,
      requestorConfirmedBudgetAndApprovals: false,
      requestorName: '',
      requestorDesignation: '',
      requestorConfirmationDate: '',
      machineryToolsText: DEFAULT_MACHINERY_DECLARATION,
      pwmText: DEFAULT_PWM_DECLARATION,
      bizSafeDeclarationText: DEFAULT_BIZSAFE_DECLARATION,
      includeLegacyCovidDeclaration: false,
      legacyCovidDeclarationText: LEGACY_COVID_DECLARATION_TEXT,
    },
  };
}

export function createEmptyInsurance(): InsuranceEntry {
  return {
    id: createId(),
    type: '',
    coverageAmount: '',
    currency: 'SGD',
    remarks: '',
  };
}

export function createEmptyQuotation(): ReferenceQuotationEntry {
  return {
    id: createId(),
    vendorName: '',
    quotationRef: '',
    quotationDate: '',
    amount: '',
    currency: 'SGD',
    remarks: '',
  };
}

export function createEmptyScopeItem(nextIndex: number): ScopeItemEntry {
  return {
    id: createId(),
    itemNo: String(nextIndex),
    description: '',
    frequencyOrSpec: '',
    remarks: '',
  };
}

export function createEmptySorRow(): ScheduleOfRatesRow {
  return {
    id: createId(),
    description: '',
    unit: '',
    quantity: '',
    rate: '',
    currency: 'SGD',
    remarks: '',
  };
}

export function createEmptySpecificationItem(): SpecificationItemEntry {
  return {
    id: createId(),
    itemTitle: '',
    technicalRequirements: '',
    preferredBrandModel: '',
    quantityOrUnit: '',
    remarks: '',
  };
}

export interface ContractDurationResult {
  valid: boolean;
  inclusiveDays: number | null;
  approxMonths: number | null;
  approxYears: number | null;
  formatted: string;
  conventionNote: string;
}

export function calculateContractDuration(
  startDateStr: string,
  endDateStr: string
): ContractDurationResult {
  const conventionNote =
    'Convention: Inclusive of both commencement and completion calendar dates (end - start + 1 day); approximate months calculated as days / 30.4375. Does not infer service visit counts.';

  if (!startDateStr || !endDateStr) {
    return {
      valid: false,
      inclusiveDays: null,
      approxMonths: null,
      approxYears: null,
      formatted: 'Enter Clause 5.2 commencement and completion dates to calculate duration.',
      conventionNote,
    };
  }

  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${endDateStr}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      valid: false,
      inclusiveDays: null,
      approxMonths: null,
      approxYears: null,
      formatted: 'Invalid date format.',
      conventionNote,
    };
  }

  const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      valid: false,
      inclusiveDays: null,
      approxMonths: null,
      approxYears: null,
      formatted: 'Completion date is earlier than commencement date.',
      conventionNote,
    };
  }

  const inclusiveDays = diffDays + 1;
  const approxMonths = Math.round((inclusiveDays / 30.4375) * 10) / 10;
  const approxYears = Math.round((inclusiveDays / 365.25) * 100) / 100;

  return {
    valid: true,
    inclusiveDays,
    approxMonths,
    approxYears,
    formatted: `${inclusiveDays.toLocaleString()} calendar days (approx. ${approxMonths} months / ${approxYears} years)`,
    conventionNote,
  };
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
