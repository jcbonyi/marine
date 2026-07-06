import type { SubmissionResult } from '../types';
import { calculateTotals } from './calculations';
import { generateReferenceNumber, getCurrencyLabel } from './format';

const RECIPIENTS = [
  'underwriting@adtinsurance.co.ke',
  'info@adtinsurance.co.ke',
  'fc@adtinsurance.co.ke',
  'aisha@adtinsurance.co.ke',
  'zafir@adtinsurance.co.ke',
];

export async function submitForm(result: SubmissionResult): Promise<void> {
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

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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
): SubmissionResult {
  const totals = calculateTotals(formData);
  const currencyLabel = getCurrencyLabel(formData.currency, formData.currencyOther);

  return {
    referenceNumber: generateReferenceNumber(),
    submittedAt: new Date().toISOString(),
    formData,
    totalValue: totals.totalValue,
    convertedValue: totals.convertedValue,
    currencyLabel,
  };
}
