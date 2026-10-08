---
name: norwegian-ev-finder
description: Find and rank used electrified cars (EV, hybrid, plug-in hybrid) on FINN Biler by total cost including omregistrering and estimated delivery. Use when the user asks for elbil, EV, electric car, hybrid, plug-in hybrid, "cheapest electric car", "bil under 90k", "delivery to Trondheim", or the total cost of a used electrified car on FINN.
---

# Norwegian EV Finder

Turn one sentence such as "Top 10 EV cars under 90K sorted by total cost including delivery to Trondheim" into a ranked table. Use the finn-mcp tools `search_finn_cars` and `get_finn_mobility_item`. Do not use a browser. Ask a question only when the answer would materially change the ranking.

## 1. Parse and infer

- **Budget**: default currency NOK. "90K" = 90,000 NOK. Ask once only if the currency or amount is ambiguous. The budget is a hard cap on **total cost** (price + omregistrering + estimated delivery).
- **Delivery city**: default Trondheim.
- **Powertrains**: EV only by default. Add Hybrid when "hybrid" is named, Plug-in Hybrid when "plug-in"/"PHEV" is named; "electrified" or "all" means all three. State which you searched.
- **Sort**: total cost ascending unless told otherwise.
- Inferred preferences (range, battery, age, mileage, body type) are **ranking aids, not hard filters**; state them as assumptions.

## 2. Fuel codes (single source of truth)

`search_finn_cars` `fuel` only works with FINN's numeric codes. Text such as "Elektrisk", "Hybrid" or "Plug-in Hybrid" (as the tool description suggests) is **silently ignored** and returns mostly diesel and petrol. Never pass text.

| Powertrain | Code | When |
|---|---|---|
| El (EV) | `4` | EV requested |
| Hybrid bensin | `6` | Hybrid requested |
| Hybrid diesel | `8` | only if asked |
| Plug-in Bensin | `1352` | Plug-in requested |
| Plug-in Diesel | `1356` | only if asked |

## 3. Search

The tool takes one `fuel` value, so run **one search per powertrain** and merge.

- Per powertrain: `search_finn_cars` with `fuel=<code>`, `price_from=20000`, `price_to=<budget>`, `sort=PRICE_ASC`, 2-3 pages.
- `price_from=20000` is an assumption: cheaper rows (e.g. `0`, `936`, `1268` NOK) are leasing or placeholder prices. Lower it only if the user asks.
- Merge and de-duplicate by `finn_code`.

## 4. Verify, then rank

1. **Post-filter** search rows: `fuel` equals the requested powertrain, `registration_class == "Personbil"` (drop vans/Varebil), price plausible.
2. Fetch `get_finn_mobility_item` for about 15-20 candidates (cheapest by rough total cost, spread across powertrains). From the specs take **Pris ekskl. omreg.** and **Omregistrering** (the headline `price` already includes omregistrering, e.g. 26,942 = 25,000 + 1,942, so never add it twice), and re-check `Drivstoff`. Also read Modellår, Kilometerstand, Batterikapasitet, Rekkevidde (WLTP), Effekt, `Bilen står i`, 1. gang registrert, Eiere, EU-kontroll date, Salgsform.
3. **Drop non-purchases**: keep only `Salgsform` = "Bruktbil til salgs" (or another outright-sale form). Drop `Leasing` and "Gjenværende kilometer i avtale"/"Antall terminer" listings; they show monthly or placeholder prices (observed: a 2026 Porsche Cayenne Turbo at 25,000 NOK that is a lease takeover). `price_from=20000` does not remove these.
4. **Total cost** = price excl. omreg. + omregistrering + estimated delivery. Drop anything above the budget. If a detail page lacks the split, fall back to the listing price and say so.

## 5. Delivery model (assumption, not a quote)

FINN has no delivery-cost data. Estimate by distance from the car's location (use the search row's `location` town; the detail `location` is null and `Bilen står i` is usually just "Norge") to the delivery city. Tiers for delivery to Trondheim:

| Car located in | Estimate (NOK) |
|---|---|
| Trøndelag | 0-1,000 |
| Møre og Romsdal, Innlandet | ~3,000 |
| Østlandet | ~4,000-5,000 |
| Vestlandet, Sørlandet | ~6,000-8,000 |
| Nord-Norge | ~8,000-10,000 |

Map town to region yourself and flag it **estimated**. Use the midpoint of the tier. Unknown location: show `n/a` and use the highest tier. For another delivery city, shift the tiers by distance in the same spirit and say so. Always state: "not a quote; get a transport quote".

## 6. Output

Open with assumptions: powertrains searched, budget meaning (total cost cap), delivery tiers, price floor of 20,000.

**Top 10 table**, sorted by total cost: Rank, Car (link `https://www.finn.no/mobility/item/<code>`), Powertrain, Year, km, Battery kWh / WLTP range (EV and plug-in; electric range for PHEV where listed), Location, Price, Omreg., Delivery (est.), **Total cost**, Seller type. Fewer than 10 is an acceptable answer; do not lower the bar to fill rows.

Then a short **recommendation** (best pick weighing age, km, battery size, owners, EU-kontroll date) and a **Not verified / ask the seller** list: battery state of health, accident history, outstanding debt (Gjeldsregisteret), service history, charging cable and charger compatibility, hybrid-battery warranty status. Never invent data the tools did not return.

## 7. Export (end of answer)

Offer **"PDF with photos"** and **"Artifact page"**. Export only when asked.

- **PDF**: build an HTML report in the scratchpad directory (assumptions, table, one card per car with photos, not-verified list) and print it with headless Chrome. `reportlab`/`pypdf` may not be installed; check the `anthropic-skills:pdf` skill if Chrome is unavailable. Report the output path.
- **Artifact**: load `artifact-design`, write one HTML page and publish it as a private artifact. Embed images as data URIs (the viewer blocks external images). Return the link.
