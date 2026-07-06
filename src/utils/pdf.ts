import { jsPDF } from 'jspdf';
import type { SubmissionResult } from '../types';
import { DOCUMENT_LABELS } from './documents';
import { formatAmount } from './format';
import adtLogoUrl from '../assets/adt-logo.png';

const BRAND_TEAL = '#1496BE';
const BRAND_GREEN = '#8CB450';
const BRAND_CHARCOAL = '#464646';
const LOGO_ASPECT = 263 / 85;

async function loadImageDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function generatePdf(submission: SubmissionResult): Promise<void> {
  const logoData = await loadImageDataUrl(adtLogoUrl);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const { formData: d, documents, referenceNumber, submittedAt, totalValue, convertedValue, currencyLabel } =
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
  const logoHeight = 18;
  const logoWidth = logoHeight * LOGO_ASPECT;
  const headerHeight = 28;

  doc.setFillColor(BRAND_TEAL);
  doc.rect(0, 0, 210, headerHeight, 'F');
  doc.setFillColor('#ffffff');
  doc.rect(margin, 4, logoWidth + 4, logoHeight + 4, 'F');
  doc.addImage(logoData, 'PNG', margin + 2, 5, logoWidth, logoHeight);

  const titleX = margin + logoWidth + 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor('#ffffff');
  doc.text('Marine Cover Note Application', titleX, 16);

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
  addField('Country of Origin', d.countryOfOrigin);
  addField('Port of Loading', d.placeOfLoading);
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

  addSection('7. Supporting Documents');
  (Object.keys(DOCUMENT_LABELS) as Array<keyof typeof DOCUMENT_LABELS>).forEach((key) => {
    const file = documents[key];
    addLine(`${DOCUMENT_LABELS[key]}: ${file ? file.name : 'Not uploaded'}`, 9);
  });

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
