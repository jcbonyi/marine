import { parseAmount } from './format';
import type { FormData } from '../types';

export function calculateTotals(data: FormData) {
  const fob = parseAmount(data.fobPrice);
  const freight = parseAmount(data.freight);
  const duty = parseAmount(data.duty);
  const idfRdl = parseAmount(data.idfRdlCharges);
  const clearing = parseAmount(data.clearingCharges);
  const markup = parseAmount(data.markup);
  const exchangeRate = parseAmount(data.exchangeRate);

  const totalValue = fob + freight + duty + idfRdl + clearing + markup;
  const convertedValue = exchangeRate > 0 ? totalValue * exchangeRate : 0;

  return {
    fob,
    freight,
    duty,
    idfRdl,
    clearing,
    markup,
    totalValue,
    convertedValue,
    exchangeRate,
  };
}
