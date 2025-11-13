export interface SubscriptionPrice {
  monthly: string;
  yearly: string;
  monthlyNumeric: number;
  yearlyNumeric: number;
  yearlyMonthlyBreakdown: string;
}

export interface CurrencyPrices {
  GBP: SubscriptionPrice;
  USD: SubscriptionPrice;
}

export const PRO_PRICING: CurrencyPrices = {
  GBP: {
    monthly: '£2.99',
    yearly: '£28.99',
    monthlyNumeric: 2.99,
    yearlyNumeric: 28.99,
    yearlyMonthlyBreakdown: '£2.41',
  },
  USD: {
    monthly: '$3.99',
    yearly: '$34.99',
    monthlyNumeric: 3.99,
    yearlyNumeric: 34.99,
    yearlyMonthlyBreakdown: '$2.91',
  },
};

export const PLUS_PRICING: CurrencyPrices = {
  GBP: {
    monthly: '£16.99',
    yearly: '£149.99',
    monthlyNumeric: 16.99,
    yearlyNumeric: 149.99,
    yearlyMonthlyBreakdown: '£12.49',
  },
  USD: {
    monthly: '$19.99',
    yearly: '$179.99',
    monthlyNumeric: 19.99,
    yearlyNumeric: 179.99,
    yearlyMonthlyBreakdown: '$14.99',
  },
};

export function getPriceDisplay(priceTier?: string, currency: 'GBP' | 'USD' = 'GBP'): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  
  const pricing = priceTier.startsWith('pro-') ? PRO_PRICING : PLUS_PRICING;
  
  if (priceTier === 'pro-monthly') {
    return `${pricing[currency].monthly}/month`;
  }
  if (priceTier === 'pro-yearly') {
    return `${pricing[currency].yearly}/year`;
  }
  if (priceTier === 'plus-monthly') {
    return `${pricing[currency].monthly}/month`;
  }
  if (priceTier === 'plus-yearly') {
    return `${pricing[currency].yearly}/year`;
  }
  
  return 'Free';
}

export function calculateYearlySavings(currency: 'GBP' | 'USD' = 'GBP', tier: 'pro' | 'plus' = 'pro'): string {
  const pricing = tier === 'pro' ? PRO_PRICING : PLUS_PRICING;
  const monthlyCost = pricing[currency].monthlyNumeric * 12;
  const yearlyCost = pricing[currency].yearlyNumeric;
  const savings = monthlyCost - yearlyCost;
  const currencySymbol = currency === 'GBP' ? '£' : '$';
  
  return `${currencySymbol}${savings.toFixed(2)}`;
}

export function calculateYearlySavingsPercentage(tier: 'pro' | 'plus' = 'pro'): number {
  const pricing = tier === 'pro' ? PRO_PRICING : PLUS_PRICING;
  const monthlyCost = pricing.GBP.monthlyNumeric * 12;
  const yearlyCost = pricing.GBP.yearlyNumeric;
  const savings = monthlyCost - yearlyCost;
  const percentage = (savings / monthlyCost) * 100;
  
  return Math.round(percentage);
}
