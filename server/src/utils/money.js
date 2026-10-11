// Money is always an integer number of paise (₹1 = 100 paise). Never floats.

export function rupeesToPaise(rupees) {
  // Math.round fixes float noise: 19.99 * 100 is 1998.9999999999998
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise) {
  return paise / 100;
}

export function isValidPaise(value) {
  return Number.isInteger(value) && value > 0;
}

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

// 1000000 -> "₹10,000"   10000000 -> "₹1,00,000" (Indian digit grouping)
export function formatPaise(paise) {
  return inr.format(paiseToRupees(paise));
}
