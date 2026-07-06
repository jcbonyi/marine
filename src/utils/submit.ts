import type { FormDocuments, SubmissionResult } from '../types';
import { calculateTotals } from './calculations';
import { toSubmissionDocuments } from './documents';
import { generateReferenceNumber, getCurrencyLabel } from './format';

const RECIPIENTS = [
  'underwriting@adtinsurance.co.ke',
  'info@adtinsurance.co.ke',
  'fc@adtinsurance.co.ke',
  'aisha@adtinsurance.co.ke',
  'zafir@adtinsurance.co.ke',
];

export async function submitForm(
  result: SubmissionResult,
  documents: FormDocuments,
): Promise<void> {
  const endpoint = import.meta.env.VITE_SUBMIT_URL as string | undefined;

  const payload = {
    ...result,
    recipients: RECIPIENTS,
    subject: `Marine Cover Note Application – ${result.referenceNumber}`,
  };

  if (!endpoint) {
    console.info('Form submission (no VITE_SUBMIT_URL configured):', payload);
    await simulateNetworkDelay();
    return;
  }

  const hasFiles = Object.values(documents).some(Boolean);
  let response: Response;

  if (hasFiles) {
    const body = new FormData();
    body.append('payload', JSON.stringify(payload));

    (Object.entries(documents) as [keyof FormDocuments, File | null][]).forEach(([key, file]) => {
      if (file) body.append(key, file, file.name);
    });

    response = await fetch(endpoint, {
      method: 'POST',
      body,
    });
  } else {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }

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
