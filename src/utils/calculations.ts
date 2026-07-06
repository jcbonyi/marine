import { parseAmount } from './format';
import type { FormData } from '../types';

const IDF_RATE = 0.0225;
const RDL_RATE = 0.015;

export function calculateIdfRdl(fob: number, freight: number): number {
  const cfValue = fob + freight;
  return cfValue * (IDF_RATE + RDL_RATE);
}

export function calculateTotals(data: FormData) {
  const fob = parseAmount(data.fobPrice);
  const freight = parseAmount(data.freight);
  const duty = parseAmount(data.duty);
  const clearing = parseAmount(data.clearingCharges);
  const markup = parseAmount(data.markup);
  const exchangeRate = parseAmount(data.exchangeRate);

  const autoIdfRdl = calculateIdfRdl(fob, freight);
  const idfRdl = data.idfRdlOverridden
    ? parseAmount(data.idfRdlCharges)
    : autoIdfRdl;

  const totalValue = fob + freight + duty + idfRdl + clearing + markup;
  const convertedValue = exchangeRate > 0 ? totalValue * exchangeRate : 0;

  return {
    fob,
    freight,
    duty,
    idfRdl,
    autoIdfRdl,
    clearing,
    markup,
    totalValue,
    convertedValue,
    exchangeRate,
    cfValue: fob + freight,
  };
}
