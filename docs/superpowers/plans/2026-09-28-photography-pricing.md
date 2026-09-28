# Christmas Portrait Pricing Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent, local Christmas-portrait pricing calculator with three packages, editable costs and volumes, and explicit fee-cap and loss warnings.

**Architecture:** A pure photography calculation module supplies package defaults and financial results. A separate HTML page and browser script render/edit that model beside the existing tree page, with navigation links but no shared financial totals.

**Tech Stack:** Vanilla HTML/CSS/ES modules, Node built-in test runner, existing `server.mjs`; no new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-28-photography-pricing-design.md`

## Global Constraints

- Existing tree calculations and displayed totals must not change.
- Classic: vetted photographer, 30 minutes, 5 edited images, £229 price, £125 all-inclusive fee cap, £20 marketing/admin allowance.
- Signature: experienced photographer, 60 minutes, 12 images, £329 price, £180 fee cap, £25 allowance.
- Heirloom: senior photographer, 90 minutes, 25 images, £499 price, £275 fee cap, £35 allowance.
- Defaults: zero bookings, actual photographer fee equal to its cap, VAT registered on at 20%, payment fee 2% of gross customer price, other photography fixed costs £0.
- Photographer fees include travel, setup, shoot, editing and digital delivery; model the full fee as a cost without assumed input-VAT recovery.
- The app stays localhost-only, client-side, without storage, customer data, scheduling or payment collection.
- This workspace is not a Git repository. Do not initialise one merely to satisfy commit steps; report that commits are unavailable.
- Node is not on the user's PATH. Use the bundled executable documented in `README.md` for test and server commands.

## Review Focus

- A zero VAT rate with VAT registration on should keep net revenue equal to the customer price, not divide incorrectly; test in Task 1.
- Fractional or negative booking counts must be rejected instead of silently rounded; test in Task 1.
- A photographer fee above cap must warn even if the package remains profitable; test in Task 1.
- Zero bookings plus a positive fixed cost must show an overall loss, not zero profit; test in Task 1.
- VAT and payment fee rates outside 0–100% must be rejected; test in Task 1.

---

### Task 1: Pure photography economics

**Files:**
- Create: `dist/photography-calculator.mjs`
- Create: `tests/photography.test.mjs`
- Modify: `package.json` (`test` script must discover both the existing and new test files; use `node --test`)

**Interfaces:**
- Produces `photoPackages`: array of `{ id, name, photographerLevel, shootMinutes, editedImages, price, bookings, photographerFee, photographerFeeCap, marketingAdminCost }` for `classic`, `signature`, `heirloom` in that order.
- Produces `calculatePhotography(input = {})`: accepts `{ vatRegistered = true, vatRate = 0.2, paymentFeeRate = 0.02, otherFixedCosts = 0, packages = photoPackages }` and returns `{ packages: packageResults, bookings, grossReceipts, revenue, photographerCost, marketingAdminCost, paymentFees, otherFixedCosts, totalCosts, operatingProfit, operatingMargin, anyOverFeeCap, lossMaking }`.
- Each package result retains its editable inputs and adds `netRevenuePerBooking`, `paymentFeePerBooking`, `contributionPerBooking`, `grossReceipts`, `revenue`, `photographerCost`, `marketingAdminCost`, `paymentFees`, `contribution`, `margin`, `overFeeCap`, `lossMaking`.
- `revenue` is net of output VAT when registered; `grossReceipts` is the displayed customer price multiplied by bookings. `operatingMargin` is `operatingProfit / revenue`, or `null` at zero revenue.

- [ ] **Step 1: Write failing default-package and arithmetic tests in `tests/photography.test.mjs`.**

```js
import test from "node:test";
import assert from "node:assert/strict";
const { photoPackages, calculatePhotography } = await import("../dist/photography-calculator.mjs").catch(() => ({}));
test("approved portrait packages produce conservative booking contributions", () => {
assert.equal(typeof calculatePhotography, "function");
assert.deepEqual(photoPackages.map(({ name, shootMinutes, editedImages, price, photographerFeeCap }) => [name, shootMinutes, editedImages, price, photographerFeeCap]), [
  ["Classic", 30, 5, 229, 125], ["Signature", 60, 12, 329, 180], ["Heirloom", 90, 25, 499, 275],
]);
assert.deepEqual(photoPackages.map(({ bookings, photographerFee, marketingAdminCost }) => [bookings, photographerFee, marketingAdminCost]), [
  [0, 125, 20], [0, 180, 25], [0, 275, 35],
]);
const result = calculatePhotography({ packages: photoPackages.map((row) => ({ ...row, bookings: 1 })) });
assert.deepEqual(result.packages.map((row) => Number(row.contributionPerBooking.toFixed(2))), [41.25, 62.59, 95.85]);
assert.equal(result.bookings, 3);
assert.equal(Number(result.operatingProfit.toFixed(2)), 199.69);
});
```

- [ ] **Step 2: Run the new test and confirm it fails because the module/exports do not exist.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/photography.test.mjs`

- [ ] **Step 3: Implement `photoPackages` and `calculatePhotography(input)` in `dist/photography-calculator.mjs`.**

Use the spec's arithmetic per package; sum package results and subtract `otherFixedCosts` once. Implement only what the Step 1 test requires at this stage; validation and warning cases receive their own red-green cycle in Steps 5–8.

- [ ] **Step 4: Run the new test and confirm the defaults and arithmetic pass.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/photography.test.mjs`

- [ ] **Step 5: Add edge-case tests to `tests/photography.test.mjs`.**

```js
assert.equal(calculatePhotography({ vatRate: 0, packages: [{ ...photoPackages[0], bookings: 1 }] }).packages[0].netRevenuePerBooking, 229);
assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], bookings: 1.5 }] }), /whole number/i);
assert.throws(() => calculatePhotography({ packages: [{ ...photoPackages[0], bookings: -1 }] }), /non-negative/i);
const highFee = calculatePhotography({ packages: [{ ...photoPackages[0], photographerFee: 126 }] });
assert.equal(highFee.packages[0].overFeeCap, true);
assert.equal(highFee.packages[0].lossMaking, false);
assert.equal(calculatePhotography({ packages: [], otherFixedCosts: 12 }).operatingProfit, -12);
assert.throws(() => calculatePhotography({ vatRate: 1.01 }), /VAT rate/i);
assert.throws(() => calculatePhotography({ paymentFeeRate: 1.01 }), /payment fee/i);
```

Add separate named tests with these exact assertions: unregistered Classic net revenue per booking is `229` and contribution rounds to `79.42`; Classic with fee `200` is `lossMaking: true`; negative price and `NaN` fee throw; unknown and duplicate package IDs throw; zero bookings gives `operatingMargin: null`; and two Classic plus one Signature booking yields three bookings and operating profit rounding to `145.09`. Also test a negative rate (as well as the rates above 100% shown in the snippet). Keep the fee-cap result based on the per-booking contribution even when bookings are zero.

- [ ] **Step 6: Run the edge-case tests and confirm each fails for its intended missing behavior.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/photography.test.mjs`

- [ ] **Step 7: Implement the minimum validation and warning changes in `dist/photography-calculator.mjs`.**

Keep the Task 1 interface unchanged; cover the assertions from Step 5.

- [ ] **Step 8: Re-run the photography tests and confirm all edge cases pass.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test tests/photography.test.mjs`

- [ ] **Step 9: Change `package.json` test script to `node --test`, then run the complete suite.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test`
Expected: Existing tree/stand tests and new photography tests pass with zero failures.

- [ ] **Step 10: Check version-control availability.** If the folder remains non-Git, record that this task cannot be committed; do not initialise Git.

### Task 2: Photography page and navigation

**Files:**
- Create: `dist/photography.html`
- Create: `dist/photography.js`
- Modify: `dist/index.html` (add a link to `./photography.html`, without changing the tree form)
- Modify: `dist/styles.css` (only shared or photography-specific presentation needed for the new page)
- Modify: `README.md` (local route, assumptions and exclusions)

**Interfaces:**
- Consumes `photoPackages` and `calculatePhotography(input)` from Task 1.
- `photography.html` provides form inputs for package price, bookings, actual all-inclusive fee, fee cap, marketing/admin allowance; global VAT registration/rate, payment fee rate, other fixed costs; per-package and overall result regions; reset button and Trees link.
- `photography.js` reads form inputs into Task 1's input shape, renders amounts/warnings, and resets to `photoPackages` plus global defaults. No storage or network calls.

- [ ] **Step 1: Verify the local server's `/photography.html` route is absent before creating the page.**

Run the existing `server.mjs` with the bundled Node executable if needed, then request `http://127.0.0.1:4173/photography.html`.
Expected: HTTP 404 (red integration check).

- [ ] **Step 2: Create `dist/photography.html` with the package inputs and result regions.**

Include a script tag for `./photography.js`; package rows may be generated by that script. Provide labelled inputs and results for all fields specified in this task's Interfaces block.

- [ ] **Step 3: Implement `dist/photography.js` using Task 1's `calculatePhotography(input)`.**

Render three rows with the exact package names, levels, durations, image counts and defaults in the spec. Calculate on input/change without page reload. Show gross receipts, net revenue, photographer cost, marketing/admin cost, payment fees, fixed costs, profit and margin. Distinguish per-booking contribution from total projected operating profit. If a form value is invalid, show a clear error and suppress stale results. Show fee-cap warnings and loss warnings separately, including with zero bookings. Reset restores all defaults.

- [ ] **Step 4: Add navigation and focused styling.**

Link to `./photography.html` from `dist/index.html` and back to `./index.html` on the photography page. Add only the CSS needed to keep the inputs, results and warnings readable on desktop and mobile.

- [ ] **Step 5: Reload the local page and verify the red route is green and inputs affect real calculations.**

Browser checks: three package rows; zero bookings and £0 projected profit at defaults; one booking in each tier shows £41.25/£62.59/£95.85 per-booking contribution and £199.69 total profit (rounded); changing Classic's fee to £126 shows the fee-cap warning while still profitable; making it high enough to lose money shows both warnings; setting other fixed costs to £12 with zero bookings shows -£12 overall; reset restores starting values. Confirm `./index.html` returns to the unchanged tree calculator and the Photography link returns to this page.

- [ ] **Step 6: Update `README.md` with the photography route, packages and profit caveat.**

Document the customer prices, fee caps, VAT/payment assumptions, and the fact that these are planning contributions rather than guaranteed profit.

- [ ] **Step 7: Run syntax checks and the complete test suite.**

Run: `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --check dist/photography.js` and `& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test`.
Expected: zero syntax errors and zero test failures.

- [ ] **Step 8: Check version-control availability.** If still non-Git, report that no commit was possible; do not initialise Git.
