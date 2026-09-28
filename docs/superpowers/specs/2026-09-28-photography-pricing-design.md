# Standalone Christmas portrait pricing calculator

Date: 28 September 2026

## Purpose and scope

Add a separate Photography page to the existing localhost Christmas-tree calculator. It is an internal planning tool for a standalone, at-home Christmas portrait service in the Manchester area. It does not collect customer details, book appointments, take payments, assign photographers, or alter the tree calculator's totals.

The aim is to advertise three fixed customer prices while monitoring whether an agreed all-inclusive freelancer fee leaves a healthy contribution. No price can guarantee profit against unbounded refunds, reshoots, travel, or overhead; the calculator will show assumptions and flag fee-cap or loss breaches.

## Packages and starting assumptions

| Package | Photographer level | Shoot time at home | Edited digital images | Customer price | Default maximum all-inclusive photographer fee | Default marketing/admin allowance |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| Classic | Vetted | 30 minutes | 5 | £229 | £125 | £20 |
| Signature | Experienced | 60 minutes | 12 | £329 | £180 | £25 |
| Heirloom | Senior | 90 minutes | 25 | £499 | £275 | £35 |

Customer prices, photographer fees, fee caps, marketing/admin allowances, and booking quantities are editable. Booking quantities start at zero. The default actual fee equals the cap, modelling the conservative permitted quote. Each photographer fee is treated as a full, all-inclusive cost covering travel, setup, shoot, editing and digital delivery; no input-VAT recovery is assumed for that fee. The customer price includes VAT when the business is VAT-registered.

Other defaults: VAT-registered on, VAT rate 20%, payment fee 2% of gross customer receipts, and other photography fixed costs £0. The fixed-cost input makes exclusions visible rather than silently assuming they do not exist. Standard-rate VAT is currently 20% according to [GOV.UK](https://www.gov.uk/vat-rates).

For market context, Manchester-area providers advertise £200 for a 45-minute at-home shoot ([Kelly Clarke Photography](https://kellyclarke.co.uk/galleries/families/)) and £275 for an hour at home with 10 edited images ([Chloe Rose Photography](https://chloerosephotography.co.uk/family-photography/)). These are comparators, not photographer subcontractor quotes.

## Calculation

For each package, with price `P`, bookings `Q`, all-inclusive photographer fee `F`, marketing/admin allowance `A`, payment fee rate `c`, VAT rate `v`, and registration flag `R`:

- Net revenue per booking = `P / (1 + v)` if `R`, otherwise `P`.
- Payment fee per booking = `P × c`.
- Modelled contribution per booking = net revenue − `F` − `A` − payment fee.
- Package projected contribution = `Q × contribution per booking`.
- Package margin = contribution per booking / net revenue, or blank when revenue is zero.
- Total projected operating profit = sum of package contributions − other photography fixed costs.

The same formula applies to every tier; only the starting values differ. At default fees/caps, the VAT-registered, 20%-VAT, 2%-payment-fee model yields approximately £41.25, £62.59, and £95.85 contribution per Classic, Signature, and Heirloom booking, before any other fixed costs. These figures are assumptions, not guaranteed profit.

The page flags a package when its entered photographer fee exceeds its cap or when its modelled contribution is negative. It shows the actual photographer fee, cap, revenue, variable costs, per-booking contribution, package profit, margin, and totals. A non-negative contribution does not suppress a fee-cap warning. A separate warning appears when overall projected operating profit is negative. Inputs must be finite, non-negative values; booking counts must be whole numbers, and VAT/payment rates must be within 0–100%.

## User experience and integration

- Add a Photography link to the existing tree page and a Trees link on the new page. The two calculators remain financially independent.
- Give each package one row with shoot time, included images, advertised price, booked quantity, actual all-inclusive photographer fee, fee cap, and marketing/admin allowance.
- Show per-package and total economics and clear warnings, including that out-of-scope work (extra travel, more people, props, prints, reshoots, refunds) requires a revised quote or additional charge.
- Reuse the existing site's visual language and local server. Keep all calculations client-side and do not store or transmit entered data.

## Verification

Add unit tests for the three package defaults, VAT-registered and non-registered calculations, card fees, quantity totals, fee-cap warnings, loss warnings, fixed costs, zero bookings, and invalid inputs. Run the full Node test suite and inspect the localhost page for the three rows, totals, warnings, and navigation. No booking or payment integration is part of this work.
