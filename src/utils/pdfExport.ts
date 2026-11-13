import {
  PDFDocument,
  PDFFont,
  PDFPage,
  StandardFonts,
  rgb,
} from 'pdf-lib';
import {
  LocalPdfAttachment,
  TenderFormData,
} from '../types/tender';
import {
  BU_ENDORSEMENT_GUIDANCE,
  GENERAL_TEMPLATE_NOTES,
  calculateContractDuration,
  formatBytes,
} from '../schema/tenderSchema';
import { sanitizeDownloadFilename, triggerLocalDownload } from './pdfAttachments';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN_X = 40;
const MARGIN_TOP = 54;
const MARGIN_BOTTOM = 48;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2;

const COLOR_NAVY = rgb(0.06, 0.09, 0.16); // #0F172A
const COLOR_BLUE = rgb(0.11, 0.31, 0.85); // #1D4ED8
const COLOR_TEXT = rgb(0.12, 0.16, 0.23);
const COLOR_MUTED = rgb(0.39, 0.45, 0.55);
const COLOR_BORDER = rgb(0.82, 0.85, 0.9);
const COLOR_BG_SUBTLE = rgb(0.96, 0.97, 0.98);
const COLOR_BG_WARN = rgb(1.0, 0.97, 0.91);
const COLOR_BORDER_WARN = rgb(0.85, 0.53, 0.09);
const COLOR_TEXT_WARN = rgb(0.57, 0.25, 0.05);
const COLOR_WHITE = rgb(1, 1, 1);

/**
 * Normalizes text into WinAnsi-safe ASCII/Latin-1 characters so pdf-lib StandardFonts
 * never throw encoding errors on curly quotes, em-dashes, bullets, or pasted symbols.
 */
export function sanitizePdfText(input: string | null | undefined): string {
  if (!input) return '';
  const replaced = String(input)
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2015]/g, '-')
    .replace(/\u2022/g, '*')
    .replace(/\u2026/g, '...')
    .replace(/\u2264/g, '<=')
    .replace(/\u2265/g, '>=')
    .replace(/\u2192/g, '->')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2713\u2714]/g, '[x]');

  // Strip/replace any characters outside printable ASCII + basic Latin-1 supplement supported by WinAnsi
  let out = '';
  for (let i = 0; i < replaced.length; i++) {
    const code = replaced.charCodeAt(i);
    if (
      code === 10 ||
      (code >= 32 && code <= 126) ||
      (code >= 160 && code <= 255)
    ) {
      out += replaced[i];
    } else {
      out += '?';
    }
  }
  return out;
}

function wrapTextLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const safe = sanitizePdfText(text);
  if (!safe) return [''];

  const paragraphs = safe.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        // If single word is wider than maxWidth, break by character
        if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
          let chunk = '';
          for (let c = 0; c < word.length; c++) {
            const nextChunk = chunk + word[c];
            if (font.widthOfTextAtSize(nextChunk, fontSize) > maxWidth && chunk) {
              lines.push(chunk);
              chunk = word[c];
            } else {
              chunk = nextChunk;
            }
          }
          currentLine = chunk;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines.length > 0 ? lines : [''];
}

function displayOrMissing(val: string | null | undefined, fallback = '[Not provided]'): string {
  const trimmed = (val || '').trim();
  return trimmed ? trimmed : fallback;
}

class PdfLayoutWriter {
  doc: PDFDocument;
  fontRegular: PDFFont;
  fontBold: PDFFont;
  fontItalic: PDFFont;
  pages: PDFPage[] = [];
  currentPage!: PDFPage;
  y = 0;
  isDraft: boolean;
  headerTitle: string;

  constructor(
    doc: PDFDocument,
    fontRegular: PDFFont,
    fontBold: PDFFont,
    fontItalic: PDFFont,
    isDraft: boolean,
    headerTitle: string
  ) {
    this.doc = doc;
    this.fontRegular = fontRegular;
    this.fontBold = fontBold;
    this.fontItalic = fontItalic;
    this.isDraft = isDraft;
    this.headerTitle = sanitizePdfText(headerTitle || 'Untitled Tender Request');
    this.addNewPage(true);
  }

  addNewPage(isFirst = false): void {
    const page = this.doc.addPage([A4_WIDTH, A4_HEIGHT]);
    this.pages.push(page);
    this.currentPage = page;
    this.y = A4_HEIGHT - MARGIN_TOP;

    if (!isFirst) {
      const runningLabel = this.isDraft
        ? `DRAFT (INCOMPLETE) | TENDER REQUEST - NOT AN APPROVED CONTRACT | ${this.headerTitle}`
        : `TENDER REQUEST - NOT AN APPROVED CONTRACT | ${this.headerTitle}`;
      const truncated =
        runningLabel.length > 96 ? `${runningLabel.slice(0, 93)}...` : runningLabel;
      page.drawText(truncated, {
        x: MARGIN_X,
        y: A4_HEIGHT - 28,
        size: 7.5,
        font: this.fontBold,
        color: this.isDraft ? COLOR_TEXT_WARN : COLOR_MUTED,
      });
      page.drawLine({
        start: { x: MARGIN_X, y: A4_HEIGHT - 34 },
        end: { x: A4_WIDTH - MARGIN_X, y: A4_HEIGHT - 34 },
        thickness: 0.6,
        color: COLOR_BORDER,
      });
    }
  }

  ensureSpace(heightNeeded: number): void {
    if (this.y - heightNeeded < MARGIN_BOTTOM) {
      this.addNewPage(false);
    }
  }

  drawSectionHeading(title: string, subtitle?: string): void {
    this.ensureSpace(44);
    this.y -= 8;
    this.currentPage.drawRectangle({
      x: MARGIN_X,
      y: this.y - 18,
      width: CONTENT_WIDTH,
      height: 22,
      color: COLOR_NAVY,
    });
    this.currentPage.drawText(sanitizePdfText(title), {
      x: MARGIN_X + 8,
      y: this.y - 11,
      size: 10,
      font: this.fontBold,
      color: COLOR_WHITE,
    });
    this.y -= 26;

    if (subtitle) {
      const lines = wrapTextLines(subtitle, this.fontItalic, 8.5, CONTENT_WIDTH - 4);
      for (const line of lines) {
        this.ensureSpace(12);
        this.currentPage.drawText(line, {
          x: MARGIN_X + 2,
          y: this.y - 9,
          size: 8.5,
          font: this.fontItalic,
          color: COLOR_MUTED,
        });
        this.y -= 12;
      }
      this.y -= 4;
    }
  }

  drawCalloutBox(title: string, items: string[], isWarning = true): void {
    const fontSize = 8.5;
    const lineHeight = 11.5;
    const innerWidth = CONTENT_WIDTH - 16;
    const wrappedBlocks: string[][] = items.map((item) =>
      wrapTextLines(item, this.fontRegular, fontSize, innerWidth)
    );
    const totalLines = wrappedBlocks.reduce((acc, b) => acc + b.length, 0);
    const boxHeight = 20 + totalLines * lineHeight + 8;

    if (boxHeight < 220) {
      this.ensureSpace(boxHeight + 6);
    } else {
      this.ensureSpace(50);
    }

    const startY = this.y;
    // Draw background if single-page fit
    if (startY - boxHeight >= MARGIN_BOTTOM) {
      this.currentPage.drawRectangle({
        x: MARGIN_X,
        y: startY - boxHeight,
        width: CONTENT_WIDTH,
        height: boxHeight,
        color: isWarning ? COLOR_BG_WARN : COLOR_BG_SUBTLE,
        borderColor: isWarning ? COLOR_BORDER_WARN : COLOR_BORDER,
        borderWidth: 0.75,
      });
    }

    this.currentPage.drawText(sanitizePdfText(title), {
      x: MARGIN_X + 8,
      y: this.y - 13,
      size: 9,
      font: this.fontBold,
      color: isWarning ? COLOR_TEXT_WARN : COLOR_NAVY,
    });
    this.y -= 20;

    for (const block of wrappedBlocks) {
      for (const line of block) {
        this.ensureSpace(lineHeight + 4);
        this.currentPage.drawText(line, {
          x: MARGIN_X + 8,
          y: this.y - 8,
          size: fontSize,
          font: this.fontRegular,
          color: isWarning ? COLOR_TEXT_WARN : COLOR_TEXT,
        });
        this.y -= lineHeight;
      }
    }
    this.y -= 10;
  }

  drawKeyValueList(rows: Array<{ label: string; value: string }>): void {
    const labelColW = 175;
    const valColW = CONTENT_WIDTH - labelColW - 14;
    const fontSize = 8.5;
    const lineHeight = 11.5;

    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      const labelLines = wrapTextLines(row.label, this.fontBold, fontSize, labelColW - 8);
      const valLines = wrapTextLines(
        displayOrMissing(row.value),
        this.fontRegular,
        fontSize,
        valColW
      );
      const rowLines = Math.max(labelLines.length, valLines.length);
      const rowHeight = Math.max(18, rowLines * lineHeight + 6);

      // If single row is taller than half a page, split line-by-line cleanly
      if (rowHeight > A4_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM - 20) {
        this.ensureSpace(30);
        for (let i = 0; i < labelLines.length; i++) {
          this.ensureSpace(lineHeight);
          this.currentPage.drawText(labelLines[i], {
            x: MARGIN_X + 4,
            y: this.y - 9,
            size: fontSize,
            font: this.fontBold,
            color: COLOR_NAVY,
          });
          this.y -= lineHeight;
        }
        for (let i = 0; i < valLines.length; i++) {
          this.ensureSpace(lineHeight);
          this.currentPage.drawText(valLines[i], {
            x: MARGIN_X + 12,
            y: this.y - 9,
            size: fontSize,
            font: this.fontRegular,
            color: COLOR_TEXT,
          });
          this.y -= lineHeight;
        }
        this.y -= 4;
        continue;
      }

      this.ensureSpace(rowHeight + 2);
      if (idx % 2 === 0) {
        this.currentPage.drawRectangle({
          x: MARGIN_X,
          y: this.y - rowHeight,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: COLOR_BG_SUBTLE,
        });
      }

      for (let i = 0; i < labelLines.length; i++) {
        this.currentPage.drawText(labelLines[i], {
          x: MARGIN_X + 6,
          y: this.y - 11 - i * lineHeight,
          size: fontSize,
          font: this.fontBold,
          color: COLOR_NAVY,
        });
      }

      const isMissingVal = !row.value || !row.value.trim();
      for (let i = 0; i < valLines.length; i++) {
        this.currentPage.drawText(valLines[i], {
          x: MARGIN_X + labelColW + 6,
          y: this.y - 11 - i * lineHeight,
          size: fontSize,
          font: isMissingVal ? this.fontItalic : this.fontRegular,
          color: isMissingVal ? COLOR_MUTED : COLOR_TEXT,
        });
      }

      this.currentPage.drawLine({
        start: { x: MARGIN_X, y: this.y - rowHeight },
        end: { x: MARGIN_X + CONTENT_WIDTH, y: this.y - rowHeight },
        thickness: 0.4,
        color: COLOR_BORDER,
      });

      this.y -= rowHeight;
    }
    this.y -= 8;
  }

  drawTable(
    headers: string[],
    colWidths: number[],
    rows: string[][],
    emptyText = 'None specified.'
  ): void {
    const fontSize = 8;
    const lineHeight = 10.5;
    const headerHeight = 20;

    const drawHeaderRow = () => {
      this.ensureSpace(headerHeight + 18);
      this.currentPage.drawRectangle({
        x: MARGIN_X,
        y: this.y - headerHeight,
        width: CONTENT_WIDTH,
        height: headerHeight,
        color: rgb(0.9, 0.92, 0.96),
        borderColor: COLOR_BORDER,
        borderWidth: 0.5,
      });
      let xCursor = MARGIN_X;
      for (let c = 0; c < headers.length; c++) {
        this.currentPage.drawText(sanitizePdfText(headers[c]), {
          x: xCursor + 5,
          y: this.y - 13,
          size: 8,
          font: this.fontBold,
          color: COLOR_NAVY,
        });
        xCursor += colWidths[c];
      }
      this.y -= headerHeight;
    };

    drawHeaderRow();

    if (rows.length === 0) {
      this.ensureSpace(22);
      this.currentPage.drawRectangle({
        x: MARGIN_X,
        y: this.y - 20,
        width: CONTENT_WIDTH,
        height: 20,
        borderColor: COLOR_BORDER,
        borderWidth: 0.5,
      });
      this.currentPage.drawText(sanitizePdfText(emptyText), {
        x: MARGIN_X + 6,
        y: this.y - 13,
        size: 8,
        font: this.fontItalic,
        color: COLOR_MUTED,
      });
      this.y -= 28;
      return;
    }

    for (let r = 0; r < rows.length; r++) {
      const cellsWrapped = rows[r].map((cellText, cIdx) =>
        wrapTextLines(
          cellText || '-',
          this.fontRegular,
          fontSize,
          Math.max(20, colWidths[cIdx] - 10)
        )
      );
      const maxLines = Math.max(...cellsWrapped.map((l) => l.length));
      const rowHeight = Math.max(18, maxLines * lineHeight + 7);

      if (this.y - rowHeight < MARGIN_BOTTOM) {
        this.addNewPage(false);
        drawHeaderRow();
      }

      this.currentPage.drawRectangle({
        x: MARGIN_X,
        y: this.y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: r % 2 === 1 ? COLOR_BG_SUBTLE : COLOR_WHITE,
        borderColor: COLOR_BORDER,
        borderWidth: 0.4,
      });

      let xCursor = MARGIN_X;
      for (let c = 0; c < cellsWrapped.length; c++) {
        const lines = cellsWrapped[c];
        for (let l = 0; l < lines.length; l++) {
          this.currentPage.drawText(lines[l], {
            x: xCursor + 5,
            y: this.y - 11 - l * lineHeight,
            size: fontSize,
            font: this.fontRegular,
            color: COLOR_TEXT,
          });
        }
        xCursor += colWidths[c];
      }

      this.y -= rowHeight;
    }
    this.y -= 10;
  }

  stampFooters(pageLabelPrefix = 'Page'): void {
    const total = this.pages.length;
    const generatedAt = sanitizePdfText(
      new Date().toLocaleString('en-SG', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    );

    for (let i = 0; i < total; i++) {
      const page = this.pages[i];
      page.drawLine({
        start: { x: MARGIN_X, y: 32 },
        end: { x: A4_WIDTH - MARGIN_X, y: 32 },
        thickness: 0.5,
        color: COLOR_BORDER,
      });
      const leftFooter = this.isDraft
        ? `DRAFT TENDER REQUEST (Incomplete) | Generated ${generatedAt}`
        : `TENDER REQUEST (Not an approved contract) | Generated ${generatedAt}`;
      page.drawText(leftFooter, {
        x: MARGIN_X,
        y: 20,
        size: 7.5,
        font: this.fontRegular,
        color: COLOR_MUTED,
      });
      const rightFooter = `${pageLabelPrefix} ${i + 1} of ${total}`;
      const rightW = this.fontRegular.widthOfTextAtSize(rightFooter, 7.5);
      page.drawText(rightFooter, {
        x: A4_WIDTH - MARGIN_X - rightW,
        y: 20,
        size: 7.5,
        font: this.fontBold,
        color: COLOR_MUTED,
      });
    }
  }
}

export async function generateTenderPdfBytes(
  data: TenderFormData,
  attachments: LocalPdfAttachment[],
  options: {
    includeAppendices: boolean;
    isDraft: boolean;
    validationIssueCount?: number;
  }
): Promise<Uint8Array> {
  const includedAppendices = attachments.filter((a) => a.includeInCombinedPdf);

  if (options.includeAppendices) {
    const missing = includedAppendices.filter((a) => a.status !== 'loaded' || !a.bytes);
    if (missing.length > 0) {
      throw new Error(
        `Cannot export combined PDF because ${missing.length} selected appendix file(s) are missing or unreadable: ${missing
          .map((m) => m.filename)
          .join(', ')}. Re-attach them or uncheck them before exporting.`
      );
    }
  }

  const doc = await PDFDocument.create();
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await doc.embedFont(StandardFonts.HelveticaOblique);

  const writer = new PdfLayoutWriter(
    doc,
    fontRegular,
    fontBold,
    fontItalic,
    options.isDraft,
    data.overview.tenderSubject || data.overview.propertyName
  );

  // --- Title Banner on Page 1 ---
  const p1 = writer.currentPage;
  p1.drawRectangle({
    x: MARGIN_X,
    y: writer.y - 54,
    width: CONTENT_WIDTH,
    height: 54,
    color: COLOR_NAVY,
  });
  p1.drawText('TENDER REQUEST', {
    x: MARGIN_X + 12,
    y: writer.y - 22,
    size: 15,
    font: fontBold,
    color: COLOR_WHITE,
  });
  p1.drawText(
    `Request to Call for Tender (${sanitizePdfText(data.overview.contractType)}) - NOT an approved contract`,
    {
      x: MARGIN_X + 12,
      y: writer.y - 39,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.82, 0.87, 0.96),
    }
  );
  writer.y -= 64;

  if (options.isDraft) {
    writer.drawCalloutBox(
      'DRAFT EXPORT NOTICE - REQUIRED FIELDS INCOMPLETE',
      [
        `This document was exported as a DRAFT with ${options.validationIssueCount || 'one or more'} incomplete or flagged validation item(s). Review all "[Not provided]" fields before calling for tender.`,
      ],
      true
    );
  }

  // --- 1. Tender Overview ---
  const ov = data.overview;
  const buDisplay =
    ov.businessUnit === 'Other'
      ? `Other (${ov.businessUnitOther || 'unspecified'})`
      : ov.businessUnit;
  const showroundContact = ov.showroundSameAsContact
    ? `${ov.contactPerson || '[Not provided]'} (${ov.contactPhone || 'No phone'}) [Same as primary contact]`
    : `${ov.showroundContactPerson || '[Not provided]'}${ov.showroundContactPhone ? ` (${ov.showroundContactPhone})` : ''}`;
  const showroundPoint = ov.showroundSameAsSiteAddress
    ? `${ov.serviceSiteAddress || '[Not provided]'} [Same as site address]`
    : ov.showroundMeetingPoint;

  writer.drawSectionHeading('1. Tender Overview');
  writer.drawKeyValueList([
    { label: 'Name of Property', value: ov.propertyName },
    { label: 'Tender Subject / Title', value: ov.tenderSubject },
    { label: 'Contract Type', value: ov.contractType },
    { label: 'Name of Employer', value: ov.employerName },
    { label: 'Business Unit', value: buDisplay },
    { label: 'Material Group', value: ov.materialGroup },
    { label: 'Primary Contact Person', value: ov.contactPerson },
    { label: 'Telephone Number', value: ov.contactPhone },
    { label: 'Email Address', value: ov.contactEmail },
    { label: 'Service / Site Address', value: ov.serviceSiteAddress },
    { label: 'Site Showround Contact', value: showroundContact },
    { label: 'Site Showround Meeting Point', value: showroundPoint },
  ]);

  // --- 2. General Information / Contract Terms ---
  const ct = data.contractTerms;
  writer.drawSectionHeading(
    '2. General Information / Contract Terms',
    'Preserved clause references from template checklist. Verify applicability and legal terms internally before tender issuance.'
  );

  writer.drawCalloutBox(
    'Template Procedural Notes (Internal Confirmation Required)',
    GENERAL_TEMPLATE_NOTES,
    false
  );

  const naOr = (isNa: boolean, val: string, naReason: string) =>
    isNa
      ? `Not applicable${naReason.trim() ? ` - ${naReason.trim()}` : ''}`
      : val;

  const contractTermRows: string[][] = [
    ['Clause 5.1', 'Scope of works & service frequency', `${displayOrMissing(ct.clause5_1_scopeSummary)}\nFrequency: ${displayOrMissing(ct.clause5_1_serviceFrequency)}`],
    ['Clause 5.2', 'Contract commencement date', displayOrMissing(ct.clause5_2_commencementDate)],
    ['Clause 5.2', 'Contract completion date', displayOrMissing(ct.clause5_2_completionDate)],
    ['Clause 6.3', 'bizSAFE Level 3 certification or equivalent', `${displayOrMissing(ct.clause6_3_bizSafeRequired)}${ct.clause6_3_details ? `\n${ct.clause6_3_details}` : ''}`],
    ['Clause 7.1', 'Deadline for detailed programme', naOr(ct.clause7_1_notApplicable, ct.clause7_1_deadlineValue ? `${ct.clause7_1_deadlineValue} ${ct.clause7_1_deadlineUnit}${ct.clause7_1_details ? ` (${ct.clause7_1_details})` : ''}` : '[Not provided]', ct.clause7_1_details)],
    ['Clause 10.1', 'List of warranties', naOr(ct.clause10_1_notApplicable, displayOrMissing(ct.clause10_1_warranties), ct.clause10_1_naReason)],
    ['Clause 12.1', 'Variation notice requirements', naOr(ct.clause12_1_notApplicable, displayOrMissing(ct.clause12_1_noticeRequirements), ct.clause12_1_naReason)],
    ['Clause 12.2.4', 'Overheads, profits & all necessary costs (%)', naOr(ct.clause12_2_4_notApplicable, ct.clause12_2_4_overheadProfitPct ? `${ct.clause12_2_4_overheadProfitPct}%` : '[Not provided]', ct.clause12_2_4_naReason)],
    ['Clause 13.1', 'Payment type & frequency', `${displayOrMissing(ct.clause13_1_paymentType)}${ct.clause13_1_frequencyDetails ? ` - ${ct.clause13_1_frequencyDetails}` : ''}`],
    ['Clause 13.2', 'Retention rate (%)', naOr(ct.clause13_2_notApplicable, ct.clause13_2_retentionRatePct ? `${ct.clause13_2_retentionRatePct}%` : '[Not provided]', ct.clause13_2_naReason)],
    ['Clause 13.7', 'SOP Act applicability / details', `${displayOrMissing(ct.clause13_7_sopApplicable)}${ct.clause13_7_details ? `\n${ct.clause13_7_details}` : ''}`],
    ['Clause 14', "Vendor's control of site", naOr(ct.clause14_notApplicable, displayOrMissing(ct.clause14_controlOfSite), ct.clause14_naReason)],
    ['Clause 17', 'Completion certificate requirements', naOr(ct.clause17_notApplicable, displayOrMissing(ct.clause17_completionCertificate), ct.clause17_naReason)],
    ['Clause 18', 'Maintenance period applicability / details', `${displayOrMissing(ct.clause18_maintenanceApplicable)}${ct.clause18_details ? `\n${ct.clause18_details}` : ''}`],
    ['Clause 18.1', 'Duration of maintenance period', ct.clause18_maintenanceApplicable === 'Not applicable' ? 'Not applicable (per Clause 18)' : ct.clause18_1_durationValue ? `${ct.clause18_1_durationValue} ${ct.clause18_1_durationUnit}` : '[Not provided]'],
    ['Clause 19', 'Warranty period', naOr(ct.clause19_notApplicable, ct.clause19_durationValue ? `${ct.clause19_durationValue} ${ct.clause19_durationUnit}${ct.clause19_details ? `\n${ct.clause19_details}` : ''}` : displayOrMissing(ct.clause19_details), ct.clause19_details)],
    ['Clause 20.1', 'Quantum of performance bond', naOr(ct.clause20_1_notApplicable, ct.clause20_1_quantumValue ? (ct.clause20_1_quantumBasis === 'percentage' ? `${ct.clause20_1_quantumValue}% of contract sum` : `${ct.clause20_1_currency} ${ct.clause20_1_quantumValue}`) : '[Not provided]', ct.clause20_1_naReason)],
    ['Clause 20.3', 'Duration of performance bond', naOr(ct.clause20_3_notApplicable, displayOrMissing(ct.clause20_3_duration), ct.clause20_3_naReason)],
    ['Clause 21.1', 'Liquidated damages (amount, basis, cap)', naOr(ct.clause21_1_notApplicable, ct.clause21_1_amount ? `${ct.clause21_1_currency} ${ct.clause21_1_amount} | Basis: ${displayOrMissing(ct.clause21_1_basis)} | Cap: ${displayOrMissing(ct.clause21_1_cap)}` : '[Not provided]', ct.clause21_1_naReason)],
    ['Clause 25.1', 'Employer termination notice', ct.clause25_1_noticeValue ? `${ct.clause25_1_noticeValue} ${ct.clause25_1_noticeUnit}${ct.clause25_1_details ? ` - ${ct.clause25_1_details}` : ''}` : displayOrMissing(ct.clause25_1_details)],
    ['Clause 26.1', 'Vendor termination notice', ct.clause26_1_noticeValue ? `${ct.clause26_1_noticeValue} ${ct.clause26_1_noticeUnit}${ct.clause26_1_details ? ` - ${ct.clause26_1_details}` : ''}` : displayOrMissing(ct.clause26_1_details)],
    ['Clause 33', 'Option to renew (duration & notice wording)', ct.clause33_applicable === 'Not applicable' ? `Not applicable${ct.clause33_naReason ? ` - ${ct.clause33_naReason}` : ''}` : `${displayOrMissing(ct.clause33_applicable)} | Duration: ${displayOrMissing(ct.clause33_renewalDuration)}\nNotice wording: ${displayOrMissing(ct.clause33_noticeRequirements)}`],
  ];

  writer.drawTable(
    ['Clause Ref', 'Contract Term Item', 'Entered Requirement / Status'],
    [78, 175, CONTENT_WIDTH - 253],
    contractTermRows
  );

  // Clause 22.1 Insurances Table
  writer.ensureSpace(35);
  writer.currentPage.drawText('Clause 22.1 - Required Insurance Coverage', {
    x: MARGIN_X,
    y: writer.y - 10,
    size: 9.5,
    font: fontBold,
    color: COLOR_NAVY,
  });
  writer.y -= 18;

  if (ct.clause22_1_notApplicable) {
    writer.drawKeyValueList([
      { label: 'Clause 22.1 Status', value: `Not applicable - ${ct.clause22_1_naReason || '[No reason stated]'}` },
    ]);
  } else {
    writer.drawTable(
      ['Insurance Type', 'Currency', 'Coverage Amount', 'Remarks'],
      [180, 60, 105, CONTENT_WIDTH - 345],
      ct.clause22_1_insurances.map((ins) => [
        displayOrMissing(ins.type),
        ins.currency || 'SGD',
        displayOrMissing(ins.coverageAmount),
        ins.remarks || '-',
      ]),
      'No insurance entries added.'
    );
  }

  // --- 3. Purchase Requisition Supporting Information ---
  const pr = data.purchaseRequisition;
  writer.drawSectionHeading('3. Purchase Requisition Supporting Information');

  const prMaterialGroup = pr.prMaterialGroupSameAsOverview
    ? ov.materialGroup
    : pr.prMaterialGroup;

  writer.drawKeyValueList([
    {
      label: 'Covered by Existing Warranty / Term / Maintenance Contract?',
      value: pr.coveredByExistingContract,
    },
    ...(pr.coveredByExistingContract === 'Yes'
      ? [{ label: 'Justification for New PR', value: pr.existingContractJustification }]
      : []),
    {
      label: 'Approved Budget',
      value: pr.approvedBudgetAmount
        ? `${pr.budgetCurrency || 'SGD'} ${pr.approvedBudgetAmount}`
        : '',
    },
    {
      label: 'Latest Budget Checked',
      value: pr.latestBudgetChecked ? 'Confirmed checked' : 'Not confirmed',
    },
    {
      label: 'Additional Budget Approval',
      value: `${displayOrMissing(pr.additionalBudgetApprovalStatus)}${pr.additionalBudgetExplanation ? ` - ${pr.additionalBudgetExplanation}` : ''}`,
    },
    { label: 'Approval / Endorsement Status', value: pr.approvalStatus },
    { label: 'Supporting Document References', value: pr.supportingDocumentRefs },
    { label: 'Material Group', value: prMaterialGroup },
  ]);

  if (ov.businessUnit && BU_ENDORSEMENT_GUIDANCE[ov.businessUnit]) {
    const buGuide = BU_ENDORSEMENT_GUIDANCE[ov.businessUnit];
    writer.drawCalloutBox(
      `Endorsement Guidance (${buGuide.label}) - Template Internal Requirement (Verify Locally)`,
      [buGuide.requirement],
      false
    );
  }

  writer.drawTable(
    ['Vendor Name', 'Quotation Ref', 'Date', 'Currency', 'Amount', 'Remarks'],
    [125, 85, 70, 50, 75, CONTENT_WIDTH - 405],
    pr.referenceQuotations.map((q) => [
      displayOrMissing(q.vendorName),
      displayOrMissing(q.quotationRef),
      displayOrMissing(q.quotationDate),
      q.currency || 'SGD',
      displayOrMissing(q.amount),
      q.remarks || '-',
    ]),
    'No reference quotations recorded.'
  );

  // --- 4. Schedule of Works (A - G) ---
  const sow = data.scheduleOfWorks;
  const duration = calculateContractDuration(
    ct.clause5_2_commencementDate,
    ct.clause5_2_completionDate
  );
  const sowProjectTitle = sow.projectTitleSameAsOverview ? ov.tenderSubject : sow.projectTitle;
  const sowSiteAddress = sow.siteAddressSameAsOverview
    ? ov.serviceSiteAddress
    : sow.siteAddress;
  const sowContactPerson = sow.contactSameAsOverview ? ov.contactPerson : sow.contactPerson;
  const sowContactNumber = sow.contactSameAsOverview ? ov.contactPhone : sow.contactNumber;

  const linkedScopeAttachments = attachments
    .filter((a) => sow.appendixAttachmentIds.includes(a.id))
    .map((a) => `${a.filename} (${a.category})`)
    .join('; ');

  writer.drawSectionHeading('4. Schedule of Works (Sections A - G)');
  writer.drawKeyValueList([
    { label: 'A. Project Title', value: sowProjectTitle },
    { label: 'A. Site Address', value: sowSiteAddress },
    {
      label: 'B. Contract Period (Clause 5.2)',
      value:
        ct.clause5_2_commencementDate && ct.clause5_2_completionDate
          ? `${ct.clause5_2_commencementDate} to ${ct.clause5_2_completionDate} (${duration.formatted})`
          : '[Commencement / completion dates not provided]',
    },
    { label: 'B. Duration Convention', value: duration.conventionNote },
    {
      label: 'B. Planned Service Visits (User Confirmed)',
      value: sow.plannedServiceVisits
        ? `${sow.plannedServiceVisits}${sow.serviceVisitsNotes ? ` (${sow.serviceVisitsNotes})` : ''}`
        : sow.serviceVisitsNotes || '[Not specified]',
    },
    { label: 'C. Service Frequency & Interval', value: sow.frequencyAndInterval },
    { label: 'C. Minimum Manpower & Roles', value: sow.minManpowerAndRoles },
    { label: 'C. Working Days & Hours', value: sow.workingDaysAndHours },
    { label: 'C. Additional Deployment Requirements', value: sow.additionalDeploymentReqs },
    { label: 'D. Multiline Scope Description', value: sow.scopeDescription },
    {
      label: 'D. Linked Technical PDF Appendices',
      value: linkedScopeAttachments || sow.scopeAppendixNotes || 'None linked',
    },
    {
      label: 'F. Contact Person & Number',
      value: `${displayOrMissing(sowContactPerson)} | ${displayOrMissing(sowContactNumber)}`,
    },
    {
      label: 'G. Declaration & Confirmation',
      value: 'See Section 6 (Requestor Confirmation & Tenderer Declaration Placeholders).',
    },
  ]);

  if (sow.scopeItems.length > 0) {
    writer.drawTable(
      ['Item No.', 'Scope Item Description', 'Frequency / Specification', 'Remarks'],
      [55, 220, 130, CONTENT_WIDTH - 405],
      sow.scopeItems.map((item) => [
        item.itemNo || '-',
        displayOrMissing(item.description),
        item.frequencyOrSpec || '-',
        item.remarks || '-',
      ])
    );
  }

  // Section E: Schedule of Rates
  if (sow.sorApplicable === 'Not applicable') {
    writer.drawKeyValueList([
      {
        label: 'E. Schedule of Rates',
        value: `Not applicable - ${sow.sorNaReason || '[No reason stated]'}`,
      },
    ]);
  } else {
    writer.drawKeyValueList([
      { label: 'E. Schedule of Rates Status', value: sow.sorApplicable || '[Not selected]' },
      { label: 'E. SOR Validity Period', value: sow.sorValidityPeriod },
    ]);
    writer.drawTable(
      ['Description', 'Unit', 'Qty', 'Currency', 'Rate', 'Remarks'],
      [185, 55, 55, 55, 70, CONTENT_WIDTH - 420],
      sow.sorRows.map((row) => [
        displayOrMissing(row.description),
        row.unit || '-',
        row.quantity || '-',
        row.currency || 'SGD',
        row.rate || '-',
        row.remarks || '-',
      ]),
      'No Schedule of Rates line items entered.'
    );
  }

  // --- 5. Technical and Supporting Schedules & Specifications ---
  writer.drawSectionHeading('5. Technical and Supporting Schedules');

  const techRows = data.technicalSchedules.map((item) => {
    const isNaForContract = ov.contractType === 'Ad-hoc Works' && item.termOnly;
    const linkedFiles = attachments
      .filter((a) => item.attachmentIds.includes(a.id))
      .map((a) => a.filename)
      .join(', ');
    const detailsText = isNaForContract
      ? 'Not applicable for Ad-hoc Works.'
      : [item.details, item.validityGuidance].filter(Boolean).join('\n');

    return [
      item.label,
      isNaForContract ? 'N/A (Ad-hoc)' : displayOrMissing(item.applicable, '[Unselected]'),
      detailsText || '-',
      linkedFiles || '-',
    ];
  });

  writer.drawTable(
    ['Schedule Item', 'Status', 'Details / Validity Guidance', 'Attachment Refs'],
    [135, 75, 195, CONTENT_WIDTH - 405],
    techRows
  );

  // Ad-hoc Specifications
  if (ov.contractType === 'Ad-hoc Works') {
    writer.ensureSpace(32);
    writer.currentPage.drawText('Ad-hoc Works Specifications', {
      x: MARGIN_X,
      y: writer.y - 10,
      size: 9.5,
      font: fontBold,
      color: COLOR_NAVY,
    });
    writer.y -= 18;

    if (data.adhocSpecifications.notApplicable) {
      writer.drawKeyValueList([
        {
          label: 'Specifications Status',
          value: `N.A. - ${data.adhocSpecifications.naReason || '[No explanation provided]'}`,
        },
      ]);
    } else {
      writer.drawTable(
        ['Item Title', 'Technical Requirements', 'Preferred Brand / Model', 'Qty / Unit', 'Remarks'],
        [100, 175, 110, 60, CONTENT_WIDTH - 445],
        data.adhocSpecifications.items.map((s) => [
          displayOrMissing(s.itemTitle),
          displayOrMissing(s.technicalRequirements),
          s.preferredBrandModel || '-',
          s.quantityOrUnit || '-',
          s.remarks || '-',
        ]),
        'No specification items added.'
      );
    }
  }

  // --- 6. Declaration and Confirmation ---
  const dec = data.declarations;
  writer.drawSectionHeading(
    '6. Requestor Confirmation & Tenderer Declaration',
    'Internal requestor confirmations are separate from Tenderer declarations to be completed by bidding vendors upon submission.'
  );

  writer.drawKeyValueList([
    {
      label: 'Requestor Confirmation (Scope & Schedules)',
      value: dec.requestorConfirmedScopeComplete ? 'Confirmed by Requestor' : 'Not confirmed',
    },
    {
      label: 'Requestor Confirmation (Budget & Endorsements)',
      value: dec.requestorConfirmedBudgetAndApprovals
        ? 'Confirmed by Requestor'
        : 'Not confirmed',
    },
    { label: 'Requestor Name', value: dec.requestorName },
    { label: 'Requestor Designation', value: dec.requestorDesignation },
    { label: 'Confirmation Date', value: dec.requestorConfirmationDate },
  ]);

  const tendererClauses: Array<{ label: string; value: string }> = [
    { label: 'Machinery, Tools & Equipment', value: dec.machineryToolsText },
    { label: 'Progressive Wage Model (PWM)', value: dec.pwmText },
    { label: 'bizSAFE Level & Expiry', value: dec.bizSafeDeclarationText },
    {
      label: 'Legacy COVID-19 Declaration',
      value: dec.includeLegacyCovidDeclaration
        ? dec.legacyCovidDeclarationText
        : 'Excluded by default (legacy template wording).',
    },
    {
      label: 'Tenderer Sign-off (To Be Completed by Tenderer)',
      value:
        'Authorised Signatory Name & Signature: ______________________________\n' +
        'Company Name & Stamp: ____________________________________________\n' +
        'Date: ______________________    bizSAFE Level / Expiry: ______________',
    },
  ];
  writer.drawKeyValueList(tendererClauses);

  writer.drawCalloutBox(
    'Legal & Template Verification Notice',
    [
      'Template clauses and declarations have not been legally verified. Confirm all commercial, statutory and safety wording with Procurement and Legal before issuing this tender.',
    ],
    false
  );

  // --- 7. Attachment Register ---
  writer.drawSectionHeading('7. Attachment Register');

  let appendixCounter = 0;
  const registerRows = attachments.map((att) => {
    const appendixCode = att.includeInCombinedPdf
      ? `Appendix ${String.fromCharCode(65 + appendixCounter++)}`
      : 'Excluded';
    return [
      appendixCode,
      att.filename,
      att.category,
      formatBytes(att.sizeBytes),
      att.pageCount !== null ? String(att.pageCount) : '-',
      att.status === 'loaded' ? 'Ready' : 'Missing (reselect)',
    ];
  });

  writer.drawTable(
    ['Appendix Ref', 'Filename', 'Category', 'Size', 'Pages', 'Status'],
    [72, 180, 95, 55, 42, CONTENT_WIDTH - 444],
    registerRows,
    'No local PDF attachments added.'
  );

  // Stamp page numbers on all form pages
  writer.stampFooters(options.includeAppendices ? 'Form Page' : 'Page');

  // --- Optional Combined PDF Appendices ---
  if (options.includeAppendices && includedAppendices.length > 0) {
    // Appendix Index Page
    const indexPage = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    let idxY = A4_HEIGHT - 54;

    indexPage.drawRectangle({
      x: MARGIN_X,
      y: idxY - 40,
      width: CONTENT_WIDTH,
      height: 40,
      color: COLOR_NAVY,
    });
    indexPage.drawText('TECHNICAL APPENDICES INDEX', {
      x: MARGIN_X + 12,
      y: idxY - 25,
      size: 13,
      font: fontBold,
      color: COLOR_WHITE,
    });
    idxY -= 58;

    indexPage.drawText(
      `Combined Tender Request Package - ${includedAppendices.length} selected PDF appendix file(s) follow in order.`,
      {
        x: MARGIN_X,
        y: idxY,
        size: 9.5,
        font: fontRegular,
        color: COLOR_TEXT,
      }
    );
    idxY -= 24;

    // Draw index table
    const idxColW = [75, 225, 110, 55, CONTENT_WIDTH - 465];
    const idxHeaders = ['Appendix', 'Document Filename', 'Category', 'Pages', 'Size'];
    indexPage.drawRectangle({
      x: MARGIN_X,
      y: idxY - 20,
      width: CONTENT_WIDTH,
      height: 20,
      color: rgb(0.9, 0.92, 0.96),
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });
    let hx = MARGIN_X;
    for (let c = 0; c < idxHeaders.length; c++) {
      indexPage.drawText(idxHeaders[c], {
        x: hx + 6,
        y: idxY - 13,
        size: 8.5,
        font: fontBold,
        color: COLOR_NAVY,
      });
      hx += idxColW[c];
    }
    idxY -= 20;

    for (let i = 0; i < includedAppendices.length; i++) {
      const att = includedAppendices[i];
      const code = `Appendix ${String.fromCharCode(65 + i)}`;
      const nameLines = wrapTextLines(att.filename, fontRegular, 8.5, idxColW[1] - 12);
      const rH = Math.max(20, nameLines.length * 11 + 8);

      indexPage.drawRectangle({
        x: MARGIN_X,
        y: idxY - rH,
        width: CONTENT_WIDTH,
        height: rH,
        color: i % 2 === 1 ? COLOR_BG_SUBTLE : COLOR_WHITE,
        borderColor: COLOR_BORDER,
        borderWidth: 0.4,
      });

      let cx = MARGIN_X;
      indexPage.drawText(code, {
        x: cx + 6,
        y: idxY - 13,
        size: 8.5,
        font: fontBold,
        color: COLOR_BLUE,
      });
      cx += idxColW[0];

      for (let l = 0; l < nameLines.length; l++) {
        indexPage.drawText(nameLines[l], {
          x: cx + 6,
          y: idxY - 13 - l * 11,
          size: 8.5,
          font: fontRegular,
          color: COLOR_TEXT,
        });
      }
      cx += idxColW[1];

      indexPage.drawText(sanitizePdfText(att.category), {
        x: cx + 6,
        y: idxY - 13,
        size: 8.5,
        font: fontRegular,
        color: COLOR_TEXT,
      });
      cx += idxColW[2];

      indexPage.drawText(String(att.pageCount ?? '-'), {
        x: cx + 6,
        y: idxY - 13,
        size: 8.5,
        font: fontRegular,
        color: COLOR_TEXT,
      });
      cx += idxColW[3];

      indexPage.drawText(formatBytes(att.sizeBytes), {
        x: cx + 6,
        y: idxY - 13,
        size: 8.5,
        font: fontRegular,
        color: COLOR_TEXT,
      });

      idxY -= rH;
    }

    // Merge each appendix PDF preserving original page sizes and orientations
    for (const att of includedAppendices) {
      if (!att.bytes) {
        throw new Error(`Missing bytes for "${att.filename}".`);
      }
      const srcPdf = await PDFDocument.load(att.bytes, { ignoreEncryption: false });
      const copiedPages = await doc.copyPages(srcPdf, srcPdf.getPageIndices());
      for (const page of copiedPages) {
        doc.addPage(page);
      }
    }
  }

  return await doc.save();
}

export async function downloadTenderPdf(
  data: TenderFormData,
  attachments: LocalPdfAttachment[],
  options: {
    includeAppendices: boolean;
    isDraft: boolean;
    validationIssueCount?: number;
  }
): Promise<void> {
  const bytes = await generateTenderPdfBytes(data, attachments, options);
  const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  const baseName = sanitizeDownloadFilename(
    data.overview.tenderSubject || data.overview.propertyName,
    'tender-request'
  );
  const suffix = options.includeAppendices ? 'with-appendices' : 'form';
  const draftTag = options.isDraft ? '-DRAFT' : '';
  triggerLocalDownload(blob, `${baseName}-${suffix}${draftTag}.pdf`);
}
