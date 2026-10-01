# FarmSignal decision-test MVP

FarmSignal is a scrappy, working prototype for testing one research question:

> After seeing a zone-by-zone report that points out possible mortality, fouling, and equipment problems, will oyster-farm operators take a real step toward testing the service?

This is deliberately **not** a real scan or diagnostic tool. All farm conditions, findings, confidence values, and scan illustrations are fictional and preloaded.

## Run it

No installation is required. From this folder, run:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

You can also open `index.html` directly, although the local server is more representative of a deployed version.

## What the prototype tests

1. The operator sees ordinary pre-departure context and chooses only two of six zones.
2. The operator reviews a fake overnight scan with visible findings and concrete next steps.
3. The operator chooses two zones again, making any change in priorities observable.
4. The operator rates usefulness and either declines, requests a conversation, or makes a stronger pilot commitment by providing contact information and offering a real farm input.

The prototype records decision time, before/after choices, the information that influenced the choice, usefulness, and pilot commitment. A completed session is stored only in that browser. The researcher should click **Download session result** before starting the next interview.

## Suggested interview protocol

- Do not explain the colored report before the participant sees it.
- Ask them to think aloud, but do not recommend a zone.
- Observe whether they understand why a zone was prioritized and which report element they use.
- Treat “Yes, contact me about a pilot” as a strong signal only when the operator also supplies contact information and offers at least one farm input.
- Download the JSON response at the end of each interview.

## Share it

This is a static site, so it can be deployed free on GitHub Pages, Netlify, Cloudflare Pages, or Vercel. There are no environment variables, accounts, databases, or build commands.

For GitHub Pages, publish the repository root. For Netlify, drag this folder into the Netlify Drop page. After deploying, verify the link in a private browser window before submitting it.

## File guide

- `index.html` — the full three-step test and response form
- `styles.css` — responsive visual design and farm-map/report styling
- `app.js` — scenario data, interaction flow, measurement, local saving, and JSON export

