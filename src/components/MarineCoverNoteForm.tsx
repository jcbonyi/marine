import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent, type ReactElement, type ReactNode } from 'react';
import type { FormData, FormErrors, SubmissionResult } from '../types';
import { calculateTotals } from '../utils/calculations';
import { formatAmount, formatInputDisplay, getCurrencyLabel } from '../utils/format';
import { generatePdf } from '../utils/pdf';
import { buildSubmission, submitForm } from '../utils/submit';
import { getInitialFormData, validateForm } from '../utils/validation';
import { ConfirmationScreen } from './ConfirmationScreen';
import '../MarineCoverNoteForm.css';

const UNDERWRITERS = [
  'Jubilee Insurance',
  'CIC Insurance Group',
  'Britam Insurance',
  'Madison Insurance',
  'APA Insurance',
  'Sanlam Kenya',
  'Kenya Reinsurance Corporation',
  'AAR Insurance',
  'UAP Old Mutual',
  'First Assurance',
  'Other',
];

const PACKING_TYPES = ['Loose', 'Palletized', 'Cartons', 'Crates', 'Other'] as const;
const SHIPMENT_MODES = ['Sea', 'Air', 'Road', 'Rail'] as const;

export function MarineCoverNoteForm() {
  const [formData, setFormData] = useState<FormData>(getInitialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submission, setSubmission] = useState<SubmissionResult | null>(null);

  const totals = calculateTotals(formData);
  const currencyLabel = getCurrencyLabel(formData.currency, formData.currencyOther);

  useEffect(() => {
    if (!formData.idfRdlOverridden) {
      const auto = totals.autoIdfRdl;
      setFormData((prev) => ({
        ...prev,
        idfRdlCharges: formatAmount(auto),
      }));
    }
  }, [formData.fobPrice, formData.freight, formData.idfRdlOverridden, totals.autoIdfRdl]);

  const updateField = useCallback(
    (field: keyof FormData, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (typeof value === 'string' && errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors],
  );

  const handleAmountChange = (field: keyof FormData) => (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputDisplay(e.target.value);
    updateField(field, formatted);
  };

  const handleBlur = (field: keyof FormData) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const showError = (field: keyof FormData) =>
    (touched[field] || submitting) && errors[field] ? errors[field] : undefined;

  const handleIdfRdlChange = (e: ChangeEvent<HTMLInputElement>) => {
    updateField('idfRdlOverridden', true);
    handleAmountChange('idfRdlCharges')(e);
  };

  const resetIdfRdl = () => {
    updateField('idfRdlOverridden', false);
    updateField('idfRdlCharges', formatAmount(totals.autoIdfRdl));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    const validationErrors = validateForm(formData);
    setErrors(validationErrors);
    setTouched(
      Object.keys(formData).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof FormData, boolean>>,
      ),
    );

    if (Object.keys(validationErrors).length > 0) {
      const firstError = document.querySelector('[aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const result = buildSubmission(formData);
      await submitForm(result);
      setSubmission(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Submission failed. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submission) {
    return (
      <div className="app">
        <Header />
        <main className="main">
          <ConfirmationScreen
            submission={submission}
            onNewApplication={() => {
              setSubmission(null);
              setFormData(getInitialFormData());
              setErrors({});
              setTouched({});
            }}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="form-intro">
          <h1>Marine Cover Note Application</h1>
          <p>
            Complete this form to submit your marine cargo declaration for cover note issuance.
            Fields marked with <span className="required-mark">*</span> are required.
          </p>
        </div>

        <form className="marine-form" onSubmit={handleSubmit} noValidate>
          {/* Section 1 */}
          <fieldset className="form-section">
            <legend>1. Importer Details</legend>
            <div className="form-grid">
              <FormField
                label="Name of importer"
                required
                error={showError('importerName')}
              >
                <input
                  id="importerName"
                  type="text"
                  value={formData.importerName}
                  onChange={(e) => updateField('importerName', e.target.value)}
                  onBlur={handleBlur('importerName')}
                  aria-invalid={!!showError('importerName')}
                />
              </FormField>

              <FormField
                label="Address"
                required
                fullWidth
                error={showError('importerAddress')}
              >
                <textarea
                  id="importerAddress"
                  rows={3}
                  value={formData.importerAddress}
                  onChange={(e) => updateField('importerAddress', e.target.value)}
                  onBlur={handleBlur('importerAddress')}
                  aria-invalid={!!showError('importerAddress')}
                />
              </FormField>

              <FormField label="Name of bank (if Letter of Credit)">
                <input
                  id="bankName"
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => updateField('bankName', e.target.value)}
                />
              </FormField>

              <FormField label="IDF No.">
                <input
                  id="idfNo"
                  type="text"
                  value={formData.idfNo}
                  onChange={(e) => updateField('idfNo', e.target.value)}
                />
              </FormField>

              <FormField label="UCR No.">
                <input
                  id="ucrNo"
                  type="text"
                  value={formData.ucrNo}
                  onChange={(e) => updateField('ucrNo', e.target.value)}
                />
              </FormField>

              <FormField label="Name of supplier" required error={showError('supplierName')}>
                <input
                  id="supplierName"
                  type="text"
                  value={formData.supplierName}
                  onChange={(e) => updateField('supplierName', e.target.value)}
                  onBlur={handleBlur('supplierName')}
                  aria-invalid={!!showError('supplierName')}
                />
              </FormField>

              <FormField
                label="Proforma invoice no."
                required
                error={showError('proformaInvoiceNo')}
              >
                <input
                  id="proformaInvoiceNo"
                  type="text"
                  value={formData.proformaInvoiceNo}
                  onChange={(e) => updateField('proformaInvoiceNo', e.target.value)}
                  onBlur={handleBlur('proformaInvoiceNo')}
                  aria-invalid={!!showError('proformaInvoiceNo')}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Section 2 */}
          <fieldset className="form-section">
            <legend>2. Cargo Details</legend>
            <div className="form-grid">
              <FormField
                label="Items being imported"
                required
                fullWidth
                error={showError('itemsImported')}
              >
                <textarea
                  id="itemsImported"
                  rows={3}
                  value={formData.itemsImported}
                  onChange={(e) => updateField('itemsImported', e.target.value)}
                  onBlur={handleBlur('itemsImported')}
                  aria-invalid={!!showError('itemsImported')}
                />
              </FormField>

              <FormField label="Quantity" required error={showError('quantity')}>
                <input
                  id="quantity"
                  type="text"
                  placeholder="e.g. 61 PCS"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', e.target.value)}
                  onBlur={handleBlur('quantity')}
                  aria-invalid={!!showError('quantity')}
                />
              </FormField>

              <FormField label="Type of packing">
                <select
                  id="packingType"
                  value={formData.packingType}
                  onChange={(e) => updateField('packingType', e.target.value)}
                >
                  {PACKING_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </FormField>

              {formData.packingType === 'Other' && (
                <FormField label="Specify packing type" error={showError('packingTypeOther')}>
                  <input
                    id="packingTypeOther"
                    type="text"
                    value={formData.packingTypeOther}
                    onChange={(e) => updateField('packingTypeOther', e.target.value)}
                    onBlur={handleBlur('packingTypeOther')}
                    aria-invalid={!!showError('packingTypeOther')}
                  />
                </FormField>
              )}

              <FormField label="Containerized or loose?" fullWidth>
                <div className="radio-group" role="radiogroup" aria-label="Containerized or loose">
                  {(['Containerized', 'Loose'] as const).map((opt) => (
                    <label key={opt} className="radio-label">
                      <input
                        type="radio"
                        name="containerizedOrLoose"
                        value={opt}
                        checked={formData.containerizedOrLoose === opt}
                        onChange={() => updateField('containerizedOrLoose', opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </FormField>
            </div>
          </fieldset>

          {/* Section 3 */}
          <fieldset className="form-section">
            <legend>3. Valuation of Consignment</legend>
            <div className="currency-bar">
              <FormField label="Currency">
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => updateField('currency', e.target.value)}
                >
                  <option value="KES">KES – Kenyan Shilling</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="OTHER">Other</option>
                </select>
              </FormField>
              {formData.currency === 'OTHER' && (
                <FormField label="Specify currency" error={showError('currencyOther')}>
                  <input
                    id="currencyOther"
                    type="text"
                    placeholder="e.g. EUR, ZMW"
                    value={formData.currencyOther}
                    onChange={(e) => updateField('currencyOther', e.target.value)}
                    onBlur={handleBlur('currencyOther')}
                    aria-invalid={!!showError('currencyOther')}
                  />
                </FormField>
              )}
            </div>

            <div className="form-grid">
              <FormField label={`FOB Price (${currencyLabel})`} required error={showError('fobPrice')}>
                <input
                  id="fobPrice"
                  type="text"
                  inputMode="decimal"
                  value={formData.fobPrice}
                  onChange={handleAmountChange('fobPrice')}
                  onBlur={handleBlur('fobPrice')}
                  aria-invalid={!!showError('fobPrice')}
                />
              </FormField>

              <FormField label={`Freight (${currencyLabel})`} error={showError('freight')}>
                <input
                  id="freight"
                  type="text"
                  inputMode="decimal"
                  value={formData.freight}
                  onChange={handleAmountChange('freight')}
                  onBlur={handleBlur('freight')}
                  aria-invalid={!!showError('freight')}
                />
              </FormField>

              <FormField label={`Duty (${currencyLabel})`} error={showError('duty')}>
                <input
                  id="duty"
                  type="text"
                  inputMode="decimal"
                  value={formData.duty}
                  onChange={handleAmountChange('duty')}
                  onBlur={handleBlur('duty')}
                  aria-invalid={!!showError('duty')}
                />
              </FormField>

              <FormField
                label={`IDF (2.25%) & RDL (1.5%) on C&F (${currencyLabel})`}
                hint={`C&F = ${formatAmount(totals.cfValue)}. Auto-calculated; editable.`}
                error={showError('idfRdlCharges')}
              >
                <div className="input-with-action">
                  <input
                    id="idfRdlCharges"
                    type="text"
                    inputMode="decimal"
                    value={formData.idfRdlCharges}
                    onChange={handleIdfRdlChange}
                    onBlur={handleBlur('idfRdlCharges')}
                    aria-invalid={!!showError('idfRdlCharges')}
                  />
                  {formData.idfRdlOverridden && (
                    <button type="button" className="btn-link" onClick={resetIdfRdl}>
                      Reset to auto
                    </button>
                  )}
                </div>
              </FormField>

              <FormField
                label={`Clearing & forwarding (${currencyLabel})`}
                error={showError('clearingCharges')}
              >
                <input
                  id="clearingCharges"
                  type="text"
                  inputMode="decimal"
                  value={formData.clearingCharges}
                  onChange={handleAmountChange('clearingCharges')}
                  onBlur={handleBlur('clearingCharges')}
                  aria-invalid={!!showError('clearingCharges')}
                />
              </FormField>

              <FormField label={`Mark-up (${currencyLabel})`} error={showError('markup')}>
                <input
                  id="markup"
                  type="text"
                  inputMode="decimal"
                  value={formData.markup}
                  onChange={handleAmountChange('markup')}
                  onBlur={handleBlur('markup')}
                  aria-invalid={!!showError('markup')}
                />
              </FormField>

              <FormField
                label="Exchange rate"
                required
                hint="Rate to convert total to local/other currency"
                error={showError('exchangeRate')}
              >
                <input
                  id="exchangeRate"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 129.50"
                  value={formData.exchangeRate}
                  onChange={handleAmountChange('exchangeRate')}
                  onBlur={handleBlur('exchangeRate')}
                  aria-invalid={!!showError('exchangeRate')}
                />
              </FormField>
            </div>

            <div className="totals-panel" aria-live="polite">
              <div className="totals-panel__row">
                <span>Total value (all-inclusive)</span>
                <strong>
                  {currencyLabel} {formatAmount(totals.totalValue)}
                </strong>
              </div>
              <div className="totals-panel__row totals-panel__row--converted">
                <span>Converted value (× exchange rate)</span>
                <strong>{formatAmount(totals.convertedValue)}</strong>
              </div>
            </div>
          </fieldset>

          {/* Section 4 */}
          <fieldset className="form-section">
            <legend>4. Shipment Details</legend>
            <div className="form-grid">
              <FormField label="Mode of shipment">
                <select
                  id="shipmentMode"
                  value={formData.shipmentMode}
                  onChange={(e) => updateField('shipmentMode', e.target.value)}
                >
                  {SHIPMENT_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                label="Place of loading"
                required
                error={showError('placeOfLoading')}
              >
                <input
                  id="placeOfLoading"
                  type="text"
                  value={formData.placeOfLoading}
                  onChange={(e) => updateField('placeOfLoading', e.target.value)}
                  onBlur={handleBlur('placeOfLoading')}
                  aria-invalid={!!showError('placeOfLoading')}
                />
              </FormField>

              <FormField label="Transshipment at, if any">
                <input
                  id="transshipmentAt"
                  type="text"
                  value={formData.transshipmentAt}
                  onChange={(e) => updateField('transshipmentAt', e.target.value)}
                />
              </FormField>

              <FormField
                label="Port of clearance"
                required
                error={showError('portOfClearance')}
              >
                <input
                  id="portOfClearance"
                  type="text"
                  value={formData.portOfClearance}
                  onChange={(e) => updateField('portOfClearance', e.target.value)}
                  onBlur={handleBlur('portOfClearance')}
                  aria-invalid={!!showError('portOfClearance')}
                />
              </FormField>

              <FormField
                label="Cover required up to (final destination)"
                required
                error={showError('coverRequiredUpTo')}
              >
                <input
                  id="coverRequiredUpTo"
                  type="text"
                  value={formData.coverRequiredUpTo}
                  onChange={(e) => updateField('coverRequiredUpTo', e.target.value)}
                  onBlur={handleBlur('coverRequiredUpTo')}
                  aria-invalid={!!showError('coverRequiredUpTo')}
                />
              </FormField>

              <FormField
                label="Bill of Lading / Airway Bill no."
                required
                error={showError('billOfLadingNo')}
              >
                <input
                  id="billOfLadingNo"
                  type="text"
                  value={formData.billOfLadingNo}
                  onChange={(e) => updateField('billOfLadingNo', e.target.value)}
                  onBlur={handleBlur('billOfLadingNo')}
                  aria-invalid={!!showError('billOfLadingNo')}
                />
              </FormField>

              <FormField label="Container no/s" hint="Comma-separated if multiple">
                <input
                  id="containerNos"
                  type="text"
                  placeholder="e.g. MSKU1234567, TCLU7654321"
                  value={formData.containerNos}
                  onChange={(e) => updateField('containerNos', e.target.value)}
                />
              </FormField>

              <FormField label="Marks & numbers">
                <input
                  id="marksAndNumbers"
                  type="text"
                  value={formData.marksAndNumbers}
                  onChange={(e) => updateField('marksAndNumbers', e.target.value)}
                />
              </FormField>

              <FormField
                label="Vessel name / flight no."
                required
                error={showError('vesselOrFlight')}
              >
                <input
                  id="vesselOrFlight"
                  type="text"
                  value={formData.vesselOrFlight}
                  onChange={(e) => updateField('vesselOrFlight', e.target.value)}
                  onBlur={handleBlur('vesselOrFlight')}
                  aria-invalid={!!showError('vesselOrFlight')}
                />
              </FormField>

              <FormField
                label="Estimated date of arrival"
                required
                error={showError('estimatedArrival')}
              >
                <input
                  id="estimatedArrival"
                  type="date"
                  value={formData.estimatedArrival}
                  onChange={(e) => updateField('estimatedArrival', e.target.value)}
                  onBlur={handleBlur('estimatedArrival')}
                  aria-invalid={!!showError('estimatedArrival')}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Section 5 */}
          <fieldset className="form-section">
            <legend>5. Clearing Agent</legend>
            <div className="form-grid">
              <FormField
                label="Name of clearing agent"
                required
                error={showError('clearingAgentName')}
              >
                <input
                  id="clearingAgentName"
                  type="text"
                  value={formData.clearingAgentName}
                  onChange={(e) => updateField('clearingAgentName', e.target.value)}
                  onBlur={handleBlur('clearingAgentName')}
                  aria-invalid={!!showError('clearingAgentName')}
                />
              </FormField>

              <FormField label="Contact person">
                <input
                  id="clearingAgentContact"
                  type="text"
                  value={formData.clearingAgentContact}
                  onChange={(e) => updateField('clearingAgentContact', e.target.value)}
                />
              </FormField>

              <FormField label="Contact number" error={showError('clearingAgentPhone')}>
                <input
                  id="clearingAgentPhone"
                  type="tel"
                  placeholder="e.g. 0711533245"
                  value={formData.clearingAgentPhone}
                  onChange={(e) => updateField('clearingAgentPhone', e.target.value)}
                  onBlur={handleBlur('clearingAgentPhone')}
                  aria-invalid={!!showError('clearingAgentPhone')}
                />
              </FormField>
            </div>
          </fieldset>

          {/* Section 6 */}
          <fieldset className="form-section">
            <legend>6. Insurance Reference</legend>
            <div className="form-grid">
              <FormField
                label="Name of Insurance Co. (underwriter)"
                required
                error={showError('underwriter') || showError('underwriterOther')}
              >
                <select
                  id="underwriter"
                  value={formData.underwriter}
                  onChange={(e) => updateField('underwriter', e.target.value)}
                  onBlur={handleBlur('underwriter')}
                  aria-invalid={!!(showError('underwriter') || showError('underwriterOther'))}
                >
                  <option value="">— Select underwriter —</option>
                  {UNDERWRITERS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </FormField>

              {formData.underwriter === 'Other' && (
                <FormField label="Specify underwriter" error={showError('underwriterOther')}>
                  <input
                    id="underwriterOther"
                    type="text"
                    value={formData.underwriterOther}
                    onChange={(e) => updateField('underwriterOther', e.target.value)}
                    onBlur={handleBlur('underwriterOther')}
                    aria-invalid={!!showError('underwriterOther')}
                  />
                </FormField>
              )}

              <FormField label="Marine Open Policy no." hint="If you have an existing open cover">
                <input
                  id="openPolicyNo"
                  type="text"
                  value={formData.openPolicyNo}
                  onChange={(e) => updateField('openPolicyNo', e.target.value)}
                />
              </FormField>

              <FormField label="Cover note #" hint="Assigned by ADT staff upon issuance">
                <input
                  id="coverNoteNo"
                  type="text"
                  value=""
                  readOnly
                  disabled
                  className="read-only"
                  aria-readonly="true"
                />
              </FormField>
            </div>
          </fieldset>

          {submitError && (
            <div className="form-error-banner" role="alert">
              {submitError}
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => generatePdf(buildSubmission(formData))}
            >
              Preview PDF
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <div className="logo-placeholder" aria-label="ADT Insurance Agency logo">
            <span className="logo-placeholder__text">ADT</span>
          </div>
          <div className="header__titles">
            <span className="header__company">ADT Insurance Agency Ltd</span>
            <span className="header__tagline">Redefining Standards</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <p className="footer__tagline">Redefining Standards</p>
        <p className="footer__contact">
          <a href="tel:+254711533245">0711 533 245</a>
          {' / '}
          <a href="tel:+254785227772">0785 227 772</a>
          {' | '}
          <a href="mailto:info@adtinsurance.co.ke">info@adtinsurance.co.ke</a>
        </p>
        <p className="footer__address">
          3rd Floor, Kilindini Plaza, Moi Avenue, Mombasa
        </p>
        <p className="footer__copy">
          &copy; {new Date().getFullYear()} ADT Insurance Agency Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  fullWidth?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}

function FormField({ label, required, fullWidth, hint, error, children }: FormFieldProps) {
  const child = children as ReactElement<{ id?: string }>;
  const id = child.props.id;

  return (
    <div className={`form-field${fullWidth ? ' form-field--full' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="required-mark" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <span className="form-hint">{hint}</span>}
      {error && (
        <span className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
