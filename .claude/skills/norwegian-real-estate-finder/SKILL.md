---
name: norwegian-real-estate-finder
description: Find, rank and advise on homes and apartments for sale in Norway via FINN Eiendom. Use when the user asks to find or search apartments/homes/boliger in a Norwegian city or area, mentions FINN eiendom, gives a household ("family of 3", "couple", "first-time buyer") or a budget in NOK/million, or asks for the best option, renovation risk, or andel vs selveier advice.
---

# Norwegian Real Estate Finder

Turn one natural-language request into a ranked Top 5 buyer-advisor answer. Use the finn-mcp tools (`search_finn_realestate_locations`, `search_finn_realestate_homes`, `get_finn_realestate_home`). Do not use a browser. Ask questions only when the answer would materially change the ranking.

## 1. Parse and infer

- Extract explicit requirements: area, budget, size, bedrooms, property type, parking, etc. Explicit requirements are hard filters.
- Infer defaults from the household. Inferred items are **ranking preferences, never hard filters**, and are stated as assumptions in the answer.

| Household | Inferred preferences |
|---|---|
| Single / couple | 1-2 bedrooms, low felleskostnader, central, liquidity |
| Young family of 3 | 3+ rooms/2+ bedrooms, 60+ m² BRA-i, parking, balcony/outdoor, kids-friendly area, near school/daycare |
| Family of 4+ | 3+ bedrooms, 80+ m², storage, parking, house/rekkehus becomes realistic |
| Investor | yield, low felleskostnader, rentability, liquidity, renovation upside |

- Ask **one** question only when interpretations materially differ (typically living vs investment with no other context, e.g. "property in Trondheim under 5m"). Never ask about bedrooms, parking or other things you can infer. If the user already gave a household or purpose, do not ask.

## 2. Resolve location

1. Call `search_finn_realestate_locations` with the area name and use the `location` code.
2. If the area has no code (small neighbourhoods such as Tiller or Saupstad may not), search with `query` free text instead. Free text leaks other regions (Klæbu, Førde, Husøysund for "Tiller"), so **post-filter every result by `location` / `local_area`** to the requested area and drop the rest.
3. Useful filters: `property_type` (3=Leilighet, 1=Enebolig, 2=Rekkehus), `facilities: ["23"]` for parking, `price_to`, `price_total_to`, `min_bedrooms`, `area_from`, `sort`, `page`. Only apply filters that are hard requirements.

## 3. Budget semantics

"Under X" means the **effective price**: prisantydning + fellesgjeld + omkostninger (totalpris). Andel units can have a low asking price hiding millions in fellesgjeld.

- Search with `price_total_to` = budget, and also look at `price_to` = budget, so units whose ask is under budget but totalpris is over are seen and then excluded or flagged.
- Always show **prisantydning, fellesgjeld, totalpris and felleskostnader/mnd** separately. Search results give `price`, `total_price`, `shared_cost_monthly`; details give `joint_debt`, `registration_charge`, `sales_costs`.
- Treat felleskostnader as part of ongoing cost; a cheap unit with high felleskostnader is not cheap.

## 4. Search broad, then expand

- Page through results (`page`) until you have a solid candidate pool; stay within reason on tool calls.
- Fetch `get_finn_realestate_home` for the ~10 best candidates only.
- If fewer than 5 strong matches exist, search adjacent areas and label them **"nearby alternative"**. Do not lower the quality bar to fill five slots; fewer than five is an acceptable answer.
- Skip sold listings (the tools already exclude them; a detail call may report sold).

## 5. Score (0-100)

| Criterion | Weight |
|---|---|
| Family / household fit | 25 |
| Financial value (totalpris, price per m², felleskostnader, fellesgjeld risk) | 25 |
| Location | 20 |
| Condition | 15 |
| Upside | 10 |
| User-specific wishes | 5 |

For investors, shift weight to yield, costs and liquidity. Never rank by asking price alone.

## 6. Facts vs assessments

- **Fact**: anything returned by the tools (prices, size, BRA-i, TBA, eierform, year, energy label, preemption, facilities, felleskostnader).
- **Assessment**: your judgement from the description (layout, light, neighbourhood feel). Label it as such.
- **Not verified**: schools, transit, noise, tilstandsrapport/TG grades, regulation plans, borettslag finances. The tools do not provide these, so say "not verified" and never invent them. For condition, write "TG not verified, read the tilstandsrapport in the salgsoppgave".
- No guaranteed-investment claims. Renovation numbers are rough screening ranges only.

## 7. Renovation intelligence

Classify each candidate: **Move-in ready**, **Renovation opportunity**, or **Renovation risk**, based on year built, description wording (e.g. "oppussingsobjekt", "original kjøkken/bad", "pusset opp 20xx") and the energy label.

Rough screening ranges (NOK, state them as such): cosmetic refresh 3-8k/m²; kitchen 150-350k; bathroom 150-400k; full renovation 12-20k/m². Wet rooms older than ~25 years and unknown electrical/drainage status raise the risk class.

**All-in cost** = totalpris (incl. fellesgjeld and omkostninger) + estimated renovation.

## 8. Output

Open with the assumptions made (inferred household needs, budget interpretation). Then:

**Top 5**, each with:
- Title, address/area, FINN link (`https://www.finn.no/realestate/homes/ad.html?finnkode=<code>`), tag "nearby alternative" where relevant
- Score /100
- Prisantydning, fellesgjeld, totalpris, felleskostnader/mnd, size (BRA-i), eierform
- Why it fits / concerns (facts vs assessments marked)
- Renovation class and range, all-in cost
- Verdict (one line)

**Comparison table** of all five (score, totalpris, felleskostnader, m², eierform, renovation class, all-in).

**Recommendation**: Best overall, Best value, Best renovation opportunity, Best for the family, Best alternative (omit categories with no genuine candidate).

## 9. Norwegian buyer checklist

Available from the tools: BRA-i / P-rom, TBA, eierform (selveier / andel / aksje), fellesgjeld, felleskostnader and what they include, omkostninger, forkjøpsrett (andel: other members have preemption; check status), energy label, facilities, viewing times, byggeår.

Check in the salgsoppgave (not verified): tilstandsrapport and TG2/TG3 findings, takst, borettslag/sameie economy and planned major works (stamme, tak, fasade), restlån and rentebinding in the borettslag, vedtekter (utleie, bruksbegrensninger), reguleringsplan and noise, parking terms, schools/transit.
