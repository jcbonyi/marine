import type { FormDocuments, SubmissionResult } from '../types';
import { calculateTotals } from './calculations';
import { toSubmissionDocuments } from './documents';
import { buildPdfBytes } from './pdf';
import { generateReferenceNumber, getCurrencyLabel } from './format';

const RECIPIENTS = [
  'underwriting@adtinsurance.co.ke',
  'info@adtinsurance.co.ke',
  'fc@adtinsurance.co.ke',
  'aisha@adtinsurance.co.ke',
  'zafir@adtinsurance.co.ke',
];

function getSubmitEndpoint(): string | undefined {
  const configured = import.meta.env.VITE_SUBMIT_URL as string | undefined;
  if (configured) return configured;
  if (import.meta.env.PROD) return '/api/submit';
  return undefined;
}

export async function submitForm(
  result: SubmissionResult,
  documents: FormDocuments,
): Promise<void> {
  const endpoint = getSubmitEndpoint();

  const payload = {
    ...result,
    recipients: RECIPIENTS,
    subject: `Marine Cover Note Application – ${result.referenceNumber}`,
  };

  if (!endpoint) {
    console.info('Form submission (no submit endpoint configured):', payload);
    await simulateNetworkDelay();
    return;
  }

  const pdfBytes = await buildPdfBytes(result, documents);
  const body = new FormData();
  body.append('payload', JSON.stringify(payload));
  body.append(
    'applicationSummary',
    new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' }),
    `Marine-Cover-Note-${result.referenceNumber}.pdf`,
  );

  (Object.entries(documents) as [keyof FormDocuments, File | null][]).forEach(([key, file]) => {
    if (file) body.append(key, file, file.name);
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    body,
  });

  if (!response.ok) {
    throw new Error(`Submission failed (${response.status}). Please try again or contact ADT.`);
  }
}

function simulateNetworkDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 800));
}

export function buildSubmission(
  formData: SubmissionResult['formData'],
  documents: FormDocuments,
): SubmissionResult {
  const totals = calculateTotals(formData);
  const currencyLabel = getCurrencyLabel(formData.currency, formData.currencyOther);

  return {
    referenceNumber: generateReferenceNumber(),
    submittedAt: new Date().toISOString(),
    formData,
    documents: toSubmissionDocuments(documents),
    totalValue: totals.totalValue,
    convertedValue: totals.convertedValue,
    currencyLabel,
  };
}
