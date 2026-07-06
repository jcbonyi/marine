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
  countryOfOrigin: string;
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

export type DocumentKey = 'proformaInvoice' | 'idf' | 'billOfLading' | 'packingList';

export interface FormDocuments {
  proformaInvoice: File | null;
  idf: File | null;
  billOfLading: File | null;
  packingList: File | null;
}

export type FormDocumentErrors = Partial<Record<DocumentKey, string>>;

export interface UploadedDocumentInfo {
  name: string;
  size: number;
  type: string;
}

export interface SubmissionDocuments {
  proformaInvoice: UploadedDocumentInfo | null;
  idf: UploadedDocumentInfo | null;
  billOfLading: UploadedDocumentInfo | null;
  packingList: UploadedDocumentInfo | null;
}

export interface SubmissionResult {
  referenceNumber: string;
  submittedAt: string;
  formData: FormData;
  documents: SubmissionDocuments;
  totalValue: number;
  convertedValue: number;
  currencyLabel: string;
}
