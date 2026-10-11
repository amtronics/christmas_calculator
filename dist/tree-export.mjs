import { marketPrice, suggestedRetailPrice, treeRows, treeTypes } from "./tree-catalog.mjs";

export function treeOfferingsCsv(percentBelow) {
  const discount = Number(percentBelow);
  if (percentBelow === null || String(percentBelow).trim() === "" || !Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new RangeError("Enter a percentage between 0 and 100 before exporting.");
  }
  const rows = [
    ["Tree type", "Size", "We Tree Kings price (GBP)", `Below We Tree Kings price (${discount}% below, GBP)`],
    ...treeRows.map((row) => [
      treeTypes.find((type) => type.id === row.species).name,
      row.displaySize,
      marketPrice(row)?.price.toFixed(2) ?? "",
      suggestedRetailPrice(row, discount)?.toFixed(2) ?? "",
    ]),
  ];
  // UTF-8 BOM and CRLF keep the download compatible with Excel.
  return "\uFEFF" + rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\r\n") + "\r\n";
}
