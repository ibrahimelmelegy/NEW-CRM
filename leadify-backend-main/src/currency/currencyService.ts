import Currency from './currencyModel';
import TaxRule from './taxRuleModel';

class CurrencyService {
  // Currencies
  async getCurrencies() {
    return Currency.findAll({
      order: [
        ['isDefault', 'DESC'],
        ['code', 'ASC']
      ]
    });
  }

  async createCurrency(data: Record<string, unknown>) {
    if (data.isDefault) {
      await Currency.update({ isDefault: false }, { where: { isDefault: true } });
    }
    return Currency.create(data);
  }

  async updateCurrency(id: number, data: Record<string, unknown>) {
    const currency = await Currency.findByPk(id);
    if (!currency) throw new Error('Currency not found');
    if (data.isDefault) {
      await Currency.update({ isDefault: false }, { where: { isDefault: true } });
    }
    return currency.update(data);
  }

  async deleteCurrency(id: number) {
    const currency = await Currency.findByPk(id);
    if (!currency) throw new Error('Currency not found');
    if (currency.isDefault) throw new Error('Cannot delete default currency');
    await currency.destroy();
    return { deleted: true };
  }

  async getDefaultCurrency() {
    return Currency.findOne({ where: { isDefault: true } });
  }

  async convert(amount: number, fromCode: string, toCode: string) {
    const [from, to] = await Promise.all([Currency.findOne({ where: { code: fromCode } }), Currency.findOne({ where: { code: toCode } })]);
    if (!from || !to) throw new Error('Currency not found');
    const result = (amount / Number(from.exchangeRate)) * Number(to.exchangeRate);
    return { amount, from: fromCode, to: toCode, result: Math.round(result * 100) / 100 };
  }

  // Tax Rules
  async getTaxRules() {
    return TaxRule.findAll({ order: [['name', 'ASC']] });
  }

  async createTaxRule(data: Record<string, unknown>) {
    return TaxRule.create(data);
  }

  async updateTaxRule(id: number, data: Record<string, unknown>) {
    const rule = await TaxRule.findByPk(id);
    if (!rule) throw new Error('Tax rule not found');
    return rule.update(data);
  }

  async deleteTaxRule(id: number) {
    const rule = await TaxRule.findByPk(id);
    if (!rule) throw new Error('Tax rule not found');
    await rule.destroy();
    return { deleted: true };
  }

  /**
   * Calculate tax using a tax rule, accounting for inclusive/compound settings.
   */
  async calculateTax(amount: number, taxRuleId: number) {
    const rule = await TaxRule.findByPk(taxRuleId);
    if (!rule) throw new Error('Tax rule not found');

    const rate = Number(rule.rate) / 100;
    let taxAmount: number;
    let baseAmount: number;

    if (rule.isInclusive) {
      // Price already includes tax: extract tax from the total
      // base = amount / (1 + rate), tax = amount - base
      baseAmount = Math.round((amount / (1 + rate)) * 100) / 100;
      taxAmount = Math.round((amount - baseAmount) * 100) / 100;
    } else {
      // Price excludes tax: add tax on top
      baseAmount = amount;
      taxAmount = Math.round(amount * rate * 100) / 100;
    }

    const total = Math.round((baseAmount + taxAmount) * 100) / 100;

    return {
      amount,
      baseAmount,
      taxRate: rule.rate,
      taxType: rule.taxType,
      isInclusive: rule.isInclusive,
      isCompound: rule.isCompound,
      taxAmount,
      total
    };
  }

  /**
   * Calculate VAT directly without a stored tax rule.
   * @param amount  The monetary amount
   * @param rate    The VAT rate as a percentage (e.g. 15 for 15%)
   * @param isInclusive  Whether the amount already includes VAT
   */
  calculateVAT(amount: number, rate: number, isInclusive: boolean = false) {
    const rateDecimal = rate / 100;
    let baseAmount: number;
    let vatAmount: number;

    if (isInclusive) {
      baseAmount = Math.round((amount / (1 + rateDecimal)) * 100) / 100;
      vatAmount = Math.round((amount - baseAmount) * 100) / 100;
    } else {
      baseAmount = amount;
      vatAmount = Math.round(amount * rateDecimal * 100) / 100;
    }

    const total = Math.round((baseAmount + vatAmount) * 100) / 100;

    return {
      amount,
      baseAmount,
      vatRate: rate,
      vatAmount,
      total,
      isInclusive
    };
  }
}

export default new CurrencyService();
