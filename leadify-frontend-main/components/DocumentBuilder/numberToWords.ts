/**
 * Convert a number to words (English).
 * Supports numbers up to 999 trillion with decimal (cents/halalas).
 */

const ones = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen'
];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertChunk(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ones[n] ?? '';
  if (n < 100) return (tens[Math.floor(n / 10)] ?? '') + (n % 10 ? ' ' + (ones[n % 10] ?? '') : '');
  return (ones[Math.floor(n / 100)] ?? '') + ' Hundred' + (n % 100 ? ' ' + convertChunk(n % 100) : '');
}

const currencyNames: Record<string, { main: string; sub: string }> = {
  SAR: { main: 'Saudi Riyal', sub: 'Halala' },
  USD: { main: 'US Dollar', sub: 'Cent' },
  EUR: { main: 'Euro', sub: 'Cent' },
  GBP: { main: 'British Pound', sub: 'Penny' },
  AED: { main: 'UAE Dirham', sub: 'Fils' },
  EGP: { main: 'Egyptian Pound', sub: 'Piaster' },
  KWD: { main: 'Kuwaiti Dinar', sub: 'Fils' },
  QAR: { main: 'Qatari Riyal', sub: 'Dirham' },
  BHD: { main: 'Bahraini Dinar', sub: 'Fils' },
  OMR: { main: 'Omani Rial', sub: 'Baisa' }
};

export function numberToWords(amount: number, currency: string = 'SAR'): string {
  if (amount === 0) return 'Zero ' + pluralize(currencyNames[currency]?.main || currency, 0) + ' Only';

  const wholePart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - wholePart) * 100);

  const currInfo = currencyNames[currency] || { main: currency, sub: 'Cent' };

  let result = '';

  if (wholePart > 0) {
    const chunks: number[] = [];
    let num = wholePart;
    while (num > 0) {
      chunks.push(num % 1000);
      num = Math.floor(num / 1000);
    }

    const words = chunks
      .map((chunk, i) => (chunk ? convertChunk(chunk) + (scales[i] ? ' ' + scales[i] : '') : ''))
      .filter(Boolean)
      .reverse()
      .join(' ');

    result = words + ' ' + pluralize(currInfo.main, wholePart);
  }

  if (decimalPart > 0) {
    if (result) result += ' and ';
    result += convertChunk(decimalPart) + ' ' + pluralize(currInfo.sub, decimalPart);
  }

  return result + ' Only';
}

function pluralize(word: string, count: number): string {
  if (count === 1) return word;
  // Simple pluralization
  if (word.endsWith('y') && !word.endsWith('ey')) return word.slice(0, -1) + 'ies';
  if (word.endsWith('s') || word.endsWith('x')) return word + 'es';
  return word + 's';
}
