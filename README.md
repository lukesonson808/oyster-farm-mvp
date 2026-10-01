# FarmSignal personalized decision-test MVP

FarmSignal is a working prototype for testing one research question:

> After seeing a zone-by-zone report that points out possible mortality, fouling, and equipment problems, will oyster-farm operators take a real step toward testing the service?

This is deliberately **not** a real scan or diagnostic tool. An operator enters a farm location, lease size, number of growing zones, gear type, and crew window. The app then creates a customized fictional report with zone-level oyster counts, survival indicators, possible visible problems, underwater sample images, and a recommended crew route.

All conditions, findings, confidence values, oyster estimates, recommendations, and underwater images are simulated. The interface labels them accordingly.

## Run it

No installation is required. From this folder, run:

```bash
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

You can also open `index.html` directly, although the local server is more representative of a deployed version.

## What the prototype tests

1. The operator personalizes the demo using the shape of their real operation.
2. The app generates between 2 and 12 fictional zones with different stock, survival, size, fouling, and gear conditions.
3. The location name is matched to a real OpenStreetMap view. A sample lease boundary, zone polygons, and individual cage positions are generated around that approximate center; the operator can click the map to reposition it.
4. The operator receives a prioritized two-stop crew route with specific cage IDs, time estimates, and concrete actions.
5. The operator can open any cage to see the visible cues, simulated detection method, confidence, limitations, and a three-stage response plan.
6. The operator either declines, requests a conversation, or makes a stronger pilot commitment by providing contact information and offering a real farm input.

Farm setup and pilot interest are stored only in that browser. During a moderated test, the researcher should record the participant's response separately before starting the next interview.

## Suggested interview protocol

- Ask the operator to enter details close to their real farm, then think aloud as the report appears.
- Do not explain the colored report before the participant explores it.
- Observe whether they understand why a zone was prioritized and whether they open the supporting evidence.
- Ask whether the two-stop route would change where they sent the crew that day.
- Treat “Yes, contact me about a pilot” as a strong signal only when the operator also supplies contact information and offers at least one farm input.
- Download the JSON response at the end of each interview.

## Share it

This is a static site, so it can be deployed free on GitHub Pages, Netlify, Cloudflare Pages, or Vercel. There are no environment variables, accounts, databases, or build commands.

For GitHub Pages, publish the repository root. For Netlify, drag this folder into the Netlify Drop page. After deploying, verify the link in a private browser window before submitting it.

## File guide

- `index.html` — farm setup, personalized dashboard, evidence modal, and pilot question
- `styles.css` — responsive product interface and farm-map/report styling
- `app.js` — deterministic sample generation, prioritization, filtering, and local response saving
- `assets/` — four AI-generated fictional underwater inspection images

## Geographic map behavior

The dashboard uses Leaflet with OpenStreetMap tiles. Location names are matched through Nominatim and cached in the browser. The generated cage coordinates are only a demonstration layout around the matched town or harbor center; they are not lease survey coordinates. Users can click the map to move the sample lease center closer to the real location.

An internet connection is required for location matching, the map library, and map tiles. If lookup fails, the app uses a clearly labeled demonstration center and keeps all non-map reporting available.
