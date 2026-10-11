// The API speaks paise (whole numbers). People think in rupees.
// This class is the one place the two meet.

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export class Money {
  readonly paise: number;

  constructor(paise: number) {
    if (!Number.isInteger(paise)) {
      throw new Error(`Money must be whole paise, got ${paise}`);
    }
    this.paise = paise;
  }

  // Math.round cleans float noise: 19.99 * 100 is 1998.9999999999998
  static fromRupees(rupees: number): Money {
    return new Money(Math.round(rupees * 100));
  }

  toRupees(): number {
    return this.paise / 100;
  }

  // 10000000 -> "₹1,00,000"
  format(): string {
    return inr.format(this.toRupees());
  }
}

export function rupeesToPaise(rupees: number): number {
  return Money.fromRupees(rupees).paise;
}

export function formatPaise(paise: number): string {
  return new Money(paise).format();
}
