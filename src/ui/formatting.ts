// The app's web font draws currency symbols from Greek code points (docs/product-discovery.md §1):
// the DOM text "Χ343.99" renders as "$343.99". Only observed mappings are listed; USDT-quoted
// crypto pairs are rendered without a symbol.
export const CURRENCY_GLYPHS: Readonly<Partial<Record<string, string>>> = {
  USD: 'Χ',
  EUR: 'Ϊ',
  USDT: '',
};

export function currencyGlyph(currency: string): string {
  const glyph = CURRENCY_GLYPHS[currency];
  if (glyph === undefined) {
    throw new Error(`No observed currency glyph for ${currency}; extend CURRENCY_GLYPHS first`);
  }
  return glyph;
}
