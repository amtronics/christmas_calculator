import test from "node:test";
import assert from "node:assert/strict";

const calculator = await import("../dist/calculator.mjs").catch(() => ({}));
const catalog = await import("../dist/tree-catalog.mjs");

test("catalog offers only the selected foot bands with their agreed supplier sizes", () => {
  assert.deepEqual(catalog.treeRows.map((row) => [row.species, row.displaySize, row.size]), [
    ["nordmann", "3-4 ft", "100-125 cm"],
    ["nordmann", "4-5 ft", "125-150 cm"],
    ["nordmann", "5-6 ft", "150-175 cm"],
    ["nordmann", "6-7 ft", "175-200 cm"],
    ["nordmann", "7-8 ft", "225-250 cm"],
    ["nordmann", "8-9 ft", "250-275 cm"],
    ["nordmann", "9-10 ft", "275-300 cm"],
    ["nordmann", "10-11 ft", "300-330 cm"],
    ["nordmann", "11-12 ft", "330-360 cm"],
    ["norway", "4-5 ft", "150-175 cm"],
    ["norway", "5-6 ft", "175-200 cm"],
    ["fraser", "5-6 ft", "150-175 cm"],
    ["fraser", "6-7 ft", "175-200 cm"],
    ["noble", "4-5 ft", "150-175 cm"],
    ["noble", "5-6 ft", "175-200 cm"],
    ["noble", "6-7 ft", "200-225 cm"],
  ]);
  assert.equal(new Set(catalog.treeRows.map((row) => row.id)).size, 16);
  assert.equal(catalog.treeRows.some((row) => Object.hasOwn(row.prices, "Budget")), false);
});

test("the simplified offers preserve the 100-tree starting plan", () => {
  assert.deepEqual(catalog.treeRows.filter((row) => row.defaultQuantity > 0).map((row) => [row.id, row.defaultQuantity]), [
    ["nordmann-175-200", 60],
    ["norway-175-200", 10],
    ["fraser-175-200", 20],
    ["noble-175-200", 10],
  ]);
});

test("charges one all-in disposal trip per full or partial van load", () => {
  const base = {
    products: [{ quantity: 31, wholesaleExVat: 10, retailPrice: 20 }],
    treesPerVanLoad: 30,
    vanDailyRateExVat: 0,
    driverHoursPerDay: 0,
    driverHourlyCost: 0,
    disposalCostPerVan: 75,
  };
  const twoLoads = calculator.calculateBusiness({ ...base, sellThrough: 0 });
  assert.equal(twoLoads.disposalTrips, 2);
  assert.equal(twoLoads.disposalCost, 150);
  const oneLoad = calculator.calculateBusiness({ ...base, sellThrough: 1 / 31 });
  assert.equal(oneLoad.disposalTrips, 1);
  assert.equal(oneLoad.disposalCost, 75);
  const noLoads = calculator.calculateBusiness({ ...base, sellThrough: 1 });
  assert.equal(noLoads.disposalTrips, 0);
  assert.equal(noLoads.disposalCost, 0);
});

test("one Premium switch uses exact-size quotes and falls back when unavailable", () => {
  const nordmann = catalog.treeRows.find((row) => row.species === "nordmann" && row.size === "175-200 cm");
  const fraser = catalog.treeRows.find((row) => row.species === "fraser" && row.size === "175-200 cm");
  const noble = catalog.treeRows.find((row) => row.species === "noble" && row.size === "175-200 cm");
  assert.deepEqual(catalog.supplierPrice(nordmann, false), { grade: "Standard", price: 25.3 });
  assert.deepEqual(catalog.supplierPrice(nordmann, true), { grade: "Premium", price: 30.55 });
  assert.deepEqual(catalog.supplierPrice(fraser, false), { grade: "Premium", price: 30.3 });
  assert.deepEqual(catalog.supplierPrice(noble, false), { grade: "Premium", price: 33 });
  assert.equal(catalog.marketPrice(nordmann).price, 119);
});

test("suggests selling prices a chosen percentage below We Tree Kings", () => {
  const nordmann = catalog.treeRows.find((row) => row.id === "nordmann-175-200");
  const nobleWithoutMatch = catalog.treeRows.find((row) => row.id === "noble-150-175");
  const norway4ft = catalog.treeRows.find((row) => row.id === "norway-150-175");
  const norway5ft = catalog.treeRows.find((row) => row.id === "norway-175-200");
  assert.equal(catalog.suggestedRetailPrice(nordmann, 5), 113.05);
  assert.equal(catalog.suggestedRetailPrice(nordmann, 0), 119);
  assert.equal(catalog.suggestedRetailPrice(nordmann, 10), 107.1);
  assert.equal(catalog.marketPrice(norway4ft).price, 80);
  assert.equal(catalog.marketPrice(norway5ft).price, 90);
  assert.equal(catalog.suggestedRetailPrice(nobleWithoutMatch, 5), null);
  assert.throws(() => catalog.suggestedRetailPrice(nordmann, 101), /between 0% and 100%/i);
});

test("calculates total self-delivery mileage from each daily route", () => {
  assert.equal(typeof calculator.calculateDeliveryMiles, "function");
  assert.equal(
    calculator.calculateDeliveryMiles({
      deliveryDays: 5,
      depotToFirstMiles: 12,
      routeMilesPerDay: 45,
      returnToDepotMiles: 12,
    }),
    345,
  );
});

test("plans collection loads and delivery days from tree counts", () => {
  assert.deepEqual(calculator.calculateVanPlan({
    treesPurchased: 100, treesSold: 80, treesPerVanLoad: 30,
    collectionTripsPerDay: 2, treesPerDeliveryDay: 20,
  }), { collectionTrips: 4, collectionDays: 2, deliveryDays: 4, vanHireDays: 6 });
  assert.deepEqual(calculator.calculateVanPlan({
    treesPurchased: 0, treesSold: 0, treesPerVanLoad: 30,
    collectionTripsPerDay: 2, treesPerDeliveryDay: 20,
  }), { collectionTrips: 0, collectionDays: 0, deliveryDays: 0, vanHireDays: 0 });
});

test("calculates leaflet demand and rounds print costs to batches", () => {
  assert.deepEqual(calculator.calculateLeafletPlan({
    treesSold: 100, leafletResponseRate: 0.005,
    leafletBatchSize: 5000, leafletBatchCostIncVat: 300,
  }), { leafletsNeeded: 20000, leafletBatches: 4, leafletsPrinted: 20000, leafletCashCost: 1200 });
  assert.deepEqual(calculator.calculateLeafletPlan({
    treesSold: 80, leafletResponseRate: 0.005,
    leafletBatchSize: 5000, leafletBatchCostIncVat: 300,
  }), { leafletsNeeded: 16000, leafletBatches: 4, leafletsPrinted: 20000, leafletCashCost: 1200 });
  assert.throws(() => calculator.calculateLeafletPlan({ treesSold: 1, leafletResponseRate: 0 }), /greater than zero/i);
  assert.throws(() => calculator.calculateLeafletPlan({ treesSold: 1, leafletResponseRate: 1.1 }), /exceed 100%/i);
});

test("defaults to 1,000-leaflet batches at £50 including VAT", () => {
  assert.deepEqual(calculator.calculateLeafletPlan({ treesSold: 100 }), {
    leafletsNeeded: 20000,
    leafletBatches: 20,
    leafletsPrinted: 20000,
    leafletCashCost: 1000,
  });
});

test("calculates the base-case operating profit using self-delivery only", () => {
  assert.equal(typeof calculator.calculateBusiness, "function");
  const result = calculator.calculateBusiness({
    vatRegistered: false,
    vatRate: 0.2,
    sellThrough: 1,
    products: [
      { quantity: 25, wholesaleExVat: 26.35, retailPrice: 69 },
      { quantity: 45, wholesaleExVat: 30.55, retailPrice: 79 },
      { quantity: 25, wholesaleExVat: 38.3, retailPrice: 94 },
      { quantity: 5, wholesaleExVat: 50.5, retailPrice: 99 },
    ],
    treesPerVanLoad: 30,
    collectionTripsPerDay: 2,
    treesPerDeliveryDay: 20,
    vanDailyRateExVat: 47.86,
    driverHoursPerDay: 8,
    driverHourlyCost: 17.5,
    collectionRoundTripMiles: 0,
    depotToFirstMiles: 12,
    routeMilesPerDay: 45,
    returnToDepotMiles: 12,
    vanMpg: 25,
    dieselPerLitre: 1.89,
    leafletResponseRate: 0.005,
    leafletBatchSize: 5000,
    leafletBatchCostIncVat: 300,
    storageCost: 0,
    insuranceCost: 0,
    paymentFeeRate: 0,
    disposalCostPerVan: 0,
    otherFixedCosts: 0,
  });

  assert.equal(result.treesPurchased, 100);
  assert.equal(result.treesSold, 100);
  assert.equal(result.totalMiles, 345);
  assert.equal(result.collectionTrips, 4);
  assert.equal(result.collectionDays, 2);
  assert.equal(result.deliveryDays, 5);
  assert.equal(result.vanHireDays, 7);
  assert.equal(result.leafletsNeeded, 20000);
  assert.equal(result.leafletBatches, 4);
  assert.equal(result.leafletCost, 1200);
  assert.ok(Math.abs(result.vanHireCost - 402.024) < 0.001);
  assert.equal(result.driverCost, 980);
  assert.ok(Math.abs(result.revenue - 8125) < 0.001);
  assert.ok(Math.abs(result.inventoryCost - 3892.2) < 0.001);
  assert.ok(Math.abs(result.operatingProfit - 1532.20488062) < 0.001);
});

test("keeps the full inventory cost when sell-through falls", () => {
  assert.equal(typeof calculator.calculateBusiness, "function");
  const result = calculator.calculateBusiness({
    vatRegistered: false,
    vatRate: 0.2,
    sellThrough: 0.8,
    products: [
      { quantity: 25, wholesaleExVat: 26.35, retailPrice: 69 },
      { quantity: 45, wholesaleExVat: 30.55, retailPrice: 79 },
      { quantity: 25, wholesaleExVat: 38.3, retailPrice: 94 },
      { quantity: 5, wholesaleExVat: 50.5, retailPrice: 99 },
    ],
    treesPerVanLoad: 30,
    collectionTripsPerDay: 2,
    treesPerDeliveryDay: 20,
    vanDailyRateExVat: 47.86,
    driverHoursPerDay: 8,
    driverHourlyCost: 17.5,
    collectionRoundTripMiles: 0,
    depotToFirstMiles: 12,
    routeMilesPerDay: 45,
    returnToDepotMiles: 12,
    vanMpg: 25,
    dieselPerLitre: 1.89,
    leafletResponseRate: 0.005,
    leafletBatchSize: 5000,
    leafletBatchCostIncVat: 300,
    storageCost: 0,
    insuranceCost: 0,
    paymentFeeRate: 0,
    disposalCostPerVan: 0,
    otherFixedCosts: 0,
  });

  assert.equal(result.treesSold, 80);
  assert.ok(Math.abs(result.revenue - 6500) < 0.001);
  assert.ok(Math.abs(result.inventoryCost - 3892.2) < 0.001);
  assert.equal(result.deliveryDays, 4);
  assert.equal(result.vanHireDays, 6);
  assert.equal(result.leafletsNeeded, 16000);
  assert.equal(result.leafletsPrinted, 20000);
  assert.equal(result.totalMiles, 276);
  assert.ok(Math.abs(result.vanHireCost - 344.592) < 0.001);
  assert.equal(result.driverCost, 840);
  assert.ok(result.operatingProfit > 0);
});

test("rejects negative costs and invalid sell-through", () => {
  assert.equal(typeof calculator.calculateBusiness, "function");
  assert.throws(
    () => calculator.calculateBusiness({ sellThrough: 1.2, products: [] }),
    /sell-through/i,
  );
  assert.throws(
    () =>
      calculator.calculateBusiness({
        sellThrough: 1,
        products: [{ quantity: 1, wholesaleExVat: -1, retailPrice: 10 }],
      }),
    /non-negative/i,
  );
});

test("requires a wholesale quote for a stocked tree", () => {
  assert.throws(
    () => calculator.calculateBusiness({ products: [{ name: "Noble Fir", grade: "Standard", quantity: 10, wholesaleExVat: null, retailPrice: 89 }] }),
    /wholesale quote/i,
  );
});

test("requires a selling price for a stocked tree without a market comparison", () => {
  assert.throws(
    () => calculator.calculateBusiness({ products: [{ name: "Nordmann Fir", size: "175-200 cm", quantity: 1, wholesaleExVat: 25.3, retailPrice: null }] }),
    /selling price/i,
  );
});

test("adds sold Cinco stands at the quoted costs and chosen prices without changing tree logistics", () => {
  const result = calculator.calculateBusiness({
    products: [{ quantity: 2, wholesaleExVat: 10, retailPrice: 50 }],
    stands: [{ size: 6, quantity: 1 }, { size: 8, quantity: 2 }, { size: 10, quantity: 1 }],
    vatRegistered: false,
    vatRate: 0.2,
    paymentFeeRate: 0,
    vanDailyRateExVat: 0,
    driverHoursPerDay: 0,
    driverHourlyCost: 0,
    leafletBatchCostIncVat: 0,
  });
  assert.equal(result.treesPurchased, 2);
  assert.equal(result.treesSold, 2);
  assert.equal(result.collectionTrips, 1);
  assert.equal(result.deliveryDays, 1);
  assert.equal(result.leafletsNeeded, 400);
  assert.equal(result.standsSold, 4);
  assert.equal(result.standRevenue, 115);
  assert.ok(Math.abs(result.standCost - 73.2) < 1e-9);
  assert.equal(result.revenue, 215);
  assert.ok(Math.abs(result.inventoryCost - 97.2) < 1e-9);
  assert.ok(Math.abs(result.operatingProfit - 117.8) < 1e-9);
});

test("stand quantities stay sold in tree sell-through scenarios and VAT is removed from registered sales", () => {
  const base = {
    products: [{ quantity: 2, wholesaleExVat: 10, retailPrice: 50 }],
    stands: [{ size: 10, quantity: 1 }],
    vatRegistered: true,
    vatRate: 0.2,
    paymentFeeRate: 0,
    vanDailyRateExVat: 0,
    driverHoursPerDay: 0,
    driverHourlyCost: 0,
    leafletBatchCostIncVat: 0,
  };
  const full = calculator.calculateBusiness({ ...base, sellThrough: 1 });
  const zero = calculator.calculateBusiness({ ...base, sellThrough: 0 });
  assert.equal(full.standsSold, 1);
  assert.equal(zero.standsSold, 1);
  assert.ok(Math.abs(full.standRevenue - 40 / 1.2) < 1e-9);
  assert.equal(full.standCost, 22);
  assert.equal(zero.treesSold, 0);
  assert.equal(zero.deliveryDays, 0);
  assert.ok(Math.abs(zero.operatingProfit - (40 / 1.2 - 42)) < 1e-9);
});

test("rejects invalid Cinco stand sizes and quantities", () => {
  assert.throws(() => calculator.calculateBusiness({ stands: [{ size: 12, quantity: 1 }] }), /Cinco stand size/i);
  assert.throws(() => calculator.calculateBusiness({ stands: [{ size: 6, quantity: -1 }] }), /non-negative/i);
  assert.throws(() => calculator.calculateBusiness({ stands: [{ size: 8, quantity: 1.5 }] }), /whole number/i);
});

test("stand contribution can make zero tree sales the break-even point", () => {
  const result = calculator.calculateBusiness({
    products: [{ quantity: 1, wholesaleExVat: 1, retailPrice: 0 }],
    stands: [{ size: 6, quantity: 1 }],
    vanDailyRateExVat: 0,
    driverHoursPerDay: 0,
    driverHourlyCost: 0,
    leafletBatchCostIncVat: 0,
  });
  assert.equal(result.breakEvenTrees, 0);
});
