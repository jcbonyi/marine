import type { DocumentKey, FormDocumentErrors, FormDocuments, SubmissionDocuments } from '../types';

export const DOCUMENT_LABELS: Record<DocumentKey, string> = {
  proformaInvoice: 'Proforma Invoice',
  idf: 'IDF',
  billOfLading: 'Bill of Lading',
  packingList: 'Packing List',
};

export const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp';

const ACCEPTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const ACCEPTED_EXTENSIONS = new Set(['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.webp']);

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function getInitialDocuments(): FormDocuments {
  return {
    proformaInvoice: null,
    idf: null,
    billOfLading: null,
    packingList: null,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  const index = name.lastIndexOf('.');
  return index >= 0 ? name.slice(index).toLowerCase() : '';
}

export function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.has(file.type)) return true;
  return ACCEPTED_EXTENSIONS.has(getFileExtension(file.name));
}

export function validateDocumentFile(file: File | null): string | undefined {
  if (!file) return undefined;
  if (!isAcceptedFile(file)) {
    return 'Upload a PDF, Word document, or image (JPG, PNG, WEBP)';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File must be ${formatFileSize(MAX_FILE_SIZE_BYTES)} or smaller`;
  }
  return undefined;
}

export function validateDocuments(documents: FormDocuments): FormDocumentErrors {
  const errors: FormDocumentErrors = {};

  (Object.keys(DOCUMENT_LABELS) as DocumentKey[]).forEach((key) => {
    const error = validateDocumentFile(documents[key]);
    if (error) errors[key] = error;
  });

  return errors;
}

export function toSubmissionDocuments(documents: FormDocuments): SubmissionDocuments {
  const toInfo = (file: File | null) =>
    file ? { name: file.name, size: file.size, type: file.type || 'application/octet-stream' } : null;

  return {
    proformaInvoice: toInfo(documents.proformaInvoice),
    idf: toInfo(documents.idf),
    billOfLading: toInfo(documents.billOfLading),
    packingList: toInfo(documents.packingList),
  };
}

export function hasUploadedDocuments(documents: SubmissionDocuments): boolean {
  return Object.values(documents).some(Boolean);
}
