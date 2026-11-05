# AstraPath

Company site for AstraPath, indoor directions from the front door to the room: which entrance, which hallway, which elevator, which door.

The page is a static site. It introduces the product, the Columbia demo, and a waitlist for people walking and for buildings. The live routing demo is separate: [astrapath-indoornav.netlify.app](https://astrapath-indoornav.netlify.app/).

## Run it

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8765
```

Then visit [http://127.0.0.1:8765/](http://127.0.0.1:8765/).

Headlines use [Satoshi](https://www.fontshare.com/fonts/satoshi) from Fontshare, so the typeface loads when you are online. Without that request, the page falls back to Helvetica.

## What’s on the page

- A full-screen menu and a route search. The search answers a few Columbia examples: room 405, a quiet place before 2 pm, a fountain on floor 5, and a step-free way to room 512. Anything else explains that this preview is not the live map.
- Feature plates for Columbia, step-free routes, AI assistants, and towers.
- A waitlist form. A valid email is stored in `localStorage` under `astrapath-waitlist` in that browser. It is not sent to a server. Dismissing the top banner is remembered for the tab in `sessionStorage`.

## Project layout

```
index.html          Page structure and copy
css/styles.css      Layout and visual design
js/main.js          Menu, search, feature plates, and waitlist
assets/             Logo mark and wordmark, black and white
```

## Product notes

AstraPath is free for the people walking a building. Buildings pay for the map. It runs on the web, on iPhone, and in AI assistants. AR glasses are in development. The routing engine is TopoNavi, open source under Apache-2.0. The product is made by Columbia students and is live in Northwest Corner, Pupin, CEPSR, and Mudd.
