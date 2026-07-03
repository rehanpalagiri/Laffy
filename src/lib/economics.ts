// Subscription unit-economics calculator.
// Customers see retail values only; internal cost math stays internal.

export interface EconomicsConfig {
  monthlyPrice: number;
  productCostCap: number;
  shippingReserve: number;
  paymentFeePercent: number; // 0.029 = 2.9%
  paymentFeeFixed: number;
  packagingSupportReserve: number;
  minContributionMargin: number;
}

export const DEFAULT_ECONOMICS: EconomicsConfig = {
  monthlyPrice: 49.99,
  productCostCap: 30.0,
  shippingReserve: 6.5,
  paymentFeePercent: 0.029,
  paymentFeeFixed: 0.3,
  packagingSupportReserve: 2.5,
  minContributionMargin: 8.0,
};

export interface BoxItemCost { id: string; wholesaleCost: number; }

export interface EconomicsResult {
  productCost: number;
  shipping: number;
  paymentFee: number;
  packaging: number;
  totalCost: number;
  contributionMargin: number;
  withinCostCap: boolean;
  meetsMinMargin: boolean;
  valid: boolean;
}

export function paymentFee(amount: number, cfg: EconomicsConfig = DEFAULT_ECONOMICS): number {
  return round2(amount * cfg.paymentFeePercent + cfg.paymentFeeFixed);
}

export function calculateBoxEconomics(
  items: BoxItemCost[],
  cfg: EconomicsConfig = DEFAULT_ECONOMICS,
): EconomicsResult {
  const productCost = round2(items.reduce((s, i) => s + i.wholesaleCost, 0));
  const fee = paymentFee(cfg.monthlyPrice, cfg);
  const totalCost = round2(productCost + cfg.shippingReserve + fee + cfg.packagingSupportReserve);
  const contributionMargin = round2(cfg.monthlyPrice - totalCost);
  const withinCostCap = productCost <= cfg.productCostCap + 1e-9;
  const meetsMinMargin = contributionMargin >= cfg.minContributionMargin - 1e-9;
  return {
    productCost,
    shipping: cfg.shippingReserve,
    paymentFee: fee,
    packaging: cfg.packagingSupportReserve,
    totalCost,
    contributionMargin,
    withinCostCap,
    meetsMinMargin,
    valid: withinCostCap && meetsMinMargin,
  };
}

function round2(n: number) { return Math.round(n * 100) / 100; }

export function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}
