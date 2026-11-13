import {
  LocalPdfAttachment,
  SectionId,
  TenderFormData,
  ValidationIssue,
} from '../types/tender';

export interface SectionProgress {
  section: SectionId;
  label: string;
  completed: number;
  total: number;
  errorCount: number;
}

export interface ValidationSummary {
  issues: ValidationIssue[];
  issuesByField: Record<string, string>;
  sectionProgress: Record<SectionId, SectionProgress>;
  isFormComplete: boolean;
  hasNumericOrDateErrors: boolean;
}

function isNonNegativeNumber(val: string): boolean {
  if (!val.trim()) return true;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0;
}

function isValidPercentage(val: string): boolean {
  if (!val.trim()) return true;
  const n = Number(val);
  return Number.isFinite(n) && n >= 0 && n <= 100;
}

function isValidEmail(val: string): boolean {
  if (!val.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

export function validateTenderForm(
  data: TenderFormData,
  attachments: LocalPdfAttachment[]
): ValidationSummary {
  const issues: ValidationIssue[] = [];

  const addIssue = (section: SectionId, field: string, message: string) => {
    issues.push({
      id: `${section}:${field}`,
      section,
      field,
      message,
    });
  };

  // --- 1. Tender Overview ---
  const ov = data.overview;
  if (!ov.propertyName.trim()) {
    addIssue('overview', 'propertyName', 'Name of property is required.');
  }
  if (!ov.tenderSubject.trim()) {
    addIssue('overview', 'tenderSubject', 'Tender subject / title is required.');
  }
  if (!ov.employerName.trim()) {
    addIssue('overview', 'employerName', 'Name of employer is required.');
  }
  if (!ov.businessUnit) {
    addIssue('overview', 'businessUnit', 'Select a business unit.');
  } else if (ov.businessUnit === 'Other' && !ov.businessUnitOther.trim()) {
    addIssue('overview', 'businessUnitOther', 'Specify the business unit name.');
  }
  if (!ov.materialGroup.trim()) {
    addIssue('overview', 'materialGroup', 'Material group is required.');
  }
  if (!ov.contactPerson.trim()) {
    addIssue('overview', 'contactPerson', 'Contact person is required.');
  }
  if (!ov.contactPhone.trim()) {
    addIssue('overview', 'contactPhone', 'Telephone number is required.');
  }
  if (!ov.contactEmail.trim()) {
    addIssue('overview', 'contactEmail', 'Email address is required.');
  } else if (!isValidEmail(ov.contactEmail)) {
    addIssue('overview', 'contactEmail', 'Enter a valid email address.');
  }
  if (!ov.serviceSiteAddress.trim()) {
    addIssue('overview', 'serviceSiteAddress', 'Service / site address is required.');
  }
  if (!ov.showroundSameAsContact && !ov.showroundContactPerson.trim()) {
    addIssue(
      'overview',
      'showroundContactPerson',
      'Enter site showround contact person or select "Same as above".'
    );
  }
  if (!ov.showroundSameAsSiteAddress && !ov.showroundMeetingPoint.trim()) {
    addIssue(
      'overview',
      'showroundMeetingPoint',
      'Enter site showround meeting point or select "Same as above".'
    );
  }

  // --- 2. General Information / Contract Terms ---
  const ct = data.contractTerms;
  if (!ct.clause5_1_scopeSummary.trim()) {
    addIssue('contract-terms', 'clause5_1_scopeSummary', 'Clause 5.1 scope summary is required.');
  }
  if (ov.contractType === 'Term Contract' && !ct.clause5_1_serviceFrequency.trim()) {
    addIssue(
      'contract-terms',
      'clause5_1_serviceFrequency',
      'Clause 5.1 service frequency is required for a Term Contract.'
    );
  }
  if (!ct.clause5_2_commencementDate) {
    addIssue(
      'contract-terms',
      'clause5_2_commencementDate',
      'Clause 5.2 commencement date is required.'
    );
  }
  if (!ct.clause5_2_completionDate) {
    addIssue(
      'contract-terms',
      'clause5_2_completionDate',
      'Clause 5.2 completion date is required.'
    );
  }
  if (
    ct.clause5_2_commencementDate &&
    ct.clause5_2_completionDate &&
    ct.clause5_2_completionDate < ct.clause5_2_commencementDate
  ) {
    addIssue(
      'contract-terms',
      'clause5_2_completionDate',
      'Completion date must be on or after the commencement date.'
    );
  }
  if (!ct.clause6_3_bizSafeRequired) {
    addIssue('contract-terms', 'clause6_3_bizSafeRequired', 'Specify Clause 6.3 bizSAFE requirement.');
  }
  if (!ct.clause7_1_notApplicable) {
    if (!ct.clause7_1_deadlineValue.trim()) {
      addIssue(
        'contract-terms',
        'clause7_1_deadlineValue',
        'Specify Clause 7.1 programme submission deadline or mark N/A.'
      );
    } else if (!isNonNegativeNumber(ct.clause7_1_deadlineValue)) {
      addIssue(
        'contract-terms',
        'clause7_1_deadlineValue',
        'Programme deadline must be a non-negative number.'
      );
    }
  }
  if (ct.clause10_1_notApplicable && !ct.clause10_1_naReason.trim()) {
    addIssue('contract-terms', 'clause10_1_naReason', 'Explain why Clause 10.1 is not applicable.');
  }
  if (ct.clause12_1_notApplicable && !ct.clause12_1_naReason.trim()) {
    addIssue('contract-terms', 'clause12_1_naReason', 'Explain why Clause 12.1 is not applicable.');
  }
  if (ct.clause12_2_4_notApplicable) {
    if (!ct.clause12_2_4_naReason.trim()) {
      addIssue(
        'contract-terms',
        'clause12_2_4_naReason',
        'Explain why Clause 12.2.4 is not applicable.'
      );
    }
  } else {
    if (!ct.clause12_2_4_overheadProfitPct.trim()) {
      addIssue(
        'contract-terms',
        'clause12_2_4_overheadProfitPct',
        'Enter Clause 12.2.4 percentage or mark N/A.'
      );
    } else if (!isValidPercentage(ct.clause12_2_4_overheadProfitPct)) {
      addIssue(
        'contract-terms',
        'clause12_2_4_overheadProfitPct',
        'Overheads and profits percentage must be between 0 and 100.'
      );
    }
  }
  if (!ct.clause13_1_paymentType) {
    addIssue('contract-terms', 'clause13_1_paymentType', 'Select Clause 13.1 payment type.');
  }
  if (ct.clause13_2_notApplicable) {
    if (!ct.clause13_2_naReason.trim()) {
      addIssue(
        'contract-terms',
        'clause13_2_naReason',
        'Explain why Clause 13.2 retention rate is not applicable.'
      );
    }
  } else if (
    ct.clause13_2_retentionRatePct.trim() &&
    !isValidPercentage(ct.clause13_2_retentionRatePct)
  ) {
    addIssue(
      'contract-terms',
      'clause13_2_retentionRatePct',
      'Retention rate must be between 0% and 100%.'
    );
  }
  if (!ct.clause13_7_sopApplicable) {
    addIssue('contract-terms', 'clause13_7_sopApplicable', 'Select Clause 13.7 SOP Act applicability.');
  }
  if (ct.clause14_notApplicable && !ct.clause14_naReason.trim()) {
    addIssue('contract-terms', 'clause14_naReason', 'Explain why Clause 14 is not applicable.');
  }
  if (ct.clause17_notApplicable && !ct.clause17_naReason.trim()) {
    addIssue('contract-terms', 'clause17_naReason', 'Explain why Clause 17 is not applicable.');
  }
  if (!ct.clause18_maintenanceApplicable) {
    addIssue(
      'contract-terms',
      'clause18_maintenanceApplicable',
      'Select Clause 18 maintenance period applicability.'
    );
  } else if (
    ct.clause18_maintenanceApplicable === 'Applicable' &&
    ct.clause18_1_durationValue.trim() &&
    !isNonNegativeNumber(ct.clause18_1_durationValue)
  ) {
    addIssue(
      'contract-terms',
      'clause18_1_durationValue',
      'Maintenance period duration must be non-negative.'
    );
  }
  if (
    !ct.clause19_notApplicable &&
    ct.clause19_durationValue.trim() &&
    !isNonNegativeNumber(ct.clause19_durationValue)
  ) {
    addIssue('contract-terms', 'clause19_durationValue', 'Warranty period must be non-negative.');
  }
  if (ct.clause20_1_notApplicable) {
    if (!ct.clause20_1_naReason.trim()) {
      addIssue(
        'contract-terms',
        'clause20_1_naReason',
        'Explain why Clause 20.1 performance bond is not applicable.'
      );
    }
  } else if (ct.clause20_1_quantumValue.trim()) {
    if (
      ct.clause20_1_quantumBasis === 'percentage' &&
      !isValidPercentage(ct.clause20_1_quantumValue)
    ) {
      addIssue(
        'contract-terms',
        'clause20_1_quantumValue',
        'Performance bond percentage must be between 0% and 100%.'
      );
    } else if (!isNonNegativeNumber(ct.clause20_1_quantumValue)) {
      addIssue(
        'contract-terms',
        'clause20_1_quantumValue',
        'Performance bond quantum must be non-negative.'
      );
    }
  }
  if (ct.clause20_3_notApplicable && !ct.clause20_3_naReason.trim()) {
    addIssue('contract-terms', 'clause20_3_naReason', 'Explain why Clause 20.3 is not applicable.');
  }
  if (ct.clause21_1_notApplicable) {
    if (!ct.clause21_1_naReason.trim()) {
      addIssue(
        'contract-terms',
        'clause21_1_naReason',
        'Explain why Clause 21.1 liquidated damages are not applicable.'
      );
    }
  } else {
    if (ct.clause21_1_amount.trim() && !isNonNegativeNumber(ct.clause21_1_amount)) {
      addIssue(
        'contract-terms',
        'clause21_1_amount',
        'Liquidated damages amount must be non-negative.'
      );
    }
  }
  if (ct.clause22_1_notApplicable) {
    if (!ct.clause22_1_naReason.trim()) {
      addIssue(
        'contract-terms',
        'clause22_1_naReason',
        'Explain why Clause 22.1 insurance requirements are not applicable.'
      );
    }
  } else {
    ct.clause22_1_insurances.forEach((ins, idx) => {
      if (ins.coverageAmount.trim() && !isNonNegativeNumber(ins.coverageAmount)) {
        addIssue(
          'contract-terms',
          `clause22_1_insurances.${idx}.coverageAmount`,
          `Insurance #${idx + 1} coverage amount must be non-negative.`
        );
      }
    });
  }
  if (ct.clause25_1_noticeValue.trim() && !isNonNegativeNumber(ct.clause25_1_noticeValue)) {
    addIssue(
      'contract-terms',
      'clause25_1_noticeValue',
      'Employer termination notice duration must be non-negative.'
    );
  }
  if (ct.clause26_1_noticeValue.trim() && !isNonNegativeNumber(ct.clause26_1_noticeValue)) {
    addIssue(
      'contract-terms',
      'clause26_1_noticeValue',
      'Vendor termination notice duration must be non-negative.'
    );
  }
  if (!ct.clause33_applicable) {
    addIssue('contract-terms', 'clause33_applicable', 'Specify Clause 33 option to renew.');
  } else if (ct.clause33_applicable === 'Not applicable' && !ct.clause33_naReason.trim()) {
    addIssue(
      'contract-terms',
      'clause33_naReason',
      'Explain why Clause 33 option to renew is not applicable.'
    );
  }

  // --- 3. Purchase Requisition Supporting Information ---
  const pr = data.purchaseRequisition;
  if (!pr.coveredByExistingContract) {
    addIssue(
      'purchase-requisition',
      'coveredByExistingContract',
      'Indicate whether works are covered by an existing warranty, term or maintenance contract.'
    );
  } else if (
    pr.coveredByExistingContract === 'Yes' &&
    !pr.existingContractJustification.trim()
  ) {
    addIssue(
      'purchase-requisition',
      'existingContractJustification',
      'Explanation of why a new PR is necessary is required when covered by an existing contract.'
    );
  }
  if (!pr.approvedBudgetAmount.trim()) {
    addIssue(
      'purchase-requisition',
      'approvedBudgetAmount',
      'Approved budget amount is required.'
    );
  } else if (!isNonNegativeNumber(pr.approvedBudgetAmount)) {
    addIssue(
      'purchase-requisition',
      'approvedBudgetAmount',
      'Approved budget amount must be non-negative.'
    );
  }
  if (!pr.latestBudgetChecked) {
    addIssue(
      'purchase-requisition',
      'latestBudgetChecked',
      'Confirm that the latest budget has been checked.'
    );
  }
  if (!pr.approvalStatus) {
    addIssue(
      'purchase-requisition',
      'approvalStatus',
      'Select the approval / endorsement status.'
    );
  }
  pr.referenceQuotations.forEach((q, idx) => {
    if (q.amount.trim() && !isNonNegativeNumber(q.amount)) {
      addIssue(
        'purchase-requisition',
        `referenceQuotations.${idx}.amount`,
        `Reference quotation #${idx + 1} amount must be non-negative.`
      );
    }
  });

  // --- 4. Schedule of Works ---
  const sow = data.scheduleOfWorks;
  if (!sow.projectTitleSameAsOverview && !sow.projectTitle.trim()) {
    addIssue('schedule-of-works', 'projectTitle', 'Enter Section A project title or sync from Overview.');
  }
  if (!sow.siteAddressSameAsOverview && !sow.siteAddress.trim()) {
    addIssue('schedule-of-works', 'siteAddress', 'Enter Section A site address or sync from Overview.');
  }
  if (sow.plannedServiceVisits.trim() && !isNonNegativeNumber(sow.plannedServiceVisits)) {
    addIssue(
      'schedule-of-works',
      'plannedServiceVisits',
      'Planned service visits must be a non-negative number.'
    );
  }
  if (!sow.scopeDescription.trim() && sow.scopeItems.length === 0) {
    addIssue(
      'schedule-of-works',
      'scopeDescription',
      'Provide a scope of work description or add at least one scope item.'
    );
  }
  if (!sow.sorApplicable) {
    addIssue(
      'schedule-of-works',
      'sorApplicable',
      'Specify whether Section E Schedule of Rates is applicable.'
    );
  } else if (sow.sorApplicable === 'Not applicable' && !sow.sorNaReason.trim()) {
    addIssue(
      'schedule-of-works',
      'sorNaReason',
      'Explain why Schedule of Rates is not applicable.'
    );
  }
  sow.sorRows.forEach((row, idx) => {
    if (row.quantity.trim() && !isNonNegativeNumber(row.quantity)) {
      addIssue(
        'schedule-of-works',
        `sorRows.${idx}.quantity`,
        `SOR row #${idx + 1} quantity must be non-negative.`
      );
    }
    if (row.rate.trim() && !isNonNegativeNumber(row.rate)) {
      addIssue(
        'schedule-of-works',
        `sorRows.${idx}.rate`,
        `SOR row #${idx + 1} rate must be non-negative.`
      );
    }
  });

  // --- 5. Technical and Supporting Schedules & Ad-hoc Specifications ---
  if (ov.contractType === 'Ad-hoc Works') {
    if (data.adhocSpecifications.notApplicable) {
      if (!data.adhocSpecifications.naReason.trim()) {
        addIssue(
          'technical-schedules',
          'adhocSpecifications.naReason',
          'Provide a brief explanation when Specifications are marked N.A.'
        );
      }
    } else if (data.adhocSpecifications.items.length === 0) {
      addIssue(
        'technical-schedules',
        'adhocSpecifications.items',
        'Add at least one Specification item for Ad-hoc Works, or mark Specifications as N.A.'
      );
    }
  }

  // --- 6. Declarations & Confirmations ---
  const dec = data.declarations;
  if (!dec.requestorName.trim()) {
    addIssue('declarations', 'requestorName', 'Requestor name is required.');
  }
  if (!dec.requestorConfirmedScopeComplete) {
    addIssue(
      'declarations',
      'requestorConfirmedScopeComplete',
      'Confirm scope and schedule completeness before finalising.'
    );
  }
  if (!dec.requestorConfirmedBudgetAndApprovals) {
    addIssue(
      'declarations',
      'requestorConfirmedBudgetAndApprovals',
      'Confirm budget and endorsement checks before finalising.'
    );
  }

  // --- 7. Attachments ---
  const missingIncluded = attachments.filter(
    (a) => a.includeInCombinedPdf && a.status !== 'loaded'
  );
  if (missingIncluded.length > 0) {
    addIssue(
      'attachments',
      'missingAttachments',
      `${missingIncluded.length} selected appendix PDF(s) must be re-attached before combined PDF export.`
    );
  }

  const issuesByField: Record<string, string> = {};
  for (const issue of issues) {
    if (!issuesByField[issue.field]) {
      issuesByField[issue.field] = issue.message;
    }
  }

  // Compute progress metrics
  const ovChecks = [
    Boolean(ov.propertyName.trim()),
    Boolean(ov.tenderSubject.trim()),
    Boolean(ov.employerName.trim()),
    Boolean(ov.businessUnit),
    Boolean(ov.materialGroup.trim()),
    Boolean(ov.contactPerson.trim()),
    Boolean(ov.contactPhone.trim()),
    Boolean(ov.contactEmail.trim() && isValidEmail(ov.contactEmail)),
    Boolean(ov.serviceSiteAddress.trim()),
  ];

  const ctChecks = [
    Boolean(ct.clause5_1_scopeSummary.trim()),
    Boolean(ct.clause5_2_commencementDate),
    Boolean(ct.clause5_2_completionDate),
    Boolean(ct.clause6_3_bizSafeRequired),
    ct.clause7_1_notApplicable || Boolean(ct.clause7_1_deadlineValue.trim()),
    ct.clause12_2_4_notApplicable || Boolean(ct.clause12_2_4_overheadProfitPct.trim()),
    Boolean(ct.clause13_1_paymentType),
    Boolean(ct.clause13_7_sopApplicable),
    Boolean(ct.clause18_maintenanceApplicable),
    Boolean(ct.clause33_applicable),
  ];

  const prChecks = [
    Boolean(pr.coveredByExistingContract),
    Boolean(pr.approvedBudgetAmount.trim()),
    pr.latestBudgetChecked,
    Boolean(pr.approvalStatus),
  ];

  const sowChecks = [
    Boolean(sow.projectTitleSameAsOverview ? ov.tenderSubject.trim() : sow.projectTitle.trim()),
    Boolean(sow.siteAddressSameAsOverview ? ov.serviceSiteAddress.trim() : sow.siteAddress.trim()),
    Boolean(sow.scopeDescription.trim() || sow.scopeItems.length > 0),
    Boolean(sow.sorApplicable),
  ];

  const visibleTechSchedules = data.technicalSchedules.filter(
    (s) => !(ov.contractType === 'Ad-hoc Works' && s.termOnly)
  );
  const techCompleted = visibleTechSchedules.filter((s) => Boolean(s.applicable)).length;
  const techTotal =
    visibleTechSchedules.length + (ov.contractType === 'Ad-hoc Works' ? 1 : 0);
  const adhocSpecDone =
    ov.contractType === 'Ad-hoc Works' &&
    (data.adhocSpecifications.notApplicable || data.adhocSpecifications.items.length > 0)
      ? 1
      : 0;

  const decChecks = [
    Boolean(dec.requestorName.trim()),
    dec.requestorConfirmedScopeComplete,
    dec.requestorConfirmedBudgetAndApprovals,
  ];

  const countErrors = (sec: SectionId) =>
    issues.filter((i) => i.section === sec).length;

  const sectionProgress: Record<SectionId, SectionProgress> = {
    overview: {
      section: 'overview',
      label: '1. Tender Overview',
      completed: ovChecks.filter(Boolean).length,
      total: ovChecks.length,
      errorCount: countErrors('overview'),
    },
    'contract-terms': {
      section: 'contract-terms',
      label: '2. Contract Terms',
      completed: ctChecks.filter(Boolean).length,
      total: ctChecks.length,
      errorCount: countErrors('contract-terms'),
    },
    'purchase-requisition': {
      section: 'purchase-requisition',
      label: '3. PR Supporting Info',
      completed: prChecks.filter(Boolean).length,
      total: prChecks.length,
      errorCount: countErrors('purchase-requisition'),
    },
    'schedule-of-works': {
      section: 'schedule-of-works',
      label: '4. Schedule of Works',
      completed: sowChecks.filter(Boolean).length,
      total: sowChecks.length,
      errorCount: countErrors('schedule-of-works'),
    },
    'technical-schedules': {
      section: 'technical-schedules',
      label: '5. Technical & Specs',
      completed: techCompleted + adhocSpecDone,
      total: techTotal,
      errorCount: countErrors('technical-schedules'),
    },
    declarations: {
      section: 'declarations',
      label: '6. Declarations',
      completed: decChecks.filter(Boolean).length,
      total: decChecks.length,
      errorCount: countErrors('declarations'),
    },
    attachments: {
      section: 'attachments',
      label: '7. Local PDF Attachments',
      completed: attachments.filter((a) => a.status === 'loaded').length,
      total: attachments.length,
      errorCount: countErrors('attachments'),
    },
    review: {
      section: 'review',
      label: '8. Review & Export',
      completed: issues.length === 0 ? 1 : 0,
      total: 1,
      errorCount: 0,
    },
  };

  const hasNumericOrDateErrors = issues.some(
    (i) =>
      i.message.includes('non-negative') ||
      i.message.includes('between 0') ||
      i.message.includes('Completion date must be') ||
      i.message.includes('valid email')
  );

  return {
    issues,
    issuesByField,
    sectionProgress,
    isFormComplete: issues.length === 0,
    hasNumericOrDateErrors,
  };
}
