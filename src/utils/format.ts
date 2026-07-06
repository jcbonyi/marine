export function parseAmount(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace(/,/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function formatAmount(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInputDisplay(value: string): string {
  if (!value) return '';
  const cleaned = value.replace(/,/g, '');
  if (cleaned === '' || cleaned === '.') return value;
  const parts = cleaned.split('.');
  const intPart = parts[0].replace(/\D/g, '');
  const decPart = parts[1] !== undefined ? parts[1].replace(/\D/g, '').slice(0, 2) : undefined;
  const formattedInt = intPart ? parseInt(intPart, 10).toLocaleString('en-US') : '';
  if (decPart !== undefined) {
    return `${formattedInt}.${decPart}`;
  }
  if (value.includes('.')) {
    return `${formattedInt}.`;
  }
  return formattedInt;
}

export function getCurrencyLabel(currency: string, currencyOther: string): string {
  if (currency === 'OTHER') return currencyOther.trim() || 'Other';
  return currency;
}

export function generateReferenceNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MCN-${date}-${random}`;
}
