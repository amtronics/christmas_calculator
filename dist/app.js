import { calculateBusiness, cincoStands } from "./calculator.mjs";
import { marketPrice, suggestedRetailPrice, supplierPrice, treeRows, treeTypes } from "./tree-catalog.mjs";

const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });
const moneyPrecise = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-GB", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

const form = document.querySelector("#calculator-form");
const resetButton = document.querySelector("#reset-calculator");
const errorBox = document.querySelector("#calculator-error");
const productBody = document.querySelector("#product-inputs");
const standBody = document.querySelector("#stand-inputs");
const economicsBody = document.querySelector("#product-economics");
const standEconomicsBody = document.querySelector("#stand-economics");
const scenariosBody = document.querySelector("#scenario-results");

const defaults = {
  premiumQuality: false,
  vatRegistered: false,
  vatRate: 20,
  sellThrough: 100,
  percentBelowMarket: 5,
  treesPerVanLoad: 30,
  collectionTripsPerDay: 2,
  treesPerDeliveryDay: 20,
  collectionRoundTripMiles: 0,
  vanDailyRateExVat: 47.86,
  driverHoursPerDay: 8,
  driverHourlyCost: 17.5,
  depotToFirstMiles: 12,
  routeMilesPerDay: 45,
  returnToDepotMiles: 12,
  vanMpg: 25,
  dieselPerLitre: 1.89,
  leafletResponseRate: 0.5,
  leafletBatchSize: 1000,
  leafletBatchCostIncVat: 50,
  storageCost: 0,
  insuranceCost: 0,
  paymentFeeRate: 0,
  disposalCostPerVan: 0,
  otherFixedCosts: 0,
};

function productRow(row, index) {
  const quote = supplierPrice(row, form.elements.premiumQuality.checked);
  const market = marketPrice(row);
  const quantity = row.defaultQuantity;
  const retail = suggestedRetailPrice(row, readNumber("percentBelowMarket")) ?? "";
  return `
    <tr data-product-row="${index}" data-row-id="${row.id}">
      <th scope="row">${row.displaySize}<small>${row.size} supplier</small></th>
      <td><span class="grade-tag" data-grade>${quote.grade}</span></td>
      <td><label class="sr-only" for="quantity-${index}">Quantity for ${treeTypes.find((type) => type.id === row.species).name}, ${row.displaySize}, supplier ${row.size}</label><input id="quantity-${index}" data-product="quantity" type="number" min="0" step="1" value="${quantity}"></td>
      <td><label class="sr-only" for="wholesale-${index}">Collection cost for ${treeTypes.find((type) => type.id === row.species).name}, ${row.displaySize}, supplier ${row.size}</label><div class="money-input"><span>£</span><input id="wholesale-${index}" data-product="wholesaleExVat" type="number" min="0" step="0.01" value="${quote.price}"></div></td>
      <td>${market ? `<a class="market-link" href="${market.url}" target="_blank" rel="noopener noreferrer">~${market.band} · ${money.format(market.price)}</a>` : `<span class="no-market">No match</span>`}</td>
      <td><label class="sr-only" for="retail-${index}">Selling price for ${treeTypes.find((type) => type.id === row.species).name}, ${row.displaySize}, supplier ${row.size}</label><div class="money-input"><span>£</span><input id="retail-${index}" data-product="retailPrice" type="number" min="0" step="0.01" placeholder="Set price" value="${retail}"></div></td>
    </tr>`;
}

function renderProductInputs() {
  productBody.innerHTML = treeTypes.map((type) => {
    const rows = treeRows.map((row, index) => ({ row, index })).filter(({ row }) => row.species === type.id);
    return `<tr class="group-row"><th colspan="6" scope="rowgroup">${type.name} <span>${rows.length} sizes</span></th></tr>`
      + rows.map(({ row, index }) => productRow(row, index)).join("");
  }).join("");
}

function renderStandInputs() {
  standBody.innerHTML = cincoStands.map((stand) => `
    <tr data-stand-size="${stand.size}">
      <th scope="row">${stand.name}</th>
      <td><label class="sr-only" for="stand-${stand.size}">${stand.name} stands sold</label><input id="stand-${stand.size}" data-stand-quantity type="number" min="0" step="1" value="0"></td>
      <td>${moneyPrecise.format(stand.wholesaleExVat)}</td>
      <td>${moneyPrecise.format(stand.retailPrice)}</td>
    </tr>`).join("");
}

function syncPremiumPrices() {
  for (const rowElement of productBody.querySelectorAll("[data-product-row]")) {
    const row = treeRows[Number(rowElement.dataset.productRow)];
    const quote = supplierPrice(row, form.elements.premiumQuality.checked);
    rowElement.querySelector("[data-grade]").textContent = quote.grade;
    rowElement.querySelector('[data-product="wholesaleExVat"]').value = String(quote.price);
  }
}

function syncMarketPrices() {
  const discount = readNumber("percentBelowMarket");
  for (const rowElement of productBody.querySelectorAll("[data-product-row]")) {
    const row = treeRows[Number(rowElement.dataset.productRow)];
    const suggested = suggestedRetailPrice(row, discount);
    if (suggested !== null) rowElement.querySelector('[data-product="retailPrice"]').value = String(suggested);
  }
}

function readNumber(name) {
  return Number(form.elements[name]?.value ?? 0);
}

function readProducts() {
  return [...productBody.querySelectorAll("[data-product-row]")].map((rowElement) => {
    const row = treeRows[Number(rowElement.dataset.productRow)];
    const type = treeTypes.find((item) => item.id === row.species);
    const wholesale = rowElement.querySelector('[data-product="wholesaleExVat"]').value;
    const retail = rowElement.querySelector('[data-product="retailPrice"]').value;
    return {
      species: row.species,
      name: type.name,
      grade: rowElement.querySelector("[data-grade]").textContent,
      size: row.displaySize,
      supplierSize: row.size,
      quantity: Number(rowElement.querySelector('[data-product="quantity"]').value),
      wholesaleExVat: wholesale === "" ? null : Number(wholesale),
      retailPrice: retail === "" ? null : Number(retail),
    };
  });
}

function readStands() {
  return [...standBody.querySelectorAll("[data-stand-size]")].map((row) => ({
    size: Number(row.dataset.standSize),
    quantity: Number(row.querySelector("[data-stand-quantity]").value),
  }));
}

function readState() {
  return {
    vatRegistered: form.elements.vatRegistered.checked,
    vatRate: readNumber("vatRate") / 100,
    sellThrough: readNumber("sellThrough") / 100,
    products: readProducts(),
    stands: readStands(),
    treesPerVanLoad: readNumber("treesPerVanLoad"),
    collectionTripsPerDay: readNumber("collectionTripsPerDay"),
    treesPerDeliveryDay: readNumber("treesPerDeliveryDay"),
    collectionRoundTripMiles: readNumber("collectionRoundTripMiles"),
    vanDailyRateExVat: readNumber("vanDailyRateExVat"),
    driverHoursPerDay: readNumber("driverHoursPerDay"),
    driverHourlyCost: readNumber("driverHourlyCost"),
    depotToFirstMiles: readNumber("depotToFirstMiles"),
    routeMilesPerDay: readNumber("routeMilesPerDay"),
    returnToDepotMiles: readNumber("returnToDepotMiles"),
    vanMpg: readNumber("vanMpg"),
    dieselPerLitre: readNumber("dieselPerLitre"),
    leafletResponseRate: readNumber("leafletResponseRate") / 100,
    leafletBatchSize: readNumber("leafletBatchSize"),
    leafletBatchCostIncVat: readNumber("leafletBatchCostIncVat"),
    storageCost: readNumber("storageCost"),
    insuranceCost: readNumber("insuranceCost"),
    paymentFeeRate: readNumber("paymentFeeRate") / 100,
    disposalCostPerVan: readNumber("disposalCostPerVan"),
    otherFixedCosts: readNumber("otherFixedCosts"),
  };
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function renderEconomics(result) {
  economicsBody.innerHTML = result.products.filter((product) => product.quantity > 0).map((product) => {
    const margin = product.netPrice === 0 ? null : product.profitPerTreeAfterSharedCosts / product.netPrice;
    return `
      <tr>
        <th scope="row">${product.name}<small>${product.grade} · ${product.size} (${product.supplierSize})</small></th>
        <td>${product.quantity}</td>
        <td>${moneyPrecise.format(product.unitCost)}</td>
        <td>${moneyPrecise.format(product.netPrice)}</td>
        <td class="${product.profitPerTreeAfterSharedCosts < 0 ? "negative" : ""}">${moneyPrecise.format(product.profitPerTreeAfterSharedCosts)}</td>
        <td>${margin === null ? "—" : percent.format(margin)}</td>
      </tr>`;
  }).join("");
}

function renderStandEconomics(result, paymentFeeRate) {
  standEconomicsBody.innerHTML = result.stands.filter((stand) => stand.quantity > 0).map((stand) => {
    const contribution = stand.netPrice * (1 - paymentFeeRate) - stand.unitCost;
    return `<tr><th scope="row">${stand.name}</th><td>${stand.quantity}</td><td>${moneyPrecise.format(stand.unitCost)}</td><td>${moneyPrecise.format(stand.netPrice)}</td><td class="${contribution < 0 ? "negative" : ""}">${moneyPrecise.format(contribution)}</td></tr>`;
  }).join("");
}

function renderScenarios(state) {
  scenariosBody.innerHTML = [1, 0.9, 0.8, 0.7, 0.6].map((sellThrough) => {
    const scenario = calculateBusiness({ ...state, sellThrough });
    return `
      <tr>
        <th scope="row">${percent.format(sellThrough)}</th>
        <td>${scenario.treesSold}</td>
        <td>${money.format(scenario.revenue)}</td>
        <td class="${scenario.operatingProfit < 0 ? "negative" : ""}">${money.format(scenario.operatingProfit)}</td>
        <td>${scenario.operatingMargin === null ? "—" : percent.format(scenario.operatingMargin)}</td>
      </tr>`;
  }).join("");
}

function renderResult(result, state) {
  setText("result-profit", money.format(result.operatingProfit));
  setText("result-revenue", money.format(result.revenue));
  setText("result-costs", money.format(result.totalCosts));
  setText("result-margin", result.operatingMargin === null ? "—" : percent.format(result.operatingMargin));
  setText("result-purchased", result.treesPurchased.toLocaleString("en-GB"));
  setText("result-sold", result.treesSold.toLocaleString("en-GB"));
  setText("result-stands-sold", result.standsSold.toLocaleString("en-GB"));
  setText("result-stand-contribution", money.format(result.standRevenue * (1 - state.paymentFeeRate) - result.standCost));
  setText("result-break-even", result.breakEvenTrees === null ? "—" : result.breakEvenTrees.toLocaleString("en-GB"));
  setText("result-mileage", `${Math.round(result.totalMiles).toLocaleString("en-GB")} mi`);
  setText("result-collection-trips", result.collectionTrips.toLocaleString("en-GB"));
  setText("result-collection-days", result.collectionDays.toLocaleString("en-GB"));
  setText("result-delivery-days", result.deliveryDays.toLocaleString("en-GB"));
  setText("result-van-days", result.vanHireDays.toLocaleString("en-GB"));
  setText("result-van-cost", moneyPrecise.format(result.vanHireCost));
  setText("result-driver-cost", moneyPrecise.format(result.driverCost));
  setText("result-leaflets-needed", result.leafletsNeeded.toLocaleString("en-GB"));
  setText("result-leaflets-printed", result.leafletsPrinted.toLocaleString("en-GB"));
  setText("result-leaflet-cost", moneyPrecise.format(result.leafletCost));
  setText("result-disposal-trips", result.disposalTrips.toLocaleString("en-GB"));
  setText("result-disposal-cost", moneyPrecise.format(result.disposalCost));
  setText("result-fuel", moneyPrecise.format(result.fuelCost));
  setText("result-inventory", money.format(result.inventoryCost));
  setText("result-stand-revenue", money.format(result.standRevenue));
  setText("result-stand-cost", money.format(result.standCost));
  setText("result-operating", money.format(result.operatingCosts));
  setText("sell-through-label", percent.format(state.sellThrough));
  document.querySelector("#profit-card").classList.toggle("loss", result.operatingProfit < 0);
  const difference = result.breakEvenTrees === null ? null : result.treesSold - result.breakEvenTrees;
  setText("break-even-message", difference === null
    ? result.treesPurchased === 0 ? "Add stock and prices to calculate break-even." : "Break-even is not reached within planned stock."
    : difference >= 0
      ? `${difference} trees above break-even at this sell-through.`
      : `${Math.abs(difference)} trees below break-even at this sell-through.`);
  renderEconomics(result);
  renderStandEconomics(result, state.paymentFeeRate);
  renderScenarios(state);
}

function calculateAndRender() {
  const total = [...productBody.querySelectorAll('[data-product="quantity"]')].reduce((sum, field) => sum + (Number(field.value) || 0), 0);
  setText("total-trees-input", total.toLocaleString("en-GB"));
  try {
    const discountValue = form.elements.percentBelowMarket.value;
    if (discountValue === "" || !Number.isFinite(Number(discountValue)) || Number(discountValue) < 0 || Number(discountValue) > 100) {
      throw new RangeError("Price below We Tree Kings must be between 0% and 100%.");
    }
    const state = readState();
    const result = calculateBusiness(state);
    errorBox.hidden = true;
    renderResult(result, state);
    return { state, result };
  } catch (error) {
    errorBox.textContent = error instanceof Error ? error.message : "Check the calculator inputs.";
    errorBox.hidden = false;
    for (const id of ["result-profit", "result-revenue", "result-costs", "result-margin", "result-break-even", "result-purchased", "result-sold", "result-stands-sold", "result-stand-contribution", "result-stand-revenue", "result-stand-cost", "result-mileage", "result-fuel", "result-inventory", "result-operating", "result-collection-trips", "result-collection-days", "result-delivery-days", "result-van-days", "result-van-cost", "result-driver-cost", "result-leaflets-needed", "result-leaflets-printed", "result-leaflet-cost", "result-disposal-trips", "result-disposal-cost"]) {
      setText(id, "—");
    }
    setText("break-even-message", "Complete the selected tree prices to calculate profit.");
    economicsBody.innerHTML = "";
    standEconomicsBody.innerHTML = "";
    scenariosBody.innerHTML = "";
    return null;
  }
}

function resetCalculator() {
  Object.entries(defaults).forEach(([name, value]) => {
    const field = form.elements[name];
    if (!field) return;
    if (field.type === "checkbox") field.checked = Boolean(value);
    else field.value = String(value);
  });
  renderProductInputs();
  renderStandInputs();
  calculateAndRender();
}

form.addEventListener("input", (event) => {
  if (event.target.matches('[data-product="wholesaleExVat"]')) {
    event.target.closest("[data-product-row]").querySelector("[data-grade]").textContent = "Custom";
  }
  if (event.target.name === "percentBelowMarket") {
    const discount = Number(event.target.value);
    if (event.target.value !== "" && Number.isFinite(discount) && discount >= 0 && discount <= 100) syncMarketPrices();
  }
  calculateAndRender();
});
form.addEventListener("change", (event) => {
  if (event.target.name === "premiumQuality") syncPremiumPrices();
  calculateAndRender();
});
resetButton.addEventListener("click", resetCalculator);

function registerWebMcp() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const fields = Object.keys(defaults).filter((name) => !["vatRegistered", "premiumQuality"].includes(name));
  try {
    void Promise.resolve(context.registerTool({
      name: "set_tree_calculator_inputs",
      title: "Set Christmas tree calculator inputs",
      description: "Update the self-delivery margin calculator, including the global Premium quality setting and individual stock rows.",
      inputSchema: {
        type: "object",
        properties: {
          premiumQuality: { type: "boolean" },
          vatRegistered: { type: "boolean" },
          ...Object.fromEntries(fields.map((name) => [name, { type: "number", minimum: 0 }])),
          rows: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "string", enum: treeRows.map((row) => row.id) },
                quantity: { type: "number", minimum: 0 },
                retailPrice: { type: "number", minimum: 0 },
              },
              required: ["id"],
              additionalProperties: false,
            },
          },
          stands: {
            type: "array",
            items: {
              type: "object",
              properties: { size: { type: "number", enum: [6, 8, 10] }, quantity: { type: "number", minimum: 0 } },
              required: ["size", "quantity"],
              additionalProperties: false,
            },
          },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Inputs must be an object.");
        for (const [name, value] of Object.entries(input)) {
          if (name === "rows" || name === "stands") continue;
          const field = form.elements[name];
          if (!field) continue;
          if (field.type === "checkbox") field.checked = Boolean(value);
          else field.value = String(value);
        }
        if (input.premiumQuality !== undefined) syncPremiumPrices();
        if (input.percentBelowMarket !== undefined) syncMarketPrices();
        for (const update of input.rows ?? []) {
          const index = treeRows.findIndex((row) => row.id === update.id);
          if (index < 0) throw new RangeError(`Unknown tree row: ${update.id}`);
          const rowElement = productBody.querySelector(`[data-product-row="${index}"]`);
          if (update.quantity !== undefined) rowElement.querySelector('[data-product="quantity"]').value = String(update.quantity);
          if (update.retailPrice !== undefined) rowElement.querySelector('[data-product="retailPrice"]').value = String(update.retailPrice);
        }
        for (const update of input.stands ?? []) {
          const standElement = standBody.querySelector(`[data-stand-size="${update.size}"]`);
          if (!standElement) throw new RangeError(`Unknown Cinco stand size: ${update.size}`);
          standElement.querySelector("[data-stand-quantity]").value = String(update.quantity);
        }
        const output = calculateAndRender();
        if (!output) throw new RangeError(errorBox.textContent);
        return {
          treesPurchased: output.result.treesPurchased,
          standsSold: output.result.standsSold,
          standRevenue: output.result.standRevenue,
          standCost: output.result.standCost,
          revenue: output.result.revenue,
          totalCosts: output.result.totalCosts,
          operatingProfit: output.result.operatingProfit,
          operatingMargin: output.result.operatingMargin,
          breakEvenTrees: output.result.breakEvenTrees,
          totalMiles: output.result.totalMiles,
          vanHireDays: output.result.vanHireDays,
          leafletsNeeded: output.result.leafletsNeeded,
          leafletsPrinted: output.result.leafletsPrinted,
          disposalTrips: output.result.disposalTrips,
          disposalCost: output.result.disposalCost,
        };
      },
    })).catch(() => {});
  } catch {
    // Browsers without WebMCP use the visible calculator normally.
  }
}

resetCalculator();
registerWebMcp();
