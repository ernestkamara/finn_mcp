---
name: norwegian-listing-details
description: Deep dive on a single Norwegian home listing from FINN Eiendom. Use when the user says "details of #2", "tell me more about <finnkode or FINN URL>", "deep dive", or "should I bid on ...", for a listing from a previous Top 5 or a raw finnkode.
---

# Norwegian Listing Details

Single-listing deep dive using `get_finn_realestate_home`. No browser. Formulas for renovation, Max bid and Bid live in the **"Bid and renovation model"** section of the `norwegian-real-estate-finder` skill; apply them from there, do not restate them.

## Steps

1. **Resolve the target**: a finnkode, a FINN URL (the `finnkode=` query parameter), or an index ("#2") into the last Top 5 in this conversation. If it is ambiguous (no Top 5 in context, or unclear reference), ask once.
2. **Fetch** with `get_finn_realestate_home`. If the listing is sold or key fields are null, say so. Null fields right after a parser update can mean the MCP server is stale and needs restarting.
3. **Budget**: reuse the budget from the conversation. If unknown, ask once only if it changes the bid verdict; otherwise show Max bid as `n/a`.

## Output sections

1. **Fact sheet**: prisantydning, fellesgjeld, omkostninger, totalpris, felleskostnader and what they include, BRA-i / TBA, eierform, byggeår, energy label, forkjøpsrett, facilities, viewings, cadastre.
2. **Description highlights**: renovation years and works quoted verbatim from the description.
3. **Red flags**: e.g. high fellesgjeld, high felleskostnader, old wet rooms, active forkjøpsrett, unclear works, missing data.
4. **Ask the megler**: concrete question list (tilstandsrapport/TG findings, planned stamme/tak/fasade work, borettslag loan and rentebinding, vedtekter, forkjøpsrett status, parking terms, what is included in felleskostnader).
5. **Tags**: mark statements as **fact** (from the tool), **assessment** (your judgement) or **not verified** (schools, transit, noise, TG, regulation, borettslag finances). Never invent unverified items.
6. **Renovation range and all-in** cost per the finder skill's model.
7. **Bid block**: Renovation (est.), Bid, Max bid, and "over budget" where prisantydning > Max bid. State that these are rule-based assumptions, not sold-price data.
8. **Links and photos**: FINN link (`https://www.finn.no/realestate/homes/ad.html?finnkode=<code>`) and the top photos from `images` as links.
