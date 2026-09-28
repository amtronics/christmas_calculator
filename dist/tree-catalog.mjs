// Cut, non-dowelled trees with numeric Bolton-yard collection quotes (ex VAT)
// in Bolton Christmas Trees' wholesale price list dated 24 August 2026.
// Each offer keeps its customer-facing foot band and the supplier's quoted cm band.
const supplierRows = [
  ["nordmann", "3-4 ft", "100-125 cm", { Premium: 19.55 }],
  ["nordmann", "4-5 ft", "125-150 cm", { Premium: 20.1, Standard: 18.85 }],
  ["nordmann", "5-6 ft", "150-175 cm", { Premium: 26.35, Standard: 22.3 }],
  ["nordmann", "6-7 ft", "175-200 cm", { Premium: 30.55, Standard: 25.3, Regular: 21.05 }],
  ["nordmann", "7-8 ft", "225-250 cm", { Premium: 50.5 }],
  ["nordmann", "8-9 ft", "250-275 cm", { Premium: 58 }],
  ["nordmann", "9-10 ft", "275-300 cm", { Premium: 65 }],
  ["nordmann", "10-11 ft", "300-330 cm", { Premium: 85, Standard: 65 }],
  ["nordmann", "11-12 ft", "330-360 cm", { Premium: 105, Standard: 80 }],
  ["norway", "4-5 ft", "150-175 cm", { Premium: 17.9 }],
  ["norway", "5-6 ft", "175-200 cm", { Premium: 19.6 }],
  ["fraser", "5-6 ft", "150-175 cm", { Premium: 26.55 }],
  ["fraser", "6-7 ft", "175-200 cm", { Premium: 30.3 }],
  ["noble", "4-5 ft", "150-175 cm", { Premium: 27.5 }],
  ["noble", "5-6 ft", "175-200 cm", { Premium: 33 }],
  ["noble", "6-7 ft", "200-225 cm", { Premium: 41 }],
];

export const treeTypes = [
  { id: "nordmann", name: "Nordmann Fir", marketUrl: "https://www.wetreekings.com/products/nordmann-fir-non-drop" },
  { id: "norway", name: "Norway Spruce", marketUrl: "https://www.wetreekings.com/products/norway-spruce" },
  { id: "fraser", name: "Fraser Fir", marketUrl: "https://www.wetreekings.com/products/fraser-fir" },
  { id: "noble", name: "Noble Fir", marketUrl: "https://www.wetreekings.com/products/noble-fir-non-drop" },
];

// Public We Tree Kings cut-tree variant prices checked 22 September 2026.
// Comparisons follow the offered foot band, not the supplier's cm band.
const marketBands = {
  nordmann: [
    [3, 4, "3–4 ft", 79], [4, 5, "4–5 ft", 89], [5, 6, "5–6 ft", 109],
    [6, 7, "6–7 ft", 119], [7, 8, "7–8 ft", 129], [8, 9, "8–9 ft", 149],
    [9, 10, "9–10 ft", 179], [10, 11, "10–11 ft", 199], [11, 12, "11–12 ft", 235],
  ],
  fraser: [[5, 6, "5–6 ft", 109], [6, 7, "6–7 ft", 125], [7, 8, "7–8 ft", 135]],
  noble: [[5, 6, "5–6 ft", 120], [6, 7, "6–7 ft", 130], [7, 8, "7–8 ft", 140]],
  norway: [
    [3, 4, "3–4 ft", 75], [4, 5, "4–5 ft", 80], [5, 7, "5–7 ft", 90],
    [7, 9, "7–9 ft", 110], [9, 10, "9–10 ft", 145], [10, 11, "10–11 ft", 169],
    [11, 12, "11-12 ft", 199],
  ],
};

const defaultQuantities = {
  "nordmann-175-200": 60,
  "norway-175-200": 10,
  "fraser-175-200": 20,
  "noble-175-200": 10,
};

export const treeRows = supplierRows.map(([species, displaySize, size, prices]) => ({
  id: `${species}-${size.match(/\d+/g).join("-")}`,
  species,
  displaySize,
  size,
  prices,
  defaultQuantity: defaultQuantities[`${species}-${size.match(/\d+/g).join("-")}`] ?? 0,
}));

export function supplierPrice(row, premiumQuality) {
  const baseGrade = ["Standard", "Regular", "Value"].find((grade) => row.prices[grade] !== undefined);
  const grade = premiumQuality
    ? (row.prices.Premium !== undefined ? "Premium" : baseGrade)
    : (baseGrade ?? "Premium");
  return { grade, price: row.prices[grade] };
}

export function marketPrice(row) {
  const match = row.displaySize?.match(/^(\d+)-(\d+) ft$/);
  if (!match) return null;
  const midpointFt = (Number(match[1]) + Number(match[2])) / 2;
  const band = marketBands[row.species]?.find(([min, max]) => midpointFt >= min && midpointFt < max);
  return band ? { band: band[2], price: band[3], url: treeTypes.find((type) => type.id === row.species)?.marketUrl } : null;
}

export function suggestedRetailPrice(row, percentBelow) {
  const discount = Number(percentBelow);
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new RangeError("Price below We Tree Kings must be between 0% and 100%.");
  }
  const market = marketPrice(row);
  return market ? Math.round(market.price * (100 - discount)) / 100 : null;
}
