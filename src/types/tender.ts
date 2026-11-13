export type ContractType = 'Term Contract' | 'Ad-hoc Works';

export type BusinessUnit = '' | 'HBG' | 'RBG' | 'SLG' | 'CED' | 'Other';

export type AttachmentCategory =
  | 'Technical Scope'
  | 'SOR'
  | 'Specifications'
  | 'House Rules'
  | 'Drawings'
  | 'Reference Quotation'
  | 'Approval'
  | 'Other';

export const ATTACHMENT_CATEGORIES: AttachmentCategory[] = [
  'Technical Scope',
  'SOR',
  'Specifications',
  'House Rules',
  'Drawings',
  'Reference Quotation',
  'Approval',
  'Other',
];

export const INTERNAL_EXCLUDED_BY_DEFAULT_CATEGORIES: AttachmentCategory[] = [
  'Reference Quotation',
  'Approval',
];

export interface InsuranceEntry {
  id: string;
  type: string;
  coverageAmount: string;
  currency: string;
  remarks: string;
}

export interface ReferenceQuotationEntry {
  id: string;
  vendorName: string;
  quotationRef: string;
  quotationDate: string;
  amount: string;
  currency: string;
  remarks: string;
}

export interface ScopeItemEntry {
  id: string;
  itemNo: string;
  description: string;
  frequencyOrSpec: string;
  remarks: string;
}

export interface ScheduleOfRatesRow {
  id: string;
  description: string;
  unit: string;
  quantity: string;
  rate: string;
  currency: string;
  remarks: string;
}

export interface TechnicalScheduleItem {
  key:
    | 'scheduleOfWorks'
    | 'scheduleOfRates'
    | 'scheduleOfOptionalWorks'
    | 'houseRules'
    | 'newSystemSpecs'
    | 'preferredBrands'
    | 'drawingsAndPhotos'
    | 'termContractTenure'
    | 'existingInstaller'
    | 'existingEquipmentOverview'
    | 'replacementPhasedPlan';
  label: string;
  termOnly?: boolean;
  applicable: '' | 'Applicable' | 'Not applicable';
  details: string;
  validityGuidance?: string;
  attachmentIds: string[];
}

export interface SpecificationItemEntry {
  id: string;
  itemTitle: string;
  technicalRequirements: string;
  preferredBrandModel: string;
  quantityOrUnit: string;
  remarks: string;
}

export interface TenderOverview {
  propertyName: string;
  tenderSubject: string;
  contractType: ContractType;
  employerName: string;
  businessUnit: BusinessUnit;
  businessUnitOther: string;
  materialGroup: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  serviceSiteAddress: string;
  showroundSameAsContact: boolean;
  showroundContactPerson: string;
  showroundContactPhone: string;
  showroundSameAsSiteAddress: boolean;
  showroundMeetingPoint: string;
}

export interface ContractTerms {
  // Clause 5.1
  clause5_1_scopeSummary: string;
  clause5_1_serviceFrequency: string;
  // Clause 5.2
  clause5_2_commencementDate: string;
  clause5_2_completionDate: string;
  // Clause 6.3
  clause6_3_bizSafeRequired: '' | 'Yes' | 'No' | 'Not applicable';
  clause6_3_details: string;
  // Clause 7.1
  clause7_1_notApplicable: boolean;
  clause7_1_deadlineValue: string;
  clause7_1_deadlineUnit: '' | 'days' | 'weeks';
  clause7_1_details: string;
  // Clause 10.1
  clause10_1_notApplicable: boolean;
  clause10_1_warranties: string;
  clause10_1_naReason: string;
  // Clause 12.1
  clause12_1_notApplicable: boolean;
  clause12_1_noticeRequirements: string;
  clause12_1_naReason: string;
  // Clause 12.2.4
  clause12_2_4_notApplicable: boolean;
  clause12_2_4_overheadProfitPct: string;
  clause12_2_4_naReason: string;
  // Clause 13.1
  clause13_1_paymentType:
    | ''
    | 'Monthly'
    | 'Milestone / Progress'
    | 'Lump Sum on Completion'
    | 'Quarterly'
    | 'Other';
  clause13_1_frequencyDetails: string;
  // Clause 13.2
  clause13_2_notApplicable: boolean;
  clause13_2_retentionRatePct: string;
  clause13_2_naReason: string;
  // Clause 13.7
  clause13_7_sopApplicable: '' | 'Applicable' | 'Not applicable';
  clause13_7_details: string;
  // Clause 14
  clause14_notApplicable: boolean;
  clause14_controlOfSite: string;
  clause14_naReason: string;
  // Clause 17
  clause17_notApplicable: boolean;
  clause17_completionCertificate: string;
  clause17_naReason: string;
  // Clause 18 & 18.1
  clause18_maintenanceApplicable: '' | 'Applicable' | 'Not applicable';
  clause18_details: string;
  clause18_1_durationValue: string;
  clause18_1_durationUnit: '' | 'days' | 'months' | 'years';
  // Clause 19
  clause19_notApplicable: boolean;
  clause19_durationValue: string;
  clause19_durationUnit: '' | 'months' | 'years';
  clause19_details: string;
  // Clause 20.1 & 20.3
  clause20_1_notApplicable: boolean;
  clause20_1_quantumBasis: '' | 'percentage' | 'fixed';
  clause20_1_quantumValue: string;
  clause20_1_currency: string;
  clause20_1_naReason: string;
  clause20_3_notApplicable: boolean;
  clause20_3_duration: string;
  clause20_3_naReason: string;
  // Clause 21.1
  clause21_1_notApplicable: boolean;
  clause21_1_amount: string;
  clause21_1_currency: string;
  clause21_1_basis:
    | ''
    | 'Per calendar day'
    | 'Per week'
    | 'Per incident / SLA breach'
    | 'Other';
  clause21_1_cap: string;
  clause21_1_naReason: string;
  // Clause 22.1
  clause22_1_notApplicable: boolean;
  clause22_1_naReason: string;
  clause22_1_insurances: InsuranceEntry[];
  // Clause 25.1
  clause25_1_noticeValue: string;
  clause25_1_noticeUnit: '' | 'days' | 'weeks' | 'months';
  clause25_1_details: string;
  // Clause 26.1
  clause26_1_noticeValue: string;
  clause26_1_noticeUnit: '' | 'days' | 'weeks' | 'months';
  clause26_1_details: string;
  // Clause 33
  clause33_applicable: '' | 'Applicable' | 'Not applicable';
  clause33_renewalDuration: string;
  clause33_noticeRequirements: string;
  clause33_naReason: string;
}

export interface PurchaseRequisitionInfo {
  coveredByExistingContract: '' | 'Yes' | 'No';
  existingContractJustification: string;
  approvedBudgetAmount: string;
  budgetCurrency: string;
  latestBudgetChecked: boolean;
  additionalBudgetApprovalStatus: '' | 'Not required' | 'Pending' | 'Approved' | 'Other';
  additionalBudgetExplanation: string;
  referenceQuotations: ReferenceQuotationEntry[];
  approvalStatus:
    | ''
    | 'Pending'
    | 'Submitted for endorsement'
    | 'Endorsed / Approved'
    | 'Not applicable';
  supportingDocumentRefs: string;
  prMaterialGroupSameAsOverview: boolean;
  prMaterialGroup: string;
}

export interface ScheduleOfWorks {
  projectTitleSameAsOverview: boolean;
  projectTitle: string;
  siteAddressSameAsOverview: boolean;
  siteAddress: string;
  plannedServiceVisits: string;
  serviceVisitsNotes: string;
  frequencyAndInterval: string;
  minManpowerAndRoles: string;
  workingDaysAndHours: string;
  additionalDeploymentReqs: string;
  scopeDescription: string;
  scopeItems: ScopeItemEntry[];
  appendixAttachmentIds: string[];
  scopeAppendixNotes: string;
  sorApplicable: '' | 'Applicable' | 'Not applicable';
  sorNaReason: string;
  sorValidityPeriod: string;
  sorRows: ScheduleOfRatesRow[];
  contactSameAsOverview: boolean;
  contactPerson: string;
  contactNumber: string;
}

export interface AdhocSpecifications {
  notApplicable: boolean;
  naReason: string;
  items: SpecificationItemEntry[];
}

export interface DeclarationAndConfirmation {
  requestorConfirmedScopeComplete: boolean;
  requestorConfirmedBudgetAndApprovals: boolean;
  requestorName: string;
  requestorDesignation: string;
  requestorConfirmationDate: string;
  machineryToolsText: string;
  pwmText: string;
  bizSafeDeclarationText: string;
  includeLegacyCovidDeclaration: boolean;
  legacyCovidDeclarationText: string;
}

export interface TenderFormData {
  overview: TenderOverview;
  contractTerms: ContractTerms;
  purchaseRequisition: PurchaseRequisitionInfo;
  scheduleOfWorks: ScheduleOfWorks;
  technicalSchedules: TechnicalScheduleItem[];
  adhocSpecifications: AdhocSpecifications;
  declarations: DeclarationAndConfirmation;
}

export interface LocalPdfAttachment {
  id: string;
  filename: string;
  sizeBytes: number;
  category: AttachmentCategory;
  pageCount: number | null;
  includeInCombinedPdf: boolean;
  notes: string;
  status: 'loaded' | 'missing' | 'error';
  errorMessage?: string;
  bytes: Uint8Array | null;
}

export interface AttachmentDraftMetadata {
  id: string;
  filename: string;
  sizeBytes: number;
  category: AttachmentCategory;
  pageCount: number | null;
  includeInCombinedPdf: boolean;
  notes: string;
}

export interface TenderDraftFile {
  schemaVersion: 1;
  app: 'tender-request-builder';
  savedAt: string;
  formData: TenderFormData;
  attachments: AttachmentDraftMetadata[];
}

export type SectionId =
  | 'overview'
  | 'contract-terms'
  | 'purchase-requisition'
  | 'schedule-of-works'
  | 'technical-schedules'
  | 'declarations'
  | 'attachments'
  | 'review';

export interface ValidationIssue {
  id: string;
  section: SectionId;
  field: string;
  message: string;
}
