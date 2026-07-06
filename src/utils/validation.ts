import type { FormData, FormErrors } from '../types';
import { parseAmount } from './format';

const PHONE_REGEX = /^(\+?254|0)[17]\d{8}$/;

function isValidPhone(phone: string): boolean {
  if (!phone.trim()) return true;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return PHONE_REGEX.test(cleaned);
}

function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

function isValidAmount(value: string, required = false): boolean {
  if (!value.trim()) return !required;
  const num = parseAmount(value);
  return !isNaN(num) && num >= 0;
}

export function validateForm(data: FormData): FormErrors {
  const errors: FormErrors = {};

  if (!data.importerName.trim()) errors.importerName = 'Importer name is required';
  if (!data.importerAddress.trim()) errors.importerAddress = 'Address is required';
  if (!data.supplierName.trim()) errors.supplierName = 'Supplier name is required';
  if (!data.proformaInvoiceNo.trim()) errors.proformaInvoiceNo = 'Proforma invoice number is required';

  if (!data.itemsImported.trim()) errors.itemsImported = 'Items being imported is required';
  if (!data.quantity.trim()) errors.quantity = 'Quantity is required';
  if (data.packingType === 'Other' && !data.packingTypeOther.trim()) {
    errors.packingTypeOther = 'Please specify packing type';
  }

  if (!isValidAmount(data.fobPrice, true)) errors.fobPrice = 'Valid FOB price is required';
  if (!isValidAmount(data.freight)) errors.freight = 'Enter a valid amount or 0';
  if (!isValidAmount(data.duty)) errors.duty = 'Enter a valid amount or 0';
  if (!isValidAmount(data.idfRdlCharges)) errors.idfRdlCharges = 'Enter a valid amount';
  if (!isValidAmount(data.clearingCharges)) errors.clearingCharges = 'Enter a valid amount or 0';
  if (!isValidAmount(data.markup)) errors.markup = 'Enter a valid amount or 0';
  if (!isValidAmount(data.exchangeRate, true) || parseAmount(data.exchangeRate) <= 0) {
    errors.exchangeRate = 'Valid exchange rate is required';
  }
  if (data.currency === 'OTHER' && !data.currencyOther.trim()) {
    errors.currencyOther = 'Please specify currency';
  }

  if (!data.placeOfLoading.trim()) errors.placeOfLoading = 'Port of loading is required';
  if (!data.portOfClearance.trim()) errors.portOfClearance = 'Port of clearance is required';
  if (!data.coverRequiredUpTo.trim()) errors.coverRequiredUpTo = 'Final destination is required';
  if (!data.billOfLadingNo.trim()) errors.billOfLadingNo = 'Bill of Lading / AWB number is required';
  if (!data.vesselOrFlight.trim()) errors.vesselOrFlight = 'Vessel name / flight number is required';
  if (!data.estimatedArrival.trim()) {
    errors.estimatedArrival = 'Estimated arrival date is required';
  } else if (!isValidDate(data.estimatedArrival)) {
    errors.estimatedArrival = 'Enter a valid date';
  }

  if (!data.clearingAgentName.trim()) errors.clearingAgentName = 'Clearing agent name is required';
  if (!isValidPhone(data.clearingAgentPhone)) {
    errors.clearingAgentPhone = 'Enter a valid Kenyan phone number (e.g. 0711533245)';
  }

  if (!data.underwriter.trim()) {
    errors.underwriter = 'Insurance company is required';
  } else if (data.underwriter === 'Other' && !data.underwriterOther.trim()) {
    errors.underwriterOther = 'Please specify underwriter name';
  }

  return errors;
}

export function getInitialFormData(): FormData {
  return {
    importerName: '',
    importerAddress: '',
    bankName: '',
    idfNo: '',
    ucrNo: '',
    supplierName: '',
    proformaInvoiceNo: '',

    itemsImported: '',
    quantity: '',
    packingType: 'Cartons',
    packingTypeOther: '',
    containerizedOrLoose: 'Containerized',

    currency: 'USD',
    currencyOther: '',
    fobPrice: '',
    freight: '0',
    duty: '0',
    idfRdlCharges: '0',
    clearingCharges: '0',
    markup: '0',
    exchangeRate: '',

    shipmentMode: 'Sea',
    placeOfLoading: '',
    countryOfOrigin: '',
    transshipmentAt: 'None',
    portOfClearance: '',
    coverRequiredUpTo: '',
    billOfLadingNo: '',
    containerNos: '',
    marksAndNumbers: '',
    vesselOrFlight: '',
    estimatedArrival: '',

    clearingAgentName: '',
    clearingAgentContact: '',
    clearingAgentPhone: '',

    underwriter: '',
    underwriterOther: '',
    openPolicyNo: '',
  };
}
