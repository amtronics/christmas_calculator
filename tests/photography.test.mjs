import test from "node:test";
import assert from "node:assert/strict";

const { photoPackages, calculatePhotography } = await import("../dist/photography-calculator.mjs").catch(() => ({}));

test("approved portrait packages produce conservative booking contributions", () => {
  assert.equal(typeof calculatePhotography, "function");
  assert.deepEqual(photoPackages.map(({ name, shootMinutes, editedImages, price, photographerFeeCap }) => [name, shootMinutes, editedImages, price, photographerFeeCap]), [
    ["Classic", 30, 5, 229, 125],
    ["Signature", 60, 12, 329, 180],
    ["Heirloom", 90, 25, 499, 275],
  ]);
  assert.deepEqual(photoPackages.map(({ bookings, photographerFee, marketingAdminCost }) => [bookings, photographerFee, marketingAdminCost]), [
    [0, 125, 20], [0, 180, 25], [0, 275, 35],
  ]);
  const result = calculatePhotography({ packages: photoPackages.map((row) => ({ ...row, bookings: 1 })) });
  assert.deepEqual(result.packages.map((row) => Number(row.contributionPerBooking.toFixed(2))), [41.25, 62.59, 95.85]);
  assert.equal(result.bookings, 3);
  assert.equal(Number(result.operatingProfit.toFixed(2)), 199.69);
});

test("VAT registration and card fee are applied to the right base", () => {
  const registered = calculatePhotography({ packages: [{ ...photoPackages[0], bookings: 1 }] });
  assert.equal(Number(registered.packages[0].netRevenuePerBooking.toFixed(2)), 190.83);
  assert.equal(registered.packages[0].paymentFeePerBooking, 4.58);
  const zeroVat = calculatePhotography({ vatRate: 0, packages: [{ ...photoPackages[0], bookings: 1 }] });
  assert.equal(zeroVat.packages[0].netRevenuePerBooking, 229);
  const unregistered = calculatePhotography({ vatRegistered: false, packages: [{ ...photoPackages[0], bookings: 1 }] });
  assert.equal(unregistered.packages[0].netRevenuePerBooking, 229);
  assert.equal(Number(unregistered.operatingProfit.toFixed(2)), 79.42);
});

test("fee cap warning is independent of profitability and booking quantity", () => {
  const result = calculatePhotography({ packages: [{ ...photoPackages[0], photographerFee: 126 }] });
  assert.equal(result.packages[0].overFeeCap, true);
  assert.equal(result.packages[0].lossMaking, false);
  assert.equal(result.anyOverFeeCap, true);
  assert.equal(calculatePhotography({ packages: [{ ...photoPackages[0], photographerFee: 200 }] }).packages[0].lossMaking, true);
});

test("package allowance stays editable while its projected total scales with bookings", () => {
  const result = calculatePhotography({ packages: [{ ...photoPackages[0], bookings: 2 }] });
  assert.equal(result.packages[0].marketingAdminCost, 20);
  assert.equal(result.packages[0].totalMarketingAdminCost, 40);
  assert.equal(result.marketingAdminCost, 40);
});

test("fixed costs and unequal quantities produce the intended overall profit", () => {
  const empty = calculatePhotography({ packages: [], otherFixedCosts: 12 });
  assert.equal(empty.operatingProfit, -12);
  assert.equal(empty.lossMaking, true);
  assert.equal(empty.operatingMargin, null);
  const mixed = calculatePhotography({ packages: [{ ...photoPackages[0], bookings: 2 }, { ...photoPackages[1], bookings: 1 }] });
  assert.equal(mixed.bookings, 3);
  assert.equal(Number(mixed.operatingProfit.toFixed(2)), 145.09);
});

test("booking counts must be non-negative whole numbers", () => {
  assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], bookings: 1.5 }] }), /whole number/i);
  assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], bookings: -1 }] }), /non-negative/i);
});

test("money and percentage inputs reject invalid values", () => {
  assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], price: -1 }] }), /price/i);
  assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], photographerFee: NaN }] }), /photographer fee/i);
  assert.throws(() => calculatePhotography({ vatRate: 1.01 }), /VAT rate/i);
  assert.throws(() => calculatePhotography({ vatRate: -0.01 }), /VAT rate/i);
  assert.throws(() => calculatePhotography({ paymentFeeRate: 1.01 }), /payment fee/i);
  assert.throws(() => calculatePhotography({ paymentFeeRate: -0.01 }), /payment fee/i);
});

test("unknown or duplicate packages are rejected", () => {
  assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], id: "other" }] }), /unknown package/i);
  assert.throws(() => calculatePhotography({ packages: [photoPackages[0], photoPackages[0]] }), /duplicate package/i);
});
