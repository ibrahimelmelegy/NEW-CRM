/**
 * useCurrency - Unit Tests
 * ==========================
 * Tests for composables/useCurrency.ts
 *
 * The composable provides functions to manage currencies and tax rules:
 * - fetchCurrencies, createCurrency, updateCurrency, deleteCurrency, convertCurrency
 * - fetchTaxRules, createTaxRule, updateTaxRule, deleteTaxRule, calculateTax
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useCurrency, type CurrencyItem, type TaxRuleItem } from '@/composables/useCurrency';

// ============================================
// Mock useApiFetch
// ============================================
const mockUseApiFetch = vi.fn();

vi.mock('@/composables/useApiFetch', () => ({
  useApiFetch: (...args: unknown[]) => mockUseApiFetch(...args)
}));

describe('useCurrency', () => {
  let currency: ReturnType<typeof useCurrency>;

  beforeEach(() => {
    vi.clearAllMocks();
    currency = useCurrency();
  });

  // ============================================
  // fetchCurrencies
  // ============================================
  describe('fetchCurrencies', () => {
    it('should fetch currencies with correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: [] });

      await currency.fetchCurrencies();

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/currencies');
    });

    it('should return the API response', async () => {
      const mockCurrencies: CurrencyItem[] = [
        { id: 1, code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 1, isDefault: true },
        { id: 2, code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.85, isDefault: false }
      ];

      mockUseApiFetch.mockResolvedValue({ success: true, body: mockCurrencies });

      const result = await currency.fetchCurrencies();

      expect(result).toEqual({ success: true, body: mockCurrencies });
    });
  });

  // ============================================
  // createCurrency
  // ============================================
  describe('createCurrency', () => {
    it('should create currency with POST method', async () => {
      const newCurrency: Partial<CurrencyItem> = {
        code: 'SAR',
        name: 'Saudi Riyal',
        symbol: '﷼',
        exchangeRate: 3.75,
        isDefault: false
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 3, ...newCurrency } });

      await currency.createCurrency(newCurrency);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/currencies', 'POST', newCurrency);
    });

    it('should handle creation failure', async () => {
      mockUseApiFetch.mockResolvedValue({ success: false, message: 'Currency code already exists' });

      const result = await currency.createCurrency({ code: 'USD' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // updateCurrency
  // ============================================
  describe('updateCurrency', () => {
    it('should update currency with PUT method and correct ID', async () => {
      const updateData: Partial<CurrencyItem> = { exchangeRate: 3.8 };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 1, ...updateData } });

      await currency.updateCurrency(1, updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/currencies/1', 'PUT', updateData);
    });

    it('should handle different currency IDs', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await currency.updateCurrency(5, { exchangeRate: 1.1 });

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/currencies/5', 'PUT', { exchangeRate: 1.1 });
    });
  });

  // ============================================
  // deleteCurrency
  // ============================================
  describe('deleteCurrency', () => {
    it('should delete currency with correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await currency.deleteCurrency(1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/currencies/1', 'DELETE');
    });

    it('should return the API response', async () => {
      const response = { success: true, body: null };
      mockUseApiFetch.mockResolvedValue(response);

      const result = await currency.deleteCurrency(2);

      expect(result).toEqual(response);
    });
  });

  // ============================================
  // convertCurrency
  // ============================================
  describe('convertCurrency', () => {
    it('should convert currency with correct query parameters', async () => {
      const mockConversion = { result: 375, from: 'USD', to: 'SAR', amount: 100, rate: 3.75 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: mockConversion });

      await currency.convertCurrency(100, 'USD', 'SAR');

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/convert?amount=100&from=USD&to=SAR');
    });

    it('should handle different amounts and currencies', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: { result: 850 } });

      await currency.convertCurrency(1000, 'USD', 'EUR');

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/convert?amount=1000&from=USD&to=EUR');
    });

    it('should return the conversion result', async () => {
      const mockResult = { result: 375, rate: 3.75 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: mockResult });

      const result = await currency.convertCurrency(100, 'USD', 'SAR');

      expect(result.body).toEqual(mockResult);
    });
  });

  // ============================================
  // fetchTaxRules
  // ============================================
  describe('fetchTaxRules', () => {
    it('should fetch tax rules with correct endpoint', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: [] });

      await currency.fetchTaxRules();

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/tax-rules');
    });

    it('should return the list of tax rules', async () => {
      const mockTaxRules: TaxRuleItem[] = [{ id: 1, name: 'VAT', rate: 15, region: 'SA', description: 'Saudi VAT', isActive: true }];

      mockUseApiFetch.mockResolvedValue({ success: true, body: mockTaxRules });

      const result = await currency.fetchTaxRules();

      expect(result.body).toEqual(mockTaxRules);
    });
  });

  // ============================================
  // createTaxRule
  // ============================================
  describe('createTaxRule', () => {
    it('should create tax rule with POST method', async () => {
      const newRule: Partial<TaxRuleItem> = {
        name: 'GST',
        rate: 10,
        region: 'AU',
        description: 'Australian GST',
        isActive: true
      };

      mockUseApiFetch.mockResolvedValue({ success: true, body: { id: 2, ...newRule } });

      await currency.createTaxRule(newRule);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/tax-rules', 'POST', newRule);
    });
  });

  // ============================================
  // updateTaxRule
  // ============================================
  describe('updateTaxRule', () => {
    it('should update tax rule with PUT method and correct ID', async () => {
      const updateData: Partial<TaxRuleItem> = { rate: 20, isActive: false };

      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await currency.updateTaxRule(1, updateData);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/tax-rules/1', 'PUT', updateData);
    });
  });

  // ============================================
  // deleteTaxRule
  // ============================================
  describe('deleteTaxRule', () => {
    it('should delete tax rule with correct ID', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: null });

      await currency.deleteTaxRule(3);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/tax-rules/3', 'DELETE');
    });
  });

  // ============================================
  // calculateTax
  // ============================================
  describe('calculateTax', () => {
    it('should calculate tax with correct query parameters', async () => {
      const mockCalc = { taxAmount: 150, totalAmount: 1150, taxRate: 15 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: mockCalc });

      await currency.calculateTax(1000, 1);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/calculate-tax?amount=1000&taxRuleId=1');
    });

    it('should return the calculation result', async () => {
      const mockCalc = { taxAmount: 100, totalAmount: 1100 };
      mockUseApiFetch.mockResolvedValue({ success: true, body: mockCalc });

      const result = await currency.calculateTax(1000, 2);

      expect(result.body).toEqual(mockCalc);
    });

    it('should handle different amounts and tax rule IDs', async () => {
      mockUseApiFetch.mockResolvedValue({ success: true, body: {} });

      await currency.calculateTax(5000, 3);

      expect(mockUseApiFetch).toHaveBeenCalledWith('currency/calculate-tax?amount=5000&taxRuleId=3');
    });
  });

  // ============================================
  // Return value structure
  // ============================================
  describe('useCurrency return value', () => {
    it('should return all expected functions', () => {
      expect(currency.fetchCurrencies).toBeTypeOf('function');
      expect(currency.createCurrency).toBeTypeOf('function');
      expect(currency.updateCurrency).toBeTypeOf('function');
      expect(currency.deleteCurrency).toBeTypeOf('function');
      expect(currency.convertCurrency).toBeTypeOf('function');
      expect(currency.fetchTaxRules).toBeTypeOf('function');
      expect(currency.createTaxRule).toBeTypeOf('function');
      expect(currency.updateTaxRule).toBeTypeOf('function');
      expect(currency.deleteTaxRule).toBeTypeOf('function');
      expect(currency.calculateTax).toBeTypeOf('function');
    });
  });
});
