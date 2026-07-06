export type Currency = 'KES' | 'USD' | 'OTHER';

export type PackingType = 'Loose' | 'Palletized' | 'Cartons' | 'Crates' | 'Other';

export type ShipmentMode = 'Sea' | 'Air' | 'Road' | 'Rail';

export type ContainerType = 'Containerized' | 'Loose';

export interface FormData {
  // Importer Details
  importerName: string;
  importerAddress: string;
  bankName: string;
  idfNo: string;
  ucrNo: string;
  supplierName: string;
  proformaInvoiceNo: string;

  // Cargo Details
  itemsImported: string;
  quantity: string;
  packingType: PackingType;
  packingTypeOther: string;
  containerizedOrLoose: ContainerType;

  // Valuation
  currency: Currency;
  currencyOther: string;
  fobPrice: string;
  freight: string;
  duty: string;
  idfRdlCharges: string;
  idfRdlOverridden: boolean;
  clearingCharges: string;
  markup: string;
  exchangeRate: string;

  // Shipment Details
  shipmentMode: ShipmentMode;
  placeOfLoading: string;
  transshipmentAt: string;
  portOfClearance: string;
  coverRequiredUpTo: string;
  billOfLadingNo: string;
  containerNos: string;
  marksAndNumbers: string;
  vesselOrFlight: string;
  estimatedArrival: string;

  // Clearing Agent
  clearingAgentName: string;
  clearingAgentContact: string;
  clearingAgentPhone: string;

  // Insurance Reference
  underwriter: string;
  underwriterOther: string;
  openPolicyNo: string;
}

export type FormErrors = Partial<Record<keyof FormData, string>>;

export interface SubmissionResult {
  referenceNumber: string;
  submittedAt: string;
  formData: FormData;
  totalValue: number;
  convertedValue: number;
  currencyLabel: string;
}
