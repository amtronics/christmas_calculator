const LITRES_PER_IMPERIAL_GALLON = 4.54609;

export const cincoStands = Object.freeze([
  Object.freeze({ size: 6, name: 'Cinco 6 Advantage', wholesaleExVat: 11, retailPrice: 25 }),
  Object.freeze({ size: 8, name: 'Cinco 8 Advantage', wholesaleExVat: 14, retailPrice: 25 }),
  Object.freeze({ size: 10, name: 'Cinco 10 Express', wholesaleExVat: 22, retailPrice: 40 }),
]);

function nonNegative(value, label) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0) {
    throw new RangeError(`${label} must be a non-negative number.`);
  }
  return number;
}

function positive(value, label) {
  const number = nonNegative(value, label);
  if (number === 0) throw new RangeError(`${label} must be greater than zero.`);
  return number;
}

export function calculateVanPlan({ treesPurchased = 0, treesSold = 0, treesPerVanLoad = 30, collectionTripsPerDay = 2, treesPerDeliveryDay = 20 } = {}) {
  const purchased = nonNegative(treesPurchased, "Trees purchased");
  const sold = nonNegative(treesSold, "Trees sold");
  const collectionTrips = Math.ceil(purchased / positive(treesPerVanLoad, "Trees per van load"));
  const collectionDays = Math.ceil(collectionTrips / positive(collectionTripsPerDay, "Collection trips per day"));
  const deliveryDays = Math.ceil(sold / positive(treesPerDeliveryDay, "Trees per delivery day"));
  return { collectionTrips, collectionDays, deliveryDays, vanHireDays: collectionDays + deliveryDays };
}

export function calculateLeafletPlan({ treesSold = 0, leafletResponseRate = 0.005, leafletBatchSize = 1000, leafletBatchCostIncVat = 50 } = {}) {
  const sold = nonNegative(treesSold, "Trees sold");
  const responseRate = positive(leafletResponseRate, "Leaflet response rate");
  if (responseRate > 1) throw new RangeError("Leaflet response rate cannot exceed 100%.");
  const batchSize = positive(leafletBatchSize, "Leaflets per batch");
  const batchCost = nonNegative(leafletBatchCostIncVat, "Leaflet batch cost");
  const leafletsNeeded = Math.ceil(sold / responseRate);
  const leafletBatches = Math.ceil(leafletsNeeded / batchSize);
  return { leafletsNeeded, leafletBatches, leafletsPrinted: leafletBatches * batchSize, leafletCashCost: leafletBatches * batchCost };
}

export function calculateDeliveryMiles({
  deliveryDays = 0,
  depotToFirstMiles = 0,
  routeMilesPerDay = 0,
  returnToDepotMiles = 0,
} = {}) {
  const days = nonNegative(deliveryDays, "Delivery days");
  const outbound = nonNegative(depotToFirstMiles, "Depot-to-first-delivery mileage");
  const route = nonNegative(routeMilesPerDay, "Route mileage");
  const returnMiles = nonNegative(returnToDepotMiles, "Return mileage");
  return days * (outbound + route + returnMiles);
}

export function calculateBusiness(input = {}) {
  const vatRate = nonNegative(input.vatRate ?? 0.2, "VAT rate");
  const sellThrough = Number(input.sellThrough ?? 1);
  if (!Number.isFinite(sellThrough) || sellThrough < 0 || sellThrough > 1) {
    throw new RangeError("Sell-through must be between 0% and 100%.");
  }

  const vatRegistered = Boolean(input.vatRegistered);
  const purchaseVatFactor = vatRegistered ? 1 : 1 + vatRate;
  const salesVatFactor = vatRegistered ? 1 / (1 + vatRate) : 1;
  const products = Array.isArray(input.products) ? input.products : [];

  const productResults = products.map((product, index) => {
    const quantity = nonNegative(product.quantity, `Product ${index + 1} quantity`);
    if (quantity > 0 && (product.wholesaleExVat === null || product.wholesaleExVat === undefined || product.wholesaleExVat === "")) {
      throw new RangeError(`Enter a wholesale quote for ${product.grade ?? "selected"} ${product.name ?? `product ${index + 1}`}.`);
    }
    if (quantity > 0 && (product.retailPrice === null || product.retailPrice === undefined || product.retailPrice === "")) {
      throw new RangeError(`Enter a selling price for ${product.name ?? `product ${index + 1}`}, ${product.size ?? "selected size"}.`);
    }
    const wholesaleExVat = nonNegative(product.wholesaleExVat, `Product ${index + 1} wholesale cost`);
    const retailPrice = nonNegative(product.retailPrice, `Product ${index + 1} retail price`);
    const unitsSold = Math.round(quantity * sellThrough);
    const netPrice = retailPrice * salesVatFactor;
    const unitCost = wholesaleExVat * purchaseVatFactor;
    return {
      ...product,
      quantity,
      wholesaleExVat,
      retailPrice,
      unitsSold,
      netPrice,
      unitCost,
      revenue: unitsSold * netPrice,
      inventoryCost: quantity * unitCost,
    };
  });

  const stands = Array.isArray(input.stands) ? input.stands : [];
  const standResults = stands.map((stand) => {
    const quote = cincoStands.find((item) => item.size === Number(stand.size));
    if (!quote) throw new RangeError(`Cinco stand size ${stand.size} is not available.`);
    const quantity = nonNegative(stand.quantity, `${quote.name} quantity`);
    if (!Number.isInteger(quantity)) throw new RangeError(`${quote.name} quantity must be a whole number.`);
    const netPrice = quote.retailPrice * salesVatFactor;
    const unitCost = quote.wholesaleExVat * purchaseVatFactor;
    return { ...quote, quantity, netPrice, unitCost, revenue: quantity * netPrice, inventoryCost: quantity * unitCost };
  });

  const treesPurchased = productResults.reduce((sum, product) => sum + product.quantity, 0);
  const treesSold = productResults.reduce((sum, product) => sum + product.unitsSold, 0);
  const standRevenue = standResults.reduce((sum, stand) => sum + stand.revenue, 0);
  const standCost = standResults.reduce((sum, stand) => sum + stand.inventoryCost, 0);
  const standsSold = standResults.reduce((sum, stand) => sum + stand.quantity, 0);
  const revenue = productResults.reduce((sum, product) => sum + product.revenue, 0) + standRevenue;
  const inventoryCost = productResults.reduce((sum, product) => sum + product.inventoryCost, 0) + standCost;
  const fullSellThroughRevenue = productResults.reduce(
    (sum, product) => sum + product.quantity * product.netPrice,
    0,
  );

  const vanPlan = calculateVanPlan({
    treesPurchased, treesSold,
    treesPerVanLoad: input.treesPerVanLoad,
    collectionTripsPerDay: input.collectionTripsPerDay,
    treesPerDeliveryDay: input.treesPerDeliveryDay,
  });
  const collectionRoundTripMiles = nonNegative(input.collectionRoundTripMiles, "Collection return mileage");
  const deliveryMiles = calculateDeliveryMiles({ ...input, deliveryDays: vanPlan.deliveryDays });
  const collectionMiles = vanPlan.collectionTrips * collectionRoundTripMiles;
  const totalMiles = deliveryMiles + collectionMiles;
  const vanMpg = nonNegative(input.vanMpg, "Van MPG");
  const dieselPerLitre = nonNegative(input.dieselPerLitre, "Diesel price");
  const fuelCashCost = vanMpg === 0 ? 0 : (totalMiles / vanMpg) * LITRES_PER_IMPERIAL_GALLON * dieselPerLitre;
  const fuelCost = vatRegistered ? fuelCashCost / (1 + vatRate) : fuelCashCost;

  const vanDailyRateExVat = nonNegative(input.vanDailyRateExVat ?? 47.86, "Van daily rate");
  const vanHireCost = vanPlan.vanHireDays * vanDailyRateExVat * purchaseVatFactor;
  const driverCost =
    vanPlan.vanHireDays *
    nonNegative(input.driverHoursPerDay, "Driver hours") *
    nonNegative(input.driverHourlyCost, "Driver hourly cost");
  const leafletPlan = calculateLeafletPlan({
    treesSold,
    leafletResponseRate: input.leafletResponseRate,
    leafletBatchSize: input.leafletBatchSize,
    leafletBatchCostIncVat: input.leafletBatchCostIncVat,
  });
  const leafletCashCost = leafletPlan.leafletCashCost;
  const leafletCost = vatRegistered ? leafletCashCost / (1 + vatRate) : leafletCashCost;
  const storageCost = nonNegative(input.storageCost, "Storage cost");
  const insuranceCost = nonNegative(input.insuranceCost, "Insurance cost");
  const paymentFeeRate = nonNegative(input.paymentFeeRate, "Payment fee rate");
  const paymentFees = revenue * paymentFeeRate;
  const disposalCostPerVan = nonNegative(input.disposalCostPerVan, "All-in disposal trip cost");
  const disposalTrips = Math.ceil((treesPurchased - treesSold) / positive(input.treesPerVanLoad ?? 30, "Trees per van load"));
  const disposalCost = disposalTrips * disposalCostPerVan;
  const otherFixedCosts = nonNegative(input.otherFixedCosts, "Other fixed costs");

  const fixedOperatingCosts =
    vanHireCost +
    driverCost +
    fuelCost +
    leafletCost +
    storageCost +
    insuranceCost +
    otherFixedCosts;
  const operatingCosts = fixedOperatingCosts + paymentFees + disposalCost;
  const totalCosts = inventoryCost + operatingCosts;
  const operatingProfit = revenue - totalCosts;
  const operatingMargin = revenue === 0 ? null : operatingProfit / revenue;

  const averageNetPrice = treesPurchased === 0 ? 0 : fullSellThroughRevenue / treesPurchased;
  const contributionAfterFees = averageNetPrice * (1 - paymentFeeRate);
  let breakEvenTrees = null;
  if (contributionAfterFees > 0 || standRevenue > 0) {
    for (let count = 0; count <= treesPurchased; count += 1) {
      const candidateVan = calculateVanPlan({
        treesPurchased, treesSold: count,
        treesPerVanLoad: input.treesPerVanLoad,
        collectionTripsPerDay: input.collectionTripsPerDay,
        treesPerDeliveryDay: input.treesPerDeliveryDay,
      });
      const candidateLeaflets = calculateLeafletPlan({
        treesSold: count,
        leafletResponseRate: input.leafletResponseRate,
        leafletBatchSize: input.leafletBatchSize,
        leafletBatchCostIncVat: input.leafletBatchCostIncVat,
      });
      const candidateMiles = calculateDeliveryMiles({ ...input, deliveryDays: candidateVan.deliveryDays }) + collectionMiles;
      const candidateFuel = vanMpg === 0 ? 0 : (candidateMiles / vanMpg) * LITRES_PER_IMPERIAL_GALLON * dieselPerLitre / (vatRegistered ? 1 + vatRate : 1);
      const candidateCosts = inventoryCost + candidateVan.vanHireDays * vanDailyRateExVat * purchaseVatFactor
        + candidateVan.vanHireDays * input.driverHoursPerDay * input.driverHourlyCost
        + candidateFuel + candidateLeaflets.leafletCashCost / (vatRegistered ? 1 + vatRate : 1)
        + storageCost + insuranceCost + otherFixedCosts
        + Math.ceil((treesPurchased - count) / positive(input.treesPerVanLoad ?? 30, "Trees per van load")) * disposalCostPerVan;
      if (count * contributionAfterFees + standRevenue * (1 - paymentFeeRate) >= candidateCosts) {
        breakEvenTrees = count;
        break;
      }
    }
  }

  return {
    products: productResults.map((product) => ({
      ...product,
      sharedCostPerPurchasedTree: treesPurchased === 0 ? 0 : (operatingCosts - standRevenue * paymentFeeRate) / treesPurchased,
      profitPerTreeAfterSharedCosts:
        product.netPrice - product.unitCost - (treesPurchased === 0 ? 0 : (operatingCosts - standRevenue * paymentFeeRate) / treesPurchased),
    })),
    stands: standResults,
    standsSold,
    standRevenue,
    standCost,
    treesPurchased,
    treesSold,
    ...vanPlan,
    ...leafletPlan,
    deliveryMiles,
    collectionMiles,
    totalMiles,
    revenue,
    inventoryCost,
    fuelCost,
    vanHireCost,
    driverCost,
    leafletCost,
    paymentFees,
    disposalTrips,
    disposalCost,
    fixedOperatingCosts,
    operatingCosts,
    totalCosts,
    operatingProfit,
    operatingMargin,
    breakEvenTrees,
    fullSellThroughRevenue,
  };
}
