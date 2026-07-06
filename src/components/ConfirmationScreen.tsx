import type { SubmissionResult } from '../types';
import { formatAmount } from '../utils/format';
import { generatePdf } from '../utils/pdf';

interface Props {
  submission: SubmissionResult;
  onNewApplication: () => void;
}

export function ConfirmationScreen({ submission, onNewApplication }: Props) {
  const { referenceNumber, formData, totalValue, convertedValue, currencyLabel } = submission;

  return (
    <div className="confirmation" role="status" aria-live="polite">
      <div className="confirmation__icon" aria-hidden="true">✓</div>
      <h2>Application Submitted Successfully</h2>
      <p className="confirmation__lead">
        Thank you, <strong>{formData.importerName}</strong>. Your marine cover note application
        has been received.
      </p>

      <div className="confirmation__reference">
        <span className="confirmation__ref-label">Your Reference Number</span>
        <span className="confirmation__ref-value">{referenceNumber}</span>
      </div>

      <p className="confirmation__message">
        ADT Insurance Agency will review your submission and send your cover note shortly.
        Please save your reference number for follow-up.
      </p>

      <div className="confirmation__summary">
        <div className="summary-row">
          <span>Total Value ({currencyLabel})</span>
          <strong>{formatAmount(totalValue)}</strong>
        </div>
        <div className="summary-row">
          <span>Converted Value</span>
          <strong>{formatAmount(convertedValue)}</strong>
        </div>
        <div className="summary-row">
          <span>Proforma Invoice</span>
          <strong>{formData.proformaInvoiceNo}</strong>
        </div>
        <div className="summary-row">
          <span>B/L or AWB No.</span>
          <strong>{formData.billOfLadingNo}</strong>
        </div>
      </div>

      <div className="confirmation__actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => generatePdf(submission)}
        >
          Download PDF Summary
        </button>
        <button type="button" className="btn btn--primary" onClick={onNewApplication}>
          Submit Another Application
        </button>
      </div>
    </div>
  );
}
