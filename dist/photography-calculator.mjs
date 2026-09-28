export const photoPackages = [
  { id: "classic", name: "Classic", photographerLevel: "Vetted photographer", shootMinutes: 30, editedImages: 5, price: 229, bookings: 0, photographerFee: 125, photographerFeeCap: 125, marketingAdminCost: 20 },
  { id: "signature", name: "Signature", photographerLevel: "Experienced photographer", shootMinutes: 60, editedImages: 12, price: 329, bookings: 0, photographerFee: 180, photographerFeeCap: 180, marketingAdminCost: 25 },
  { id: "heirloom", name: "Heirloom", photographerLevel: "Senior photographer", shootMinutes: 90, editedImages: 25, price: 499, bookings: 0, photographerFee: 275, photographerFeeCap: 275, marketingAdminCost: 35 },
];

function nonNegative(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite non-negative number`);
  }
}

function rate(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be between 0% and 100%`);
  }
}

export function calculatePhotography({ vatRegistered = true, vatRate = 0.2, paymentFeeRate = 0.02, otherFixedCosts = 0, packages = photoPackages } = {}) {
  rate(vatRate, "VAT rate");
  rate(paymentFeeRate, "Payment fee rate");
  nonNegative(otherFixedCosts, "Other fixed costs");
  if (typeof vatRegistered !== "boolean") throw new TypeError("VAT registration must be true or false");
  if (!Array.isArray(packages)) throw new TypeError("Packages must be an array");
  const seen = new Set();
  const packageResults = packages.map((item) => {
    if (!item || !photoPackages.some((known) => known.id === item.id)) throw new RangeError("Unknown package");
    if (seen.has(item.id)) throw new RangeError("Duplicate package");
    seen.add(item.id);
    nonNegative(item.bookings, "Bookings");
    if (!Number.isInteger(item.bookings)) throw new RangeError("Bookings must be a whole number");
    nonNegative(item.price, "Price");
    nonNegative(item.photographerFee, "Photographer fee");
    nonNegative(item.photographerFeeCap, "Photographer fee cap");
    nonNegative(item.marketingAdminCost, "Marketing/admin allowance");
    const netRevenuePerBooking = vatRegistered ? item.price / (1 + vatRate) : item.price;
    const paymentFeePerBooking = item.price * paymentFeeRate;
    const contributionPerBooking = netRevenuePerBooking - item.photographerFee - item.marketingAdminCost - paymentFeePerBooking;
    const revenue = netRevenuePerBooking * item.bookings;
    const contribution = contributionPerBooking * item.bookings;
    return {
      ...item,
      netRevenuePerBooking,
      paymentFeePerBooking,
      contributionPerBooking,
      grossReceipts: item.price * item.bookings,
      revenue,
      photographerCost: item.photographerFee * item.bookings,
      totalMarketingAdminCost: item.marketingAdminCost * item.bookings,
      paymentFees: paymentFeePerBooking * item.bookings,
      contribution,
      margin: netRevenuePerBooking ? contributionPerBooking / netRevenuePerBooking : null,
      overFeeCap: item.photographerFee > item.photographerFeeCap,
      lossMaking: contributionPerBooking < 0,
    };
  });
  const sum = (key) => packageResults.reduce((total, item) => total + item[key], 0);
  const revenue = sum("revenue");
  const operatingProfit = sum("contribution") - otherFixedCosts;
  return {
    packages: packageResults,
    bookings: sum("bookings"),
    grossReceipts: sum("grossReceipts"),
    revenue,
    photographerCost: sum("photographerCost"),
    marketingAdminCost: sum("totalMarketingAdminCost"),
    paymentFees: sum("paymentFees"),
    otherFixedCosts,
    totalCosts: sum("photographerCost") + sum("totalMarketingAdminCost") + sum("paymentFees") + otherFixedCosts,
    operatingProfit,
    operatingMargin: revenue ? operatingProfit / revenue : null,
    anyOverFeeCap: packageResults.some((item) => item.overFeeCap),
    lossMaking: operatingProfit < 0,
  };
}
