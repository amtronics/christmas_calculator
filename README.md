# Christmas tree margin calculator

Run locally from PowerShell (Node is bundled with Codex, so it need not be on your `PATH`):

```powershell
Set-Location 'C:\dev\christmas'
& 'C:\Users\Amin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\server.mjs
```

Keep the PowerShell window open, then open `http://127.0.0.1:4173`. Press Ctrl+C to stop the server. If the port is already in use, the calculator is already running; open the URL instead of starting a second copy.

The calculator is entirely local and does not store or send entered figures.

## Christmas portraits

Open `http://127.0.0.1:4173/photography.html`, or use the Photography link on the tree page. This is a separate at-home portrait pricing calculator; its bookings, costs and profit do not flow into the tree figures. The Trees link takes you back.

The advertised starting packages are Classic (30 minutes, 5 edited digital photos, £229), Signature (60 minutes, 12 photos, £329) and Heirloom (90 minutes, 25 photos, £499). The default all-inclusive photographer fee caps are £125, £180 and £275 respectively. Each actual photographer fee starts at its cap, and a fee above that cap is flagged even when the booking still makes a contribution. The default per-booking marketing/admin allowances are £20, £25 and £35. Booking quantities start at zero.

By default, the photography model assumes VAT registration at 20%, a payment-processing fee of 2% of the full customer price, and £0 other fixed costs. A photographer's fee must include travel, setup, shooting, editing and digital delivery; the full fee is counted as a cost without assuming input-VAT recovery. Change these inputs for your actual quotes and circumstances. The page shows per-booking contribution and projected total operating profit separately, and warns about package or overall losses.

These results are planning contributions, not guaranteed profit. Extra travel, additional people, props, prints, reshoots, refunds, and any unentered overhead need a revised quote or additional charge. The page does not manage bookings, take payments, or retain customer details.

The stock table contains 16 cut-tree offers with numeric Bolton-yard collection quotes from the attached Bolton Christmas Trees list dated 24 August 2026: Nordmann Fir in 1-foot bands from 3-4 ft through 11-12 ft; Norway Spruce at 4-5 and 5-6 ft; Fraser Fir at 5-6 and 6-7 ft; and Noble Fir at 4-5, 5-6 and 6-7 ft. The offer's foot label and actual supplier centimetre quote are both shown. Norway uses 150-175 cm for 4-5 ft and 175-200 cm for 5-6 ft. Noble uses 150-175, 175-200 and 200-225 cm for 4-5, 5-6 and 6-7 ft respectively. These Norway and Noble labels are the chosen offer mapping, not an exact unit conversion. The list excludes Budget grade, dowelled and pot-grown trees. One Premium quality switch uses the Premium quote for the shown supplier band where available; otherwise it retains the non-premium quote. With Premium off, Standard takes priority over Regular and Value. Premium-only rows retain that quote in either switch position.

We Tree Kings cut-tree variant prices were checked on 22 September 2026. The market column matches the offered foot band to the published band; comparisons are planning references, particularly where a supplier centimetre range differs from its chosen offer label. Rows with a comparison start with a discounted editable selling price. The Noble Fir 4-5 ft row has no match and needs a selling price entered before a positive quantity can be included in profit.

The default selling price is 5% below the matched We Tree Kings comparison, rounded to the nearest penny. Changing the global percentage recalculates every matched selling-price row, including any manual edits; rows without a comparison are untouched. Individual prices remain editable until the percentage changes again or the calculator is reset.

Van hire days are calculated, not entered: collection trips = purchased trees divided by trees per load, rounded up; collection days = trips divided by trips per day, rounded up; delivery days = sold trees divided by trees delivered per day, rounded up. Van and driver days are the sum of collection and delivery days. The default capacity is 30 netted 6–7 ft trees per load, with two collection trips and 20 deliveries per day; adjust for tree dimensions, van payload, and route capacity. Van hire is priced per day. Collection mileage is an additional per-trip input and defaults to zero until an actual route is entered.

Leaflet demand assumes one tree per converted customer and all projected sales originate from leaflets. The default 0.5% response rate means 200 leaflets per customer. Required leaflets are rounded up to whole 1,000-leaflet print batches at £50 including VAT each. Distribution labour/cost is not included unless entered as an additional fixed cost.

Disposal uses an editable all-in cost per van load, with the number of loads rounded up from unsold trees divided by the same `Trees per van load` capacity used for collection. A partial load incurs one full trip cost. This all-in amount is not also charged as extra hire days, driver cost or fuel. It starts at £0 until a disposal-trip quote is entered.

Cinco 6, 8 and 10 stands can be entered by quantity sold. The supplier's ex-VAT unit quotes are £11, £14 and £22; the set customer prices are £25, £25 and £40. Every stand sold is assumed purchased, so there is no unsold stand inventory. Stand revenue, purchase cost, applicable VAT and payment fees flow into overall profit and margin. Stands are assumed to accompany tree deliveries and do not increase tree counts, van days or leaflet demand. Tree sell-through scenarios keep the entered stand sales fixed.
