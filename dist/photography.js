import { photoPackages, calculatePhotography } from "./photography-calculator.mjs";

const form = document.getElementById("photo-form");
const packageInputs = document.getElementById("photo-package-inputs");
const error = document.getElementById("photo-error");
const results = document.getElementById("photo-results");
const economicsPanel = document.getElementById("photo-economics-panel");
const money = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const percent = new Intl.NumberFormat("en-GB", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

function write(id, value) {
  document.getElementById(id).textContent = value;
}

function numberField(id, label) {
  const raw = document.getElementById(id).value.trim();
  if (raw === "") throw new RangeError(`${label} is required`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be a valid number`);
  return value;
}

function packageField(id, field, label) {
  return numberField(`${id}-${field}`, `${label} ${field.replaceAll("-", " ")}`);
}

function inputCell(item, field, label, { min = 0, step = "0.01" } = {}) {
  return `<td><label class="sr-only" for="${item.id}-${field}">${item.name} ${label}</label><input id="${item.id}-${field}" type="number" min="${min}" step="${step}" value="${item[field]}"></td>`;
}

function renderPackageInputs() {
  packageInputs.innerHTML = photoPackages.map((item) => `
    <tr>
      <th scope="row">${item.name}<small>${item.photographerLevel} · ${item.shootMinutes} min at home · ${item.editedImages} edited photos</small></th>
      ${inputCell(item, "price", "customer price")}
      ${inputCell(item, "bookings", "bookings", { step: "1" })}
      ${inputCell(item, "photographerFee", "all-inclusive photographer fee")}
      ${inputCell(item, "photographerFeeCap", "maximum photographer fee")}
      ${inputCell(item, "marketingAdminCost", "marketing and admin per booking")}
    </tr>`).join("");
}

function readPackages() {
  return photoPackages.map((item) => ({
    ...item,
    price: packageField(item.id, "price", item.name),
    bookings: packageField(item.id, "bookings", item.name),
    photographerFee: packageField(item.id, "photographerFee", item.name),
    photographerFeeCap: packageField(item.id, "photographerFeeCap", item.name),
    marketingAdminCost: packageField(item.id, "marketingAdminCost", item.name),
  }));
}

function calculateFromForm() {
  return calculatePhotography({
    vatRegistered: document.getElementById("photo-vat-registered").checked,
    vatRate: numberField("photo-vat-rate", "VAT rate") / 100,
    paymentFeeRate: numberField("photo-payment-rate", "Payment fee rate") / 100,
    otherFixedCosts: numberField("photo-fixed-costs", "Other photography fixed costs"),
    packages: readPackages(),
  });
}

function renderWarnings(calculation) {
  const warnings = [];
  for (const item of calculation.packages) {
    if (item.overFeeCap) warnings.push(`${item.name}: photographer fee exceeds the agreed cap of ${money.format(item.photographerFeeCap)}.`);
    if (item.lossMaking) warnings.push(`${item.name}: each booking loses ${money.format(-item.contributionPerBooking)} before other fixed costs.`);
  }
  if (calculation.lossMaking) warnings.push(`Overall projection is a loss of ${money.format(-calculation.operatingProfit)}.`);
  const container = document.getElementById("photo-warnings");
  container.replaceChildren(...warnings.map((message) => {
    const paragraph = document.createElement("p");
    paragraph.className = "photo-warning";
    paragraph.textContent = message;
    return paragraph;
  }));
}

function render(calculation) {
  write("photo-profit", money.format(calculation.operatingProfit));
  write("photo-profit-message", calculation.bookings === 0 ? "Enter bookings to project sales; fixed costs still apply." : "After the listed costs and VAT treatment.");
  write("photo-bookings", String(calculation.bookings));
  write("photo-margin", calculation.operatingMargin === null ? "—" : percent.format(calculation.operatingMargin));
  write("photo-gross", money.format(calculation.grossReceipts));
  write("photo-revenue", money.format(calculation.revenue));
  write("photo-photographer-cost", money.format(calculation.photographerCost));
  write("photo-admin-cost", money.format(calculation.marketingAdminCost));
  write("photo-payment-fees", money.format(calculation.paymentFees));
  write("photo-fixed-cost-total", money.format(calculation.otherFixedCosts));
  write("photo-total-costs", money.format(calculation.totalCosts));
  document.getElementById("photo-profit-card").classList.toggle("loss", calculation.lossMaking);

  document.getElementById("photo-economics").innerHTML = calculation.packages.map((item) => `
    <tr>
      <th scope="row">${item.name}<small>${item.bookings} booking${item.bookings === 1 ? "" : "s"}</small></th>
      <td>${money.format(item.netRevenuePerBooking)}</td>
      <td>${money.format(item.photographerFee)}</td>
      <td>${money.format(item.photographerFeeCap)}</td>
      <td>${money.format(item.marketingAdminCost)}</td>
      <td>${money.format(item.paymentFeePerBooking)}</td>
      <td class="${item.lossMaking ? "negative" : ""}">${money.format(item.contributionPerBooking)}</td>
      <td class="${item.contribution < 0 ? "negative" : ""}">${money.format(item.contribution)}</td>
      <td>${item.margin === null ? "—" : percent.format(item.margin)}</td>
    </tr>`).join("");
  renderWarnings(calculation);
}

function update() {
  try {
    const calculation = calculateFromForm();
    render(calculation);
    error.hidden = true;
    error.textContent = "";
    results.hidden = false;
    economicsPanel.hidden = false;
  } catch (caught) {
    error.textContent = caught.message;
    error.hidden = false;
    results.hidden = true;
    economicsPanel.hidden = true;
  }
}

form.addEventListener("input", update);
form.addEventListener("change", update);
form.addEventListener("submit", (event) => event.preventDefault());
document.getElementById("photo-reset").addEventListener("click", () => {
  renderPackageInputs();
  document.getElementById("photo-vat-registered").checked = true;
  document.getElementById("photo-vat-rate").value = "20";
  document.getElementById("photo-payment-rate").value = "2";
  document.getElementById("photo-fixed-costs").value = "0";
  update();
});

renderPackageInputs();
update();
