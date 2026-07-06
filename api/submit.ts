import type { VercelRequest, VercelResponse } from '@vercel/node';
import formidable, { type File as FormidableFile } from 'formidable';
import fs from 'node:fs/promises';
import nodemailer from 'nodemailer';

export const config = {
  api: {
    bodyParser: false,
  },
};

const DOCUMENT_LABELS = {
  proformaInvoice: 'Proforma Invoice',
  idf: 'IDF',
  billOfLading: 'Bill of Lading',
  packingList: 'Packing List',
} as const;

type DocumentKey = keyof typeof DOCUMENT_LABELS;

interface SubmissionPayload {
  referenceNumber: string;
  subject: string;
  recipients: string[];
  totalValue: number;
  convertedValue: number;
  currencyLabel: string;
  documents: Record<DocumentKey, { name: string } | null>;
  formData: {
    importerName: string;
    supplierName: string;
    proformaInvoiceNo: string;
    billOfLadingNo: string;
    countryOfOrigin: string;
    placeOfLoading: string;
    underwriter: string;
    underwriterOther: string;
  };
}

interface ParsedSubmission {
  payload: SubmissionPayload;
  summaryPdf?: FormidableFile;
  uploads: Partial<Record<DocumentKey, FormidableFile>>;
}

const DOCUMENT_KEYS = Object.keys(DOCUMENT_LABELS) as DocumentKey[];

function parseMultipart(req: VercelRequest): Promise<ParsedSubmission> {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, maxFileSize: 10 * 1024 * 1024 });

    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      const payloadField = fields.payload;
      const payloadRaw = Array.isArray(payloadField) ? payloadField[0] : payloadField;
      if (!payloadRaw) {
        reject(new Error('Missing submission payload'));
        return;
      }

      try {
        const payload = JSON.parse(payloadRaw) as ParsedSubmission['payload'];
        const summaryField = files.applicationSummary;
        const summaryPdf = Array.isArray(summaryField) ? summaryField[0] : summaryField;
        const uploads: ParsedSubmission['uploads'] = {};

        DOCUMENT_KEYS.forEach((key) => {
          const entry = files[key];
          const file = Array.isArray(entry) ? entry[0] : entry;
          if (file) uploads[key] = file;
        });

        resolve({ payload, summaryPdf, uploads });
      } catch (parseError) {
        reject(parseError);
      }
    });
  });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function buildEmailHtml(payload: SubmissionPayload): string {
  const { formData: d, referenceNumber, totalValue, convertedValue, currencyLabel, documents } =
    payload;

  const rows = [
    ['Reference', referenceNumber],
    ['Importer', d.importerName],
    ['Supplier', d.supplierName],
    ['Proforma Invoice No.', d.proformaInvoiceNo],
    ['B/L or AWB No.', d.billOfLadingNo],
    ['Country of Origin', d.countryOfOrigin],
    ['Port of Loading', d.placeOfLoading],
    ['Underwriter', d.underwriter === 'Other' ? d.underwriterOther : d.underwriter],
    ['Total Value', `${currencyLabel} ${totalValue.toLocaleString('en-US')}`],
    ['Converted Value', convertedValue.toLocaleString('en-US')],
  ];

  const documentRows = DOCUMENT_KEYS.map((key) => {
    const file = documents[key];
    return `<li><strong>${DOCUMENT_LABELS[key]}:</strong> ${file ? escapeHtml(file.name) : 'Not uploaded'}</li>`;
  }).join('');

  const tableRows = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 10px;border:1px solid #d4e4ec;font-weight:600;">${escapeHtml(label)}</td><td style="padding:6px 10px;border:1px solid #d4e4ec;">${escapeHtml(String(value))}</td></tr>`,
    )
    .join('');

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;color:#464646;max-width:720px;">
      <h2 style="color:#1496be;margin-bottom:8px;">Marine Cover Note Application</h2>
      <p style="margin-top:0;">A new marine cover note application has been submitted.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">${tableRows}</table>
      <h3 style="color:#1496be;margin-bottom:8px;">Supporting Documents</h3>
      <ul style="padding-left:20px;">${documentRows}</ul>
      <p style="font-size:13px;color:#6b6b6b;">The application summary PDF and uploaded files are attached to this email.</p>
    </div>
  `;
}

async function readUploadedFile(file: FormidableFile): Promise<Buffer> {
  return fs.readFile(file.filepath);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || 'noreply@adtinsurance.co.ke';

  if (!host || !user || !pass) {
    return res.status(503).json({
      error: 'Email service is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS.',
    });
  }

  try {
    const { payload, summaryPdf, uploads } = await parseMultipart(req);
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });

    const attachments: Array<{ filename: string; content: Buffer }> = [];

    if (summaryPdf) {
      attachments.push({
        filename: `Marine-Cover-Note-${payload.referenceNumber}.pdf`,
        content: await readUploadedFile(summaryPdf),
      });
    }

    for (const key of DOCUMENT_KEYS) {
      const file = uploads[key];
      if (!file) continue;
      attachments.push({
        filename: file.originalFilename || `${DOCUMENT_LABELS[key]}`,
        content: await readUploadedFile(file),
      });
    }

    await transporter.sendMail({
      from,
      to: payload.recipients,
      subject: payload.subject,
      html: buildEmailHtml(payload),
      attachments,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Submission email failed:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to send submission email',
    });
  }
}
