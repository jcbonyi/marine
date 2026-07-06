import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { DocumentKey, FormDocuments } from '../types';
import { DOCUMENT_LABELS } from './documents';

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 50;

function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

function isImageFile(file: File): boolean {
  return (
    file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name)
  );
}

async function fileToPngBytes(file: File): Promise<Uint8Array> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to prepare image for PDF export');

  context.drawImage(bitmap, 0, 0);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) resolve(value);
      else reject(new Error('Unable to convert image for PDF export'));
    }, 'image/png');
  });

  return new Uint8Array(await blob.arrayBuffer());
}

async function embedImageFile(pdf: PDFDocument, file: File, label: string): Promise<void> {
  const bytes = await file.arrayBuffer();
  let image;

  if (file.type === 'image/png' || file.name.toLowerCase().endsWith('.png')) {
    image = await pdf.embedPng(bytes);
  } else if (
    file.type === 'image/jpeg' ||
    file.type === 'image/jpg' ||
    /\.(jpe?g)$/i.test(file.name)
  ) {
    image = await pdf.embedJpg(bytes);
  } else {
    image = await pdf.embedPng(await fileToPngBytes(file));
  }

  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  await drawDocumentHeader(pdf, page, label, file.name);

  const maxWidth = A4_WIDTH - MARGIN * 2;
  const maxHeight = A4_HEIGHT - 130;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;

  page.drawImage(image, {
    x: MARGIN,
    y: A4_HEIGHT - 110 - height,
    width,
    height,
  });
}

async function embedPdfFile(pdf: PDFDocument, file: File, label: string): Promise<void> {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const pageCount = source.getPageCount();

  if (pageCount === 0) {
    await addPlaceholderPage(pdf, label, file, 'PDF file contained no pages.');
    return;
  }

  const intro = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  await drawDocumentHeader(pdf, intro, label, file.name);
  intro.drawText(`Included pages: ${pageCount}`, {
    x: MARGIN,
    y: A4_HEIGHT - 110,
    size: 11,
    color: rgb(0.27, 0.27, 0.27),
  });

  const copiedPages = await pdf.copyPages(source, source.getPageIndices());
  copiedPages.forEach((page) => pdf.addPage(page));
}

async function drawDocumentHeader(
  pdf: PDFDocument,
  page: PDFPage,
  label: string,
  fileName: string,
): Promise<void> {
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);

  page.drawText('Supporting Document', {
    x: MARGIN,
    y: A4_HEIGHT - 55,
    size: 10,
    font: regular,
    color: rgb(0.08, 0.59, 0.75),
  });
  page.drawText(label, {
    x: MARGIN,
    y: A4_HEIGHT - 75,
    size: 14,
    font,
    color: rgb(0.27, 0.27, 0.27),
  });
  page.drawText(fileName, {
    x: MARGIN,
    y: A4_HEIGHT - 95,
    size: 10,
    font: regular,
    color: rgb(0.42, 0.42, 0.42),
  });
}

async function addPlaceholderPage(
  pdf: PDFDocument,
  label: string,
  file: File,
  note: string,
): Promise<void> {
  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  await drawDocumentHeader(pdf, page, label, file.name);

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText(note, {
    x: MARGIN,
    y: A4_HEIGHT - 120,
    size: 11,
    font: regular,
    color: rgb(0.27, 0.27, 0.27),
  });
  page.drawText('The original file is attached to the submission email.', {
    x: MARGIN,
    y: A4_HEIGHT - 140,
    size: 10,
    font: regular,
    color: rgb(0.42, 0.42, 0.42),
  });
}

export async function appendDocumentsToPdf(
  summaryBytes: Uint8Array,
  documents: FormDocuments,
): Promise<Uint8Array> {
  const hasDocuments = Object.values(documents).some(Boolean);
  if (!hasDocuments) return summaryBytes;

  const pdf = await PDFDocument.load(summaryBytes);
  const keys = Object.keys(DOCUMENT_LABELS) as DocumentKey[];

  for (const key of keys) {
    const file = documents[key];
    if (!file) continue;

    const label = DOCUMENT_LABELS[key];

    try {
      if (isImageFile(file)) {
        await embedImageFile(pdf, file, label);
      } else if (isPdfFile(file)) {
        await embedPdfFile(pdf, file, label);
      } else {
        await addPlaceholderPage(
          pdf,
          label,
          file,
          'This document type is included as an email attachment.',
        );
      }
    } catch {
      await addPlaceholderPage(
        pdf,
        label,
        file,
        'Unable to render this document inside the PDF summary.',
      );
    }
  }

  return pdf.save();
}
