import { jsPDF } from 'jspdf';
import type { SubmissionResult } from '../types';
import { formatAmount } from './format';

const BRAND_TEAL = '#1496BE';
const BRAND_GREEN = '#8CB450';
const BRAND_CHARCOAL = '#464646';

export function generatePdf(submission: SubmissionResult): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { formData: d, referenceNumber, submittedAt, totalValue, convertedValue, currencyLabel } =
    submission;
  const margin = 15;
  let y = margin;

  const addLine = (text: string, size = 10, bold = false, color = BRAND_CHARCOAL) => {
    doc.setFontSize(size);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color);
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, margin, y);
    y += lines.length * (size * 0.45) + 2;
    if (y > 275) {
      doc.addPage();
      y = margin;
    }
  };

  const addSection = (title: string) => {
    y += 4;
    doc.setFillColor(BRAND_TEAL);
    doc.rect(margin, y - 4, 180, 7, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#ffffff');
    doc.text(title, margin + 2, y);
    y += 8;
  };

  const addField = (label: string, value: string) => {
    if (!value) return;
    addLine(`${label}: ${value}`, 9);
  };

  // Header
  doc.setFillColor(BRAND_TEAL);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('ADT Insurance Agency Ltd', margin, 12);
  doc.setFontSize(10);
  doc.text('Marine Cover Note Application', margin, 20);
  doc.setFontSize(8);
  doc.text('Redefining Standards', margin, 25);

  y = 36;
  addLine(`Reference: ${referenceNumber}`, 11, true, BRAND_TEAL);
  addLine(`Submitted: ${new Date(submittedAt).toLocaleString('en-KE')}`, 9);
  y += 2;

  addSection('1. Importer Details');
  addField('Importer', d.importerName);
  addField('Address', d.importerAddress);
  addField('Bank (L/C)', d.bankName);
  addField('IDF No.', d.idfNo);
  addField('UCR No.', d.ucrNo);
  addField('Supplier', d.supplierName);
  addField('Proforma Invoice No.', d.proformaInvoiceNo);

  addSection('2. Cargo Details');
  addField('Items', d.itemsImported);
  addField('Quantity', d.quantity);
  addField(
    'Packing',
    d.packingType === 'Other' ? d.packingTypeOther : d.packingType,
  );
  addField('Containerized / Loose', d.containerizedOrLoose);

  addSection('3. Valuation');
  addField('Currency', currencyLabel);
  addField('FOB Price', formatAmount(totalValue > 0 ? parseFloat(d.fobPrice.replace(/,/g, '')) || 0 : 0));
  addField('Freight', d.freight);
  addField('Duty', d.duty);
  addField('IDF & RDL', d.idfRdlCharges);
  addField('Clearing & Forwarding', d.clearingCharges);
  addField('Mark-up', d.markup);
  addField('Exchange Rate', d.exchangeRate);
  addLine(
    `Total (${currencyLabel}): ${formatAmount(totalValue)}`,
    10,
    true,
    BRAND_GREEN,
  );
  addLine(`Converted Value: ${formatAmount(convertedValue)}`, 10, true, BRAND_GREEN);

  addSection('4. Shipment Details');
  addField('Mode', d.shipmentMode);
  addField('Place of Loading', d.placeOfLoading);
  addField('Transshipment', d.transshipmentAt);
  addField('Port of Clearance', d.portOfClearance);
  addField('Cover Required Up To', d.coverRequiredUpTo);
  addField('B/L or AWB No.', d.billOfLadingNo);
  addField('Container No(s)', d.containerNos);
  addField('Marks & Numbers', d.marksAndNumbers);
  addField('Vessel / Flight', d.vesselOrFlight);
  addField('Est. Arrival', d.estimatedArrival);

  addSection('5. Clearing Agent');
  addField('Agent', d.clearingAgentName);
  addField('Contact Person', d.clearingAgentContact);
  addField('Phone', d.clearingAgentPhone);

  addSection('6. Insurance Reference');
  addField(
    'Underwriter',
    d.underwriter === 'Other' ? d.underwriterOther : d.underwriter,
  );
  addField('Open Policy No.', d.openPolicyNo);

  y = 285;
  doc.setFontSize(7);
  doc.setTextColor(BRAND_CHARCOAL);
  doc.text(
    'ADT Insurance Agency Ltd | 0711 533 245 / 0785 227 772 | info@adtinsurance.co.ke',
    margin,
    y,
  );

  doc.save(`Marine-Cover-Note-${referenceNumber}.pdf`);
}
