import { useApiFetch } from './useApiFetch';

export interface CurrencyItem {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: number;
  isDefault: boolean;
}

export interface TaxRuleItem {
  id: number;
  name: string;
  rate: number;
  region: string;
  description: string;
  isActive: boolean;
}

export function useCurrency() {
  const fetchCurrencies = () => useApiFetch('currency/currencies');
  const createCurrency = (data: Partial<CurrencyItem>) => useApiFetch('currency/currencies', 'POST', data);
  const updateCurrency = (id: number, data: Partial<CurrencyItem>) => useApiFetch(`currency/currencies/${id}`, 'PUT', data);
  const deleteCurrency = (id: number) => useApiFetch(`currency/currencies/${id}`, 'DELETE');
  const convertCurrency = (amount: number, from: string, to: string) => useApiFetch(`currency/convert?amount=${amount}&from=${from}&to=${to}`);

  const fetchTaxRules = () => useApiFetch('currency/tax-rules');
  const createTaxRule = (data: Partial<TaxRuleItem>) => useApiFetch('currency/tax-rules', 'POST', data);
  const updateTaxRule = (id: number, data: Partial<TaxRuleItem>) => useApiFetch(`currency/tax-rules/${id}`, 'PUT', data);
  const deleteTaxRule = (id: number) => useApiFetch(`currency/tax-rules/${id}`, 'DELETE');
  const calculateTax = (amount: number, taxRuleId: number) => useApiFetch(`currency/calculate-tax?amount=${amount}&taxRuleId=${taxRuleId}`);

  return {
    fetchCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
    convertCurrency,
    fetchTaxRules,
    createTaxRule,
    updateTaxRule,
    deleteTaxRule,
    calculateTax
  };
}
