import ExcelJS from 'exceljs';
import { LocalPdfAttachment, TenderFormData } from '../types/tender';
import {
  BU_ENDORSEMENT_GUIDANCE,
  GENERAL_TEMPLATE_NOTES,
  calculateContractDuration,
  formatBytes,
} from '../schema/tenderSchema';
import { sanitizeDownloadFilename, triggerLocalDownload } from './pdfAttachments';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF0F172A' },
};

const SUBHEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE2E8F0' },
};

const ZEBRA_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF8FAFC' },
};

const NOTICE_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFEF3C7' },
};

const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

function setLiteralText(cell: ExcelJS.Cell, value: string | null | undefined, fallback = ''): void {
  const str = value !== null && value !== undefined ? String(value) : '';
  const trimmed = str.trim();
  cell.value = trimmed ? str : fallback;
  cell.alignment = { vertical: 'top', wrapText: true };
}

function setIsoDate(cell: ExcelJS.Cell, isoDate: string): void {
  const trimmed = (isoDate || '').trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    setLiteralText(cell, '', '[Not provided]');
    return;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  cell.value = new Date(Date.UTC(year, month - 1, day));
  cell.numFmt = 'yyyy-mm-dd';
  cell.alignment = { vertical: 'top', horizontal: 'left' };
}

function setNumericValue(
  cell: ExcelJS.Cell,
  raw: string,
  numFmt = '#,##0.00',
  asPercentFraction = false
): void {
  const trimmed = (raw || '').trim();
  if (!trimmed) {
    setLiteralText(cell, '', '[Not provided]');
    return;
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    setLiteralText(cell, trimmed);
    return;
  }
  cell.value = asPercentFraction ? num / 100 : num;
  cell.numFmt = numFmt;
  cell.alignment = { vertical: 'top', horizontal: 'right' };
}

function estimateRowHeight(values: Array<string | number | Date | null | undefined>, colWidths: number[]): number {
  let maxLines = 1;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val === null || val === undefined) continue;
    const text = val instanceof Date ? '2026-01-01' : String(val);
    const width = Math.max(10, (colWidths[i] || 20) - 3);
    const paragraphs = text.split('\n');
    let lines = 0;
    for (const p of paragraphs) {
      lines += Math.max(1, Math.ceil(p.length / width));
    }
    if (lines > maxLines) maxLines = lines;
  }
  return Math.max(20, Math.min(260, maxLines * 14.5 + 8));
}

function configurePrintSetup(
  sheet: ExcelJS.Worksheet,
  orientation: 'landscape' | 'portrait' = 'landscape'
): void {
  sheet.pageSetup = {
    paperSize: 9, // A4
    orientation,
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: {
      left: 0.4,
      right: 0.4,
      top: 0.5,
      bottom: 0.5,
      header: 0.25,
      footer: 0.25,
    },
  };
}

function addTitleBanner(
  sheet: ExcelJS.Worksheet,
  colCount: number,
  title: string,
  subtitle: string
): void {
  const r1 = sheet.addRow([title]);
  sheet.mergeCells(r1.number, 1, r1.number, colCount);
  r1.height = 26;
  const c1 = r1.getCell(1);
  c1.fill = HEADER_FILL;
  c1.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
  c1.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  const r2 = sheet.addRow([subtitle]);
  sheet.mergeCells(r2.number, 1, r2.number, colCount);
  r2.height = 20;
  const c2 = r2.getCell(1);
  c2.fill = NOTICE_FILL;
  c2.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF92400E' } };
  c2.alignment = { vertical: 'middle', horizontal: 'left', indent: 1, wrapText: true };
}

function addSectionHeaderRow(
  sheet: ExcelJS.Worksheet,
  colCount: number,
  label: string
): void {
  sheet.addRow([]);
  const r = sheet.addRow([label]);
  sheet.mergeCells(r.number, 1, r.number, colCount);
  r.height = 22;
  const c = r.getCell(1);
  c.fill = HEADER_FILL;
  c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
  c.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
}

function styleTableHeaderRow(row: ExcelJS.Row, colCount: number): void {
  row.height = 22;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.fill = SUBHEADER_FILL;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    cell.border = THIN_BORDER;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
  }
}

function styleDataRow(
  row: ExcelJS.Row,
  colCount: number,
  colWidths: number[],
  zebra = false
): void {
  const vals: Array<string | number | Date | null> = [];
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.border = THIN_BORDER;
    cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF1E293B' } };
    if (zebra) {
      cell.fill = ZEBRA_FILL;
    }
    const v = cell.value;
    vals.push(typeof v === 'object' && v !== null && 'formula' in v ? 'Calculated' : (v as string | number | Date | null));
  }
  row.height = estimateRowHeight(vals, colWidths);
}

export async function generateTenderWorkbookBuffer(
  data: TenderFormData,
  attachments: LocalPdfAttachment[],
  options: { isDraft: boolean }
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Tender Request Builder';
  workbook.created = new Date();
  workbook.modified = new Date();

  const ov = data.overview;
  const ct = data.contractTerms;
  const pr = data.purchaseRequisition;
  const sow = data.scheduleOfWorks;
  const dec = data.declarations;

  const statusBanner = options.isDraft
    ? 'DRAFT TENDER REQUEST (Incomplete required fields) — For internal preparation only. NOT an approved contract.'
    : 'TENDER REQUEST (Request to Call for Tender) — For internal review & tender call. NOT an approved contract.';

  // =========================================================================
  // SHEET 1: Checklist for PR_Term
  // =========================================================================
  const s1Cols = [16, 36, 18, 46, 38];
  const s1 = workbook.addWorksheet('Checklist for PR_Term');
  s1.columns = s1Cols.map((w) => ({ width: w }));
  configurePrintSetup(s1, 'landscape');
  addTitleBanner(
    s1,
    5,
    `TENDER REQUEST CHECKLIST (${ov.contractType.toUpperCase()})`,
    statusBanner
  );

  // Tender Overview block
  addSectionHeaderRow(s1, 5, '1. Tender Overview');
  const ovHeader = s1.addRow(['Ref', 'Field', 'Status / Type', 'Entered Value', 'Notes']);
  styleTableHeaderRow(ovHeader, 5);

  const buLabel =
    ov.businessUnit === 'Other'
      ? `Other (${ov.businessUnitOther || 'unspecified'})`
      : ov.businessUnit || '[Not provided]';
  const showroundContact = ov.showroundSameAsContact
    ? `${ov.contactPerson || '[Not provided]'} (${ov.contactPhone || '-'})`
    : `${ov.showroundContactPerson || '[Not provided]'}${ov.showroundContactPhone ? ` (${ov.showroundContactPhone})` : ''}`;
  const showroundMeeting = ov.showroundSameAsSiteAddress
    ? ov.serviceSiteAddress
    : ov.showroundMeetingPoint;

  const ovRows: Array<[string, string, string, string, string]> = [
    ['OV-01', 'Name of Property', 'Required', ov.propertyName, ''],
    ['OV-02', 'Tender Subject / Title', 'Required', ov.tenderSubject, ''],
    ['OV-03', 'Contract Type', 'Selected', ov.contractType, ''],
    ['OV-04', 'Name of Employer', 'Required', ov.employerName, ''],
    ['OV-05', 'Business Unit', 'Required', buLabel, ''],
    ['OV-06', 'Material Group', 'Required', ov.materialGroup, ''],
    ['OV-07', 'Primary Contact Person', 'Required', ov.contactPerson, ''],
    ['OV-08', 'Telephone Number', 'Required', ov.contactPhone, ''],
    ['OV-09', 'Email Address', 'Required', ov.contactEmail, ''],
    ['OV-10', 'Service / Site Address', 'Required', ov.serviceSiteAddress, ''],
    [
      'OV-11',
      'Site Showround Contact Person',
      ov.showroundSameAsContact ? 'Same as contact' : 'Custom',
      showroundContact,
      '',
    ],
    [
      'OV-12',
      'Site Showround Meeting Point',
      ov.showroundSameAsSiteAddress ? 'Same as site' : 'Custom',
      showroundMeeting,
      '',
    ],
  ];

  ovRows.forEach((r, idx) => {
    const row = s1.addRow([r[0], r[1], r[2], '', r[4]]);
    setLiteralText(row.getCell(4), r[3], '[Not provided]');
    styleDataRow(row, 5, s1Cols, idx % 2 === 1);
  });

  // General Information / Contract Terms
  addSectionHeaderRow(
    s1,
    5,
    '2. General Information / Contract Terms (Template Guidance — Confirm Internally)'
  );
  const ctHeader = s1.addRow([
    'Clause Ref',
    'Description / Information',
    'Applicability',
    'Value / Details',
    'Guidance / N.A. Explanation',
  ]);
  styleTableHeaderRow(ctHeader, 5);

  const addClauseRow = (
    clause: string,
    desc: string,
    app: string,
    valSetter: (cell: ExcelJS.Cell) => void,
    notes: string,
    idx: number
  ) => {
    const row = s1.addRow([clause, desc, app, '', '']);
    valSetter(row.getCell(4));
    setLiteralText(row.getCell(5), notes, '');
    styleDataRow(row, 5, s1Cols, idx % 2 === 1);
  };

  let ctIdx = 0;
  addClauseRow(
    'Clause 5.1',
    'Scope of works and service frequency',
    ov.contractType === 'Term Contract' ? 'Applicable' : 'Ad-hoc scope',
    (c) =>
      setLiteralText(
        c,
        `${ct.clause5_1_scopeSummary || '[Not provided]'}\nService frequency: ${ct.clause5_1_serviceFrequency || '[Not provided]'}`
      ),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 5.2',
    'Contract commencement date',
    'Applicable',
    (c) => setIsoDate(c, ct.clause5_2_commencementDate),
    'ISO date (yyyy-mm-dd)',
    ctIdx++
  );
  addClauseRow(
    'Clause 5.2',
    'Contract completion date',
    'Applicable',
    (c) => setIsoDate(c, ct.clause5_2_completionDate),
    'ISO date (yyyy-mm-dd)',
    ctIdx++
  );
  addClauseRow(
    'Clause 6.3',
    'bizSAFE Level 3 certification or equivalent',
    ct.clause6_3_bizSafeRequired || '[Unselected]',
    (c) => setLiteralText(c, ct.clause6_3_details, ct.clause6_3_bizSafeRequired || '[Not provided]'),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 7.1',
    'Deadline for submitting detailed programme',
    ct.clause7_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause7_1_notApplicable
        ? setLiteralText(c, 'Not applicable')
        : setLiteralText(
            c,
            ct.clause7_1_deadlineValue
              ? `${ct.clause7_1_deadlineValue} ${ct.clause7_1_deadlineUnit}`
              : '',
            '[Not provided]'
          ),
    ct.clause7_1_details,
    ctIdx++
  );
  addClauseRow(
    'Clause 10.1',
    'List of warranties',
    ct.clause10_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause10_1_notApplicable ? 'Not applicable' : ct.clause10_1_warranties,
        '[Not provided]'
      ),
    ct.clause10_1_notApplicable ? ct.clause10_1_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 12.1',
    'Variation notice requirements',
    ct.clause12_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause12_1_notApplicable ? 'Not applicable' : ct.clause12_1_noticeRequirements,
        '[Not provided]'
      ),
    ct.clause12_1_notApplicable ? ct.clause12_1_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 12.2.4',
    'Percentage for overheads, profits and all necessary costs',
    ct.clause12_2_4_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause12_2_4_notApplicable
        ? setLiteralText(c, 'Not applicable')
        : setNumericValue(c, ct.clause12_2_4_overheadProfitPct, '0.00%', true),
    ct.clause12_2_4_notApplicable ? ct.clause12_2_4_naReason : 'Numeric percentage cell',
    ctIdx++
  );
  addClauseRow(
    'Clause 13.1',
    'Payment type and frequency',
    ct.clause13_1_paymentType ? 'Applicable' : '[Unselected]',
    (c) =>
      setLiteralText(
        c,
        [ct.clause13_1_paymentType, ct.clause13_1_frequencyDetails].filter(Boolean).join(' - '),
        '[Not provided]'
      ),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 13.2',
    'Retention rate',
    ct.clause13_2_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause13_2_notApplicable
        ? setLiteralText(c, 'Not applicable')
        : setNumericValue(c, ct.clause13_2_retentionRatePct, '0.00%', true),
    ct.clause13_2_notApplicable ? ct.clause13_2_naReason : 'Numeric percentage cell',
    ctIdx++
  );
  addClauseRow(
    'Clause 13.7',
    'SOP Act applicability / details',
    ct.clause13_7_sopApplicable || '[Unselected]',
    (c) => setLiteralText(c, ct.clause13_7_details, ct.clause13_7_sopApplicable || '[Not provided]'),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 14',
    "Vendor's control of site",
    ct.clause14_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause14_notApplicable ? 'Not applicable' : ct.clause14_controlOfSite,
        '[Not provided]'
      ),
    ct.clause14_notApplicable ? ct.clause14_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 17',
    'Completion certificate requirements',
    ct.clause17_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause17_notApplicable ? 'Not applicable' : ct.clause17_completionCertificate,
        '[Not provided]'
      ),
    ct.clause17_notApplicable ? ct.clause17_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 18',
    'Maintenance period applicability / details',
    ct.clause18_maintenanceApplicable || '[Unselected]',
    (c) => setLiteralText(c, ct.clause18_details, ct.clause18_maintenanceApplicable || '[Not provided]'),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 18.1',
    'Duration of maintenance period',
    ct.clause18_maintenanceApplicable === 'Not applicable' ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause18_maintenanceApplicable === 'Not applicable'
        ? setLiteralText(c, 'Not applicable (per Clause 18)')
        : setLiteralText(
            c,
            ct.clause18_1_durationValue
              ? `${ct.clause18_1_durationValue} ${ct.clause18_1_durationUnit}`
              : '',
            '[Not provided]'
          ),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 19',
    'Warranty period',
    ct.clause19_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause19_notApplicable
        ? setLiteralText(c, 'Not applicable')
        : setLiteralText(
            c,
            [
              ct.clause19_durationValue
                ? `${ct.clause19_durationValue} ${ct.clause19_durationUnit}`
                : '',
              ct.clause19_details,
            ]
              .filter(Boolean)
              .join(' - '),
            '[Not provided]'
          ),
    ct.clause19_notApplicable ? ct.clause19_details : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 20.1',
    'Quantum of performance bond',
    ct.clause20_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) => {
      if (ct.clause20_1_notApplicable) {
        setLiteralText(c, 'Not applicable');
      } else if (ct.clause20_1_quantumBasis === 'percentage') {
        setNumericValue(c, ct.clause20_1_quantumValue, '0.00%', true);
      } else {
        setNumericValue(c, ct.clause20_1_quantumValue, '#,##0.00', false);
      }
    },
    ct.clause20_1_notApplicable
      ? ct.clause20_1_naReason
      : ct.clause20_1_quantumBasis === 'fixed'
      ? `Currency: ${ct.clause20_1_currency || 'SGD'}`
      : 'Percentage of contract sum',
    ctIdx++
  );
  addClauseRow(
    'Clause 20.3',
    'Duration of performance bond',
    ct.clause20_3_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause20_3_notApplicable ? 'Not applicable' : ct.clause20_3_duration,
        '[Not provided]'
      ),
    ct.clause20_3_notApplicable ? ct.clause20_3_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 21.1',
    'Liquidated damages (amount, basis, cap)',
    ct.clause21_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      ct.clause21_1_notApplicable
        ? setLiteralText(c, 'Not applicable')
        : setNumericValue(c, ct.clause21_1_amount, '#,##0.00', false),
    ct.clause21_1_notApplicable
      ? ct.clause21_1_naReason
      : `Currency: ${ct.clause21_1_currency || 'SGD'} | Basis: ${ct.clause21_1_basis || '-'} | Cap: ${ct.clause21_1_cap || '-'}`,
    ctIdx++
  );
  addClauseRow(
    'Clause 22.1',
    'Insurance types and required coverage',
    ct.clause22_1_notApplicable ? 'Not applicable' : 'Applicable',
    (c) =>
      setLiteralText(
        c,
        ct.clause22_1_notApplicable
          ? 'Not applicable'
          : ct.clause22_1_insurances.length > 0
          ? ct.clause22_1_insurances
              .map(
                (ins) =>
                  `${ins.type || 'Unspecified'}: ${ins.currency || 'SGD'} ${ins.coverageAmount || '-'}${ins.remarks ? ` (${ins.remarks})` : ''}`
              )
              .join('\n')
          : '',
        '[No insurance entries]'
      ),
    ct.clause22_1_notApplicable ? ct.clause22_1_naReason : '',
    ctIdx++
  );
  addClauseRow(
    'Clause 25.1',
    'Employer termination notice',
    'Applicable',
    (c) =>
      setLiteralText(
        c,
        [
          ct.clause25_1_noticeValue
            ? `${ct.clause25_1_noticeValue} ${ct.clause25_1_noticeUnit}`
            : '',
          ct.clause25_1_details,
        ]
          .filter(Boolean)
          .join(' - '),
        '[Not provided]'
      ),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 26.1',
    'Vendor termination notice',
    'Applicable',
    (c) =>
      setLiteralText(
        c,
        [
          ct.clause26_1_noticeValue
            ? `${ct.clause26_1_noticeValue} ${ct.clause26_1_noticeUnit}`
            : '',
          ct.clause26_1_details,
        ]
          .filter(Boolean)
          .join(' - '),
        '[Not provided]'
      ),
    '',
    ctIdx++
  );
  addClauseRow(
    'Clause 33',
    'Option to renew (duration & notice requirements)',
    ct.clause33_applicable || '[Unselected]',
    (c) =>
      setLiteralText(
        c,
        ct.clause33_applicable === 'Not applicable'
          ? 'Not applicable'
          : `Duration: ${ct.clause33_renewalDuration || '[Not provided]'}\nNotice wording: ${ct.clause33_noticeRequirements || '[Not provided]'}`,
        '[Not provided]'
      ),
    ct.clause33_applicable === 'Not applicable'
      ? ct.clause33_naReason
      : 'Preserve template renewal-notice wording for internal legal/procurement review.',
    ctIdx++
  );

  // Template Procedural Notes
  addSectionHeaderRow(s1, 5, 'Template Procedural Notes (Internal Confirmation Required)');
  GENERAL_TEMPLATE_NOTES.forEach((note, idx) => {
    const r = s1.addRow([`Note ${idx + 1}`, note]);
    s1.mergeCells(r.number, 2, r.number, 5);
    setLiteralText(r.getCell(2), note);
    styleDataRow(r, 5, s1Cols, idx % 2 === 1);
  });

  // PR Supporting Information
  addSectionHeaderRow(s1, 5, '3. Purchase Requisition Supporting Information');
  const prHeader = s1.addRow(['Ref', 'PR Requirement', 'Status', 'Value / Details', 'Guidance']);
  styleTableHeaderRow(prHeader, 5);

  const prMaterialGroup = pr.prMaterialGroupSameAsOverview
    ? ov.materialGroup
    : pr.prMaterialGroup;
  const buGuidanceNote =
    ov.businessUnit && BU_ENDORSEMENT_GUIDANCE[ov.businessUnit]
      ? `Template-based internal requirement (${BU_ENDORSEMENT_GUIDANCE[ov.businessUnit].label}): ${BU_ENDORSEMENT_GUIDANCE[ov.businessUnit].requirement} Verify internally.`
      : 'Verify BU endorsement rules internally.';

  const prRows: Array<[string, string, string, (c: ExcelJS.Cell) => void, string]> = [
    [
      'PR-01',
      'Covered by existing warranty / term / maintenance contract?',
      pr.coveredByExistingContract || '[Unselected]',
      (c) =>
        setLiteralText(
          c,
          pr.coveredByExistingContract === 'Yes'
            ? `Yes - Justification: ${pr.existingContractJustification || '[Not provided]'}`
            : pr.coveredByExistingContract || '[Not provided]'
        ),
      '',
    ],
    [
      'PR-02',
      'Approved Budget Amount',
      pr.budgetCurrency || 'SGD',
      (c) => setNumericValue(c, pr.approvedBudgetAmount, '#,##0.00', false),
      `Currency: ${pr.budgetCurrency || 'SGD'}`,
    ],
    [
      'PR-03',
      'Latest Budget Checked',
      pr.latestBudgetChecked ? 'Confirmed' : 'Pending',
      (c) => setLiteralText(c, pr.latestBudgetChecked ? 'Confirmed checked' : 'Not confirmed'),
      '',
    ],
    [
      'PR-04',
      'Additional Budget Approval Status',
      pr.additionalBudgetApprovalStatus || '[Unselected]',
      (c) => setLiteralText(c, pr.additionalBudgetExplanation, pr.additionalBudgetApprovalStatus || '[Not provided]'),
      '',
    ],
    [
      'PR-05',
      'Approval / Endorsement Status',
      pr.approvalStatus || '[Unselected]',
      (c) => setLiteralText(c, pr.supportingDocumentRefs, pr.approvalStatus || '[Not provided]'),
      buGuidanceNote,
    ],
    [
      'PR-06',
      'Material Group',
      pr.prMaterialGroupSameAsOverview ? 'Synced from Overview' : 'Override',
      (c) => setLiteralText(c, prMaterialGroup, '[Not provided]'),
      '',
    ],
  ];

  prRows.forEach((item, idx) => {
    const r = s1.addRow([item[0], item[1], item[2], '', '']);
    item[3](r.getCell(4));
    setLiteralText(r.getCell(5), item[4], '');
    styleDataRow(r, 5, s1Cols, idx % 2 === 1);
  });

  // Reference Quotations subtable
  addSectionHeaderRow(s1, 5, 'Reference Quotations');
  const qHeader = s1.addRow(['Vendor Name', 'Quotation Ref', 'Quotation Date', 'Amount (incl. Currency)', 'Remarks']);
  styleTableHeaderRow(qHeader, 5);
  if (pr.referenceQuotations.length === 0) {
    const emptyQ = s1.addRow(['No reference quotations recorded.']);
    s1.mergeCells(emptyQ.number, 1, emptyQ.number, 5);
    styleDataRow(emptyQ, 5, s1Cols, false);
  } else {
    pr.referenceQuotations.forEach((q, idx) => {
      const r = s1.addRow(['', '', '', '', '']);
      setLiteralText(r.getCell(1), q.vendorName, '[Not provided]');
      setLiteralText(r.getCell(2), q.quotationRef, '[Not provided]');
      setIsoDate(r.getCell(3), q.quotationDate);
      setNumericValue(r.getCell(4), q.amount, `"${q.currency || 'SGD'}" #,##0.00`, false);
      setLiteralText(r.getCell(5), q.remarks, '');
      styleDataRow(r, 5, s1Cols, idx % 2 === 1);
    });
  }

  // Requestor confirmation summary
  addSectionHeaderRow(s1, 5, 'Requestor Confirmation (Internal Preparation)');
  const reqRows: Array<[string, string, string]> = [
    ['REQ-01', 'Requestor Name & Designation', `${dec.requestorName || '[Not provided]'}${dec.requestorDesignation ? ` (${dec.requestorDesignation})` : ''}`],
    ['REQ-02', 'Scope & Schedules Complete Confirmation', dec.requestorConfirmedScopeComplete ? 'Confirmed' : 'Not confirmed'],
    ['REQ-03', 'Budget & Endorsements Confirmation', dec.requestorConfirmedBudgetAndApprovals ? 'Confirmed' : 'Not confirmed'],
    ['REQ-04', 'Confirmation Date', dec.requestorConfirmationDate || '[Not provided]'],
  ];
  reqRows.forEach((rr, idx) => {
    const r = s1.addRow([rr[0], rr[1], '', '', '']);
    s1.mergeCells(r.number, 3, r.number, 5);
    if (rr[0] === 'REQ-04' && dec.requestorConfirmationDate) {
      setIsoDate(r.getCell(3), dec.requestorConfirmationDate);
    } else {
      setLiteralText(r.getCell(3), rr[2]);
    }
    styleDataRow(r, 5, s1Cols, idx % 2 === 1);
  });

  // =========================================================================
  // SHEET 2: 2.SOW-Term
  // =========================================================================
  const s2Cols = [16, 40, 14, 16, 16, 26];
  const s2 = workbook.addWorksheet('2.SOW-Term');
  s2.columns = s2Cols.map((w) => ({ width: w }));
  configurePrintSetup(s2, 'landscape');
  addTitleBanner(
    s2,
    6,
    `2. SCHEDULE OF WORKS (${ov.contractType.toUpperCase()})`,
    ov.contractType === 'Ad-hoc Works'
      ? 'NOTE: Contract Type is Ad-hoc Works. Recurring term-contract maintenance fields apply only where relevant.'
      : statusBanner
  );

  const sowProjectTitle = sow.projectTitleSameAsOverview ? ov.tenderSubject : sow.projectTitle;
  const sowSiteAddress = sow.siteAddressSameAsOverview ? ov.serviceSiteAddress : sow.siteAddress;
  const sowContactPerson = sow.contactSameAsOverview ? ov.contactPerson : sow.contactPerson;
  const sowContactPhone = sow.contactSameAsOverview ? ov.contactPhone : sow.contactNumber;
  const durationInfo = calculateContractDuration(
    ct.clause5_2_commencementDate,
    ct.clause5_2_completionDate
  );

  addSectionHeaderRow(s2, 6, 'Sections A - C: Project, Contract Period & Manpower Deployment');
  const s2InfoHeader = s2.addRow(['Section', 'Field', 'Value / Date / Details', '', '', 'Convention / Notes']);
  s2.mergeCells(s2InfoHeader.number, 3, s2InfoHeader.number, 5);
  styleTableHeaderRow(s2InfoHeader, 6);

  const addSowField = (
    sec: string,
    label: string,
    valSetter: (c: ExcelJS.Cell) => void,
    note: string,
    idx: number
  ): number => {
    const r = s2.addRow([sec, label, '', '', '', '']);
    s2.mergeCells(r.number, 3, r.number, 5);
    valSetter(r.getCell(3));
    setLiteralText(r.getCell(6), note, '');
    styleDataRow(r, 6, s2Cols, idx % 2 === 1);
    return r.number;
  };

  let s2Idx = 0;
  addSowField('A', 'Project Title', (c) => setLiteralText(c, sowProjectTitle, '[Not provided]'), '', s2Idx++);
  addSowField('A', 'Site Address', (c) => setLiteralText(c, sowSiteAddress, '[Not provided]'), '', s2Idx++);
  const startRowNum = addSowField(
    'B',
    'Contract Commencement Date (Clause 5.2)',
    (c) => setIsoDate(c, ct.clause5_2_commencementDate),
    'Excel Date cell',
    s2Idx++
  );
  const endRowNum = addSowField(
    'B',
    'Contract Completion Date (Clause 5.2)',
    (c) => setIsoDate(c, ct.clause5_2_completionDate),
    'Excel Date cell',
    s2Idx++
  );

  // Calculated inclusive days formula
  const durRow = s2.addRow(['B', 'Contract Duration (Inclusive Calendar Days)', '', '', '', '']);
  s2.mergeCells(durRow.number, 3, durRow.number, 5);
  if (ct.clause5_2_commencementDate && ct.clause5_2_completionDate) {
    durRow.getCell(3).value = {
      formula: `IF(AND(ISNUMBER(C${startRowNum}),ISNUMBER(C${endRowNum})),C${endRowNum}-C${startRowNum}+1,"")`,
      result: durationInfo.inclusiveDays ?? undefined,
    };
    durRow.getCell(3).numFmt = '#,##0 "days"';
  } else {
    setLiteralText(durRow.getCell(3), '[Enter Clause 5.2 dates]');
  }
  setLiteralText(durRow.getCell(6), durationInfo.conventionNote);
  styleDataRow(durRow, 6, s2Cols, s2Idx++ % 2 === 1);

  addSowField(
    'B',
    'Planned Service Visits (User Confirmed)',
    (c) =>
      setLiteralText(
        c,
        [sow.plannedServiceVisits, sow.serviceVisitsNotes].filter(Boolean).join(' - '),
        '[Not specified]'
      ),
    'Not inferred automatically from dates',
    s2Idx++
  );
  addSowField('C', 'Service Frequency & Interval', (c) => setLiteralText(c, sow.frequencyAndInterval, '[Not provided]'), '', s2Idx++);
  addSowField('C', 'Minimum Manpower & Roles', (c) => setLiteralText(c, sow.minManpowerAndRoles, '[Not provided]'), '', s2Idx++);
  addSowField('C', 'Working Days & Hours', (c) => setLiteralText(c, sow.workingDaysAndHours, '[Not provided]'), '', s2Idx++);
  addSowField('C', 'Additional Deployment Requirements', (c) => setLiteralText(c, sow.additionalDeploymentReqs, 'None'), '', s2Idx++);

  // Section D: Scope of Work
  addSectionHeaderRow(s2, 6, 'Section D: Scope of Work & Appendix References');
  addSowField('D', 'Scope Description', (c) => setLiteralText(c, sow.scopeDescription, '[Not provided]'), '', 0);
  const linkedScopeNames = attachments
    .filter((a) => sow.appendixAttachmentIds.includes(a.id))
    .map((a) => `${a.filename} (${a.category})`)
    .join('; ');
  addSowField(
    'D',
    'Technical PDF Appendix References',
    (c) => setLiteralText(c, linkedScopeNames || sow.scopeAppendixNotes, 'None linked'),
    'Metadata text only; combined PDF contains actual pages',
    1
  );

  const scopeItemsHeader = s2.addRow(['Item No.', 'Scope Item Description', 'Frequency / Spec', '', '', 'Remarks']);
  s2.mergeCells(scopeItemsHeader.number, 3, scopeItemsHeader.number, 5);
  styleTableHeaderRow(scopeItemsHeader, 6);

  if (sow.scopeItems.length === 0) {
    const r = s2.addRow(['-', 'No repeatable scope items added.']);
    s2.mergeCells(r.number, 2, r.number, 6);
    styleDataRow(r, 6, s2Cols, false);
  } else {
    sow.scopeItems.forEach((item, idx) => {
      const r = s2.addRow(['', '', '', '', '', '']);
      s2.mergeCells(r.number, 3, r.number, 5);
      setLiteralText(r.getCell(1), item.itemNo || String(idx + 1));
      setLiteralText(r.getCell(2), item.description, '[Not provided]');
      setLiteralText(r.getCell(3), item.frequencyOrSpec, '-');
      setLiteralText(r.getCell(6), item.remarks, '');
      styleDataRow(r, 6, s2Cols, idx % 2 === 1);
    });
  }

  // Section E: Schedule of Rates
  addSectionHeaderRow(s2, 6, 'Section E: Schedule of Rates (SOR)');
  addSowField(
    'E',
    'Schedule of Rates Applicability',
    (c) =>
      setLiteralText(
        c,
        sow.sorApplicable === 'Not applicable'
          ? `Not applicable - ${sow.sorNaReason || '[No reason stated]'}`
          : sow.sorApplicable || '[Unselected]'
      ),
    sow.sorValidityPeriod ? `Validity: ${sow.sorValidityPeriod}` : '',
    0
  );

  if (sow.sorApplicable !== 'Not applicable') {
    const sorHeader = s2.addRow(['Item', 'Description', 'Unit', 'Quantity', 'Rate', 'Estimated Amount / Remarks']);
    styleTableHeaderRow(sorHeader, 6);
    if (sow.sorRows.length === 0) {
      const r = s2.addRow(['-', 'No Schedule of Rates rows entered.']);
      s2.mergeCells(r.number, 2, r.number, 6);
      styleDataRow(r, 6, s2Cols, false);
    } else {
      const firstSorRow = sorHeader.number + 1;
      let lastSorRow = firstSorRow;
      sow.sorRows.forEach((sr, idx) => {
        const r = s2.addRow([idx + 1, '', '', '', '', '']);
        lastSorRow = r.number;
        setLiteralText(r.getCell(2), sr.description, '[Not provided]');
        setLiteralText(r.getCell(3), sr.unit, '-');
        setNumericValue(r.getCell(4), sr.quantity, '#,##0.##', false);
        setNumericValue(r.getCell(5), sr.rate, `"${sr.currency || 'SGD'}" #,##0.00`, false);
        const qtyNum = Number(sr.quantity);
        const rateNum = Number(sr.rate);
        if (sr.quantity.trim() && sr.rate.trim() && Number.isFinite(qtyNum) && Number.isFinite(rateNum)) {
          r.getCell(6).value = {
            formula: `D${r.number}*E${r.number}`,
            result: qtyNum * rateNum,
          };
          r.getCell(6).numFmt = `"${sr.currency || 'SGD'}" #,##0.00`;
        } else {
          setLiteralText(r.getCell(6), sr.remarks, '');
        }
        styleDataRow(r, 6, s2Cols, idx % 2 === 1);
      });

      const totalRow = s2.addRow(['', 'Total (for rows with numeric Quantity and Rate)', '', '', '', '']);
      totalRow.getCell(2).font = { name: 'Calibri', size: 10, bold: true };
      totalRow.getCell(6).value = {
        formula: `SUM(F${firstSorRow}:F${lastSorRow})`,
      };
      totalRow.getCell(6).numFmt = '#,##0.00';
      totalRow.getCell(6).font = { name: 'Calibri', size: 10, bold: true };
      styleDataRow(totalRow, 6, s2Cols, false);
    }
  }

  // Sections F & G
  addSectionHeaderRow(s2, 6, 'Sections F & G: Contact Person & Declarations');
  addSowField(
    'F',
    'Contact Person & Number',
    (c) => setLiteralText(c, `${sowContactPerson || '[Not provided]'} | ${sowContactPhone || '[Not provided]'}`),
    '',
    0
  );
  addSowField('G', 'Machinery, Tools & Equipment Declaration (Tenderer)', (c) => setLiteralText(c, dec.machineryToolsText), 'To be completed by Tenderer', 1);
  addSowField('G', 'Progressive Wage Model Declaration (Tenderer)', (c) => setLiteralText(c, dec.pwmText), 'To be completed by Tenderer', 0);
  addSowField('G', 'bizSAFE Level & Expiry Declaration (Tenderer)', (c) => setLiteralText(c, dec.bizSafeDeclarationText), 'To be completed by Tenderer', 1);
  addSowField(
    'G',
    'Legacy COVID-19 Vaccination Declaration',
    (c) =>
      setLiteralText(
        c,
        dec.includeLegacyCovidDeclaration
          ? dec.legacyCovidDeclarationText
          : 'Excluded by default (legacy wording requires internal review).'
      ),
    '',
    0
  );
  addSowField(
    'G',
    'Tenderer Sign-off Block',
    (c) =>
      setLiteralText(
        c,
        'Authorised Signatory Name / Signature: [Blank for Tenderer] | Company Name / Stamp: [Blank for Tenderer] | Date: [Blank]'
      ),
    'Do not pre-fill or fabricate signatures',
    1
  );

  // =========================================================================
  // SHEET 3: 3.Specification
  // =========================================================================
  const s3Cols = [28, 18, 42, 30, 26];
  const s3 = workbook.addWorksheet('3.Specification');
  s3.columns = s3Cols.map((w) => ({ width: w }));
  configurePrintSetup(s3, 'landscape');
  addTitleBanner(
    s3,
    5,
    `3. TECHNICAL SCHEDULES & SPECIFICATIONS (${ov.contractType.toUpperCase()})`,
    statusBanner
  );

  addSectionHeaderRow(s3, 5, 'Technical and Supporting Schedules');
  const tHeader = s3.addRow([
    'Schedule Item',
    'Applicability',
    'Details',
    'Editable Guidance / Notes',
    'Attachment References',
  ]);
  styleTableHeaderRow(tHeader, 5);

  data.technicalSchedules.forEach((item, idx) => {
    const isNaForContract = ov.contractType === 'Ad-hoc Works' && item.termOnly;
    const attNames = attachments
      .filter((a) => item.attachmentIds.includes(a.id))
      .map((a) => a.filename)
      .join(', ');
    const r = s3.addRow(['', '', '', '', '']);
    setLiteralText(r.getCell(1), item.label);
    setLiteralText(
      r.getCell(2),
      isNaForContract ? 'Not applicable (Ad-hoc Works)' : item.applicable,
      '[Unselected]'
    );
    setLiteralText(
      r.getCell(3),
      isNaForContract ? 'Term Contract tenure does not apply to Ad-hoc Works.' : item.details,
      ''
    );
    setLiteralText(r.getCell(4), item.validityGuidance, '');
    setLiteralText(r.getCell(5), attNames, 'None');
    styleDataRow(r, 5, s3Cols, idx % 2 === 1);
  });

  addSectionHeaderRow(s3, 5, 'Ad-hoc Works Specifications');
  if (ov.contractType === 'Term Contract') {
    const naRow = s3.addRow([
      'Status',
      'Not applicable — Term Contract selected. Ad-hoc Works specifications are omitted for Term Contracts.',
    ]);
    s3.mergeCells(naRow.number, 2, naRow.number, 5);
    styleDataRow(naRow, 5, s3Cols, false);
  } else if (data.adhocSpecifications.notApplicable) {
    const naRow = s3.addRow([
      'Status',
      `N.A. — ${data.adhocSpecifications.naReason || '[No explanation provided]'}`,
    ]);
    s3.mergeCells(naRow.number, 2, naRow.number, 5);
    styleDataRow(naRow, 5, s3Cols, false);
  } else {
    const spHeader = s3.addRow([
      'Specification Item',
      'Qty / Unit',
      'Technical Requirements',
      'Preferred Brand & Model',
      'Remarks',
    ]);
    styleTableHeaderRow(spHeader, 5);
    if (data.adhocSpecifications.items.length === 0) {
      const emptySp = s3.addRow(['No specification items added.']);
      s3.mergeCells(emptySp.number, 1, emptySp.number, 5);
      styleDataRow(emptySp, 5, s3Cols, false);
    } else {
      data.adhocSpecifications.items.forEach((sp, idx) => {
        const r = s3.addRow(['', '', '', '', '']);
        setLiteralText(r.getCell(1), sp.itemTitle, '[Not provided]');
        setLiteralText(r.getCell(2), sp.quantityOrUnit, '-');
        setLiteralText(r.getCell(3), sp.technicalRequirements, '[Not provided]');
        setLiteralText(r.getCell(4), sp.preferredBrandModel, '-');
        setLiteralText(r.getCell(5), sp.remarks, '');
        styleDataRow(r, 5, s3Cols, idx % 2 === 1);
      });
    }
  }

  // =========================================================================
  // SHEET 4: Attachment Register
  // =========================================================================
  const s4Cols = [14, 34, 20, 14, 12, 18, 20, 30];
  const s4 = workbook.addWorksheet('Attachment Register');
  s4.columns = s4Cols.map((w) => ({ width: w }));
  configurePrintSetup(s4, 'landscape');
  addTitleBanner(
    s4,
    8,
    'ATTACHMENT REGISTER (METADATA ONLY)',
    'Note: This Excel workbook lists attachment filenames, categories and appendix references as text only. Use "Download Form + Selected Appendices PDF" in Tender Request Builder to produce the combined PDF containing appendix pages.'
  );

  s4.addRow([]);
  const regHeader = s4.addRow([
    'Appendix Ref',
    'Filename',
    'Category',
    'File Size',
    'Page Count',
    'File Status',
    'In Combined PDF?',
    'Notes',
  ]);
  styleTableHeaderRow(regHeader, 8);

  if (attachments.length === 0) {
    const r = s4.addRow(['-', 'No local PDF attachments added.']);
    s4.mergeCells(r.number, 2, r.number, 8);
    styleDataRow(r, 8, s4Cols, false);
  } else {
    let appIdx = 0;
    attachments.forEach((att, idx) => {
      const appRef = att.includeInCombinedPdf
        ? `Appendix ${String.fromCharCode(65 + appIdx++)}`
        : 'Excluded';
      const r = s4.addRow(['', '', '', '', '', '', '', '']);
      setLiteralText(r.getCell(1), appRef);
      setLiteralText(r.getCell(2), att.filename);
      setLiteralText(r.getCell(3), att.category);
      setLiteralText(r.getCell(4), formatBytes(att.sizeBytes));
      if (att.pageCount !== null) {
        r.getCell(5).value = att.pageCount;
        r.getCell(5).numFmt = '#,##0';
      } else {
        setLiteralText(r.getCell(5), '-');
      }
      setLiteralText(
        r.getCell(6),
        att.status === 'loaded' ? 'Loaded in browser' : 'Missing (reselect PDF)'
      );
      setLiteralText(r.getCell(7), att.includeInCombinedPdf ? 'Yes' : 'No (Excluded)');
      setLiteralText(r.getCell(8), att.notes, '');
      styleDataRow(r, 8, s4Cols, idx % 2 === 1);
    });
  }

  return await workbook.xlsx.writeBuffer();
}

export async function downloadTenderExcel(
  data: TenderFormData,
  attachments: LocalPdfAttachment[],
  options: { isDraft: boolean }
): Promise<void> {
  const buffer = await generateTenderWorkbookBuffer(data, attachments, options);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const baseName = sanitizeDownloadFilename(
    data.overview.tenderSubject || data.overview.propertyName,
    'tender-request'
  );
  const draftTag = options.isDraft ? '-DRAFT' : '';
  triggerLocalDownload(blob, `${baseName}${draftTag}.xlsx`);
}
