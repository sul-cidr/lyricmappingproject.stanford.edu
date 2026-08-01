// Does the map actually paint?
//
// Everything in tests/*.test.js runs the real pipeline in Node and checks what
// comes out, but stops at the point Leaflet takes over. This file covers the
// rest: it serves the repository, opens it in headless Chromium, and checks
// that each of the three maps draws something and that nothing errors.
//
// Deliberately NOT a screenshot test. The basemap is a third-party tile server,
// fonts differ between a laptop and a CI runner, and tile loading is a race, so
// pixel comparison would fail constantly for reasons that are not this project.
// The tile requests are stubbed below: what is under test is whether this code
// draws its own data, not whether CloudFront is up.
//
// This is the one part of the suite that needs an install. `npm test` stays
// dependency-free; this runs separately as `npm run test:browser`.

import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serveSite } from "./serve.js";
import { loadInitializedData } from "../helpers/loadData.js";
import { calcPoetCities } from "../../js/renderMap/calcPoetCities.js";
import { calculateBubbles } from "../../js/renderMap/calcBubbles.js";

const { data } = loadInitializedData();

/** Leaflet draws two circles per bubble: a visible one and a fat invisible click target. */
const CIRCLES_PER_BUBBLE = 2;

/**
 * How many bubbles the pure pipeline says a given view should have, counting
 * only those with coordinates — drawBubbles() skips the rest.
 * @param {State["currentMapMode"]} currentMapMode
 * @param {string} selectedId
 * @returns {number}
 */
function expectedBubbles(currentMapMode, selectedId) {
  /** @type {State} */
  const state = { currentMapMode, selectedId, minDate: -800, maxDate: -400 };
  const bubbles = calculateBubbles(state, data, calcPoetCities(data, state));
  return Object.values(bubbles).filter(bubble => bubble.city.lat && bubble.city.long).length;
}

/** @type {{ url: string, close: () => Promise<void> }} */
let site;
/** @type {import("playwright").Browser} */
let browser;
/** @type {import("playwright").Page} */
let page;
/** @type {string[]} */
const consoleErrors = [];

before(async () => {
  site = await serveSite();
  browser = await chromium.launch();
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  // Count zoomend registrations, to catch the handler-per-redraw leak coming back.
  await page.addInitScript(() => {
    const browserWindow = /** @type {any} */ (window);
    browserWindow.__zoomendRegistrations = 0;
    /** @type {any} */
    let leaflet;
    Object.defineProperty(window, "L", {
      configurable: true,
      get: () => leaflet,
      set: (/** @type {any} */ value) => {
        leaflet = value;
        if (value?.Map?.prototype && !value.Map.prototype.__counted) {
          const on = value.Map.prototype.on;
          value.Map.prototype.on = function (/** @type {any} */ type, /** @type {any[]} */ ...rest) {
            if (typeof type === "string" && type.includes("zoomend")) browserWindow.__zoomendRegistrations++;
            return on.call(this, type, ...rest);
          };
          value.Map.prototype.__counted = true;
        }
      }
    });
  });

  // Keep the test hermetic: serve a stub for the basemap tiles and the YouTube
  // embed rather than reaching the network. Fulfilled rather than aborted, so
  // that a blocked request does not itself log a console error and defeat the
  // "nothing errors" check below.
  const TRANSPARENT_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "base64"
  );
  await page.route("**d3msn78fivoryj.cloudfront.net**", route =>
    route.fulfill({ status: 200, contentType: "image/png", body: TRANSPARENT_PNG })
  );
  await page.route("**youtube.com**", route => route.fulfill({ status: 200, contentType: "text/html", body: "" }));

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(String(error)));
  // An unexpected alert() would hang the page, so fail loudly instead.
  page.on("dialog", dialog => {
    consoleErrors.push(`alert: ${dialog.message()}`);
    return dialog.dismiss();
  });

  await page.goto(site.url);
  await page.waitForSelector("#map path.leaflet-interactive");
  await page.locator("#essayCloseButton").click();
});

after(async () => {
  await browser?.close();
  await site?.close();
});

/** Selects a control bar radio button and waits for the redraw to settle. */
const select = async (/** @type {string} */ id) => {
  await page.locator(`#${id}`).dispatchEvent("click");
  await page
    .waitForFunction(() => !document.querySelector(".leaflet-tile-loading"), null, { timeout: 5000 })
    .catch(() => undefined);
  await page.waitForTimeout(300);
};

// Arrowhead decorators repeat every 250 rendered pixels, so their number
// depends on the viewport — 186 of them at 1280px wide, 187 at 1600px. They are
// drawn with stroke-width 0, which is how they are excluded here. What is left
// is two paths per arc and two circles per bubble, which depends only on data.
const ARC_SELECTOR = '#map path.leaflet-interactive:not([stroke-width="0"])';
const drawnPaths = () => page.locator(ARC_SELECTOR).count();

/** Selects a map mode and waits for the redraw. */
const mode = async (/** @type {string} */ id) => {
  await page.locator(`#${id}`).dispatchEvent("click");
  await page.waitForTimeout(900);
};

/** Clicks the first drawn shape and returns its popup text. */
const popupText = async () => {
  await page.locator(ARC_SELECTOR).first().click({ force: true });
  const popup = page.locator(".leaflet-popup-content");
  await popup.waitFor({ timeout: 5000 });
  return popup.innerText();
};

describe("the map paints", () => {
  test("places: activity draws a circle pair for every placed city", async () => {
    await select("relationship_3");
    assert.equal(await drawnPaths(), expectedBubbles("placesMode", "relationship_3") * CIRCLES_PER_BUBBLE);
  });

  test("places: origin draws fewer, since not every city is a birthplace", async () => {
    await select("relationship_1");
    const origin = await drawnPaths();
    assert.equal(origin, expectedBubbles("placesMode", "relationship_1") * CIRCLES_PER_BUBBLE);
    assert.ok(origin > 0);
    assert.ok(origin < expectedBubbles("placesMode", "relationship_3") * CIRCLES_PER_BUBBLE);
  });

  test("geographical imaginary draws its own, larger set", async () => {
    await page.locator("#geoimaginaryMode").dispatchEvent("click");
    await page.waitForTimeout(600);
    assert.equal(await drawnPaths(), expectedBubbles("geoimaginaryMode", "all_1") * CIRCLES_PER_BUBBLE);
  });

  test("travel draws arcs, not bubbles", async () => {
    await page.locator("#travelMode").dispatchEvent("click");
    await page.waitForTimeout(1200);
    // Each arc is a visible geodesic, an invisible click target and an
    // arrowhead decorator, so this is not a simple multiple of the line count.
    assert.ok((await drawnPaths()) > data.lines.length, "expected at least one path per travel line");
  });

  test("a travel filter narrows the arcs", async () => {
    const all = await drawnPaths();
    await select("gov_2");
    const tyranny = await drawnPaths();
    assert.ok(tyranny > 0, "the tyranny filter drew nothing");
    assert.ok(tyranny < all, "the tyranny filter drew as much as ALL CASES");
  });
});

describe("the map is usable", () => {
  test("clicking a bubble opens a popup with its city and a citation", async () => {
    await page.locator("#placesMode").dispatchEvent("click");
    await page.waitForTimeout(600);
    await select("relationship_1");

    await page.locator("#map path.leaflet-interactive").first().click({ force: true });
    const popup = page.locator(".leaflet-popup-content");
    await popup.waitFor({ timeout: 5000 });
    const text = await popup.innerText();

    assert.match(text, /POETS BORN IN /, "the popup has no title");
    assert.match(text, /Dates:/, "the popup has no dates");
    assert.match(text, /Citation:/, "the popup has no citation");
    assert.doesNotMatch(text, /undefined|NaN/, "the popup leaked undefined or NaN");
  });

  test("the control bar offers every map's filters", async () => {
    /** @type {[string, RegExp][]} */
    const expected = [
      ["placesMode", /^(relationship|poet|genre)_/],
      ["travelMode", /^(all|poet|destination|region|smallregion|gov)_/],
      ["geoimaginaryMode", /^(all|poet)_/]
    ];
    for (const [mode, allowed] of expected) {
      await page.locator(`#${mode}`).dispatchEvent("click");
      await page.waitForTimeout(500);
      const ids = await page.locator("#poetsSelector input").evaluateAll(inputs => inputs.map(input => input.id));
      assert.ok(ids.length > 0, `${mode} rendered no filters`);
      for (const id of ids) {
        assert.match(id, allowed, `${mode} offers "${id}", which it cannot handle`);
      }
    }
  });
});

describe("nothing errors", () => {
  test("no console errors, page errors or alerts throughout", () => {
    assert.deepEqual(consoleErrors, []);
  });
});

// ---------------------------------------------------------------------------
// Focused cases.
//
// The tests above derive their expectations from the data, so they survive a
// CSV edit. These ones name specific poets, genres and cities and assert exact
// numbers and exact wording, which is deliberately brittle: editing the data
// should make them fail, and the failure is the notification that a view
// changed. The numbers are explained where they are not obvious.
// ---------------------------------------------------------------------------

describe("places map: specific views", () => {
  test("ORIGIN draws the 55 cities some poet was born in", async () => {
    await mode("placesMode");
    await select("relationship_1");
    assert.equal(await drawnPaths(), 110); // 55 cities x 2 circles
  });

  test("ACTIVITY draws the 102 cities with any lyric activity", async () => {
    await select("relationship_3");
    assert.equal(await drawnPaths(), 204); // 102 x 2
  });

  test("the Dithyramb filter draws 15 cities, Epinician only 3", async () => {
    await select("genre_2");
    assert.equal(await drawnPaths(), 30);
    await select("genre_16");
    assert.equal(await drawnPaths(), 6);
  });
});

describe("places map: specific popups", () => {
  test("the Epinician filter draws three cities, Athens first, naming Euripides", async () => {
    await mode("placesMode");
    await select("genre_16");
    assert.equal(await drawnPaths(), 6); // Athens, Thebes, Ioulis (Ceos)
    const text = await popupText();
    assert.match(text, /ATHENS/);
    assert.match(text, /POET BORN IN ATHENS AND ASSOCIATED WITH EPINICIAN/);
    assert.match(text, /Euripides \(b\.in Salamis\)/);
    assert.match(text, /Dates: 485\/80–406/);
  });

  test("the Dithyramb filter opens on Melos, naming Diagoras and Melanippides", async () => {
    await select("genre_2");
    assert.equal(await drawnPaths(), 30);
    const text = await popupText();
    assert.match(text, /POET BORN IN MELOS AND ASSOCIATED WITH DITHYRAMB/);
    assert.match(text, /Diagoras/);
    assert.match(text, /Melanippides/);
    assert.match(text, /Genres: Dithyramb, Paean/);
    // Diagoras of Melos is cited from the scholion on Aristophanes' Clouds,
    // and the Greek is quoted alongside the translation.
    assert.match(text, /Schol\. ad Ar\. Nub\. 830c/);
    assert.ok(text.normalize("NFC").includes("Διαγόρας".normalize("NFC")));
  });
});

describe("travel map: specific views", () => {
  test("ALL CASES draws every attested journey", async () => {
    await mode("travelMode");
    // 159 distinct city pairs x2 paths, plus 96 cities touched x2 circles.
    assert.equal(await drawnPaths(), 510);
  });

  test("Alcman draws both reported origins, one of them degenerate", async () => {
    await select("poet_93");
    // 2 city pairs x2 + 2 cities x2. One pair is Sparta -> Sparta, since Alcman
    // is reported born at both Sparta and Sardis and was active at Sparta; that
    // arc has zero length and is invisible. See issue #332.
    assert.equal(await drawnPaths(), 8);
  });

  test("Sappho draws two birthplaces against two places of activity", async () => {
    await select("poet_132");
    // Mytilene and Eresos, each to Leucas and Sicily: 4 pairs x2 + 4 cities x2.
    assert.equal(await drawnPaths(), 16);
  });

  test("Pindar draws 27 journeys, all from Thebes", async () => {
    await select("poet_149");
    assert.equal(await drawnPaths(), 110); // 27 pairs x2 + 28 cities x2
  });

  test("the Tyranny filter narrows to 34 journeys", async () => {
    await select("gov_2");
    assert.equal(await drawnPaths(), 134); // 33 pairs x2 + 34 cities x2
  });

  test("Sparta as a destination draws 19 journeys", async () => {
    await select("destination_10");
    assert.equal(await drawnPaths(), 64); // 16 pairs x2 + 16 cities x2
  });
});

describe("travel map: the Camarina and Cyrene mis-keys are visible", () => {
  test("Pindar appears at Erythrae in Ionia, which should be Camarina in Sicily", async () => {
    await mode("travelMode");
    await select("destination_254");
    // cityId 254 is Erythrae. Exactly one journey reaches it, and it is Pindar's
    // — the row labelled Camarina in poets_cities.csv. See the BUG tests in
    // data-integrity.test.js. When that is fixed this view disappears.
    assert.equal(await drawnPaths(), 6); // 1 pair x2 + 2 cities x2
    const text = await popupText();
    assert.match(text, /THEBES -> ERYTHRAE/);
    assert.match(text, /Pindar/);
  });

  test("and at Phocaea, which should be Cyrene in Libya", async () => {
    await select("destination_255");
    assert.equal(await drawnPaths(), 6);
    const text = await popupText();
    assert.match(text, /THEBES -> PHOCAEA/);
    assert.match(text, /Pindar/);
  });
});

describe("geographical imaginary: specific views", () => {
  test("ALL REFERENCES draws 168 places", async () => {
    await mode("geoimaginaryMode");
    assert.equal(await drawnPaths(), 336); // 168 x 2
  });

  test("Alcman's poetic world is 32 places", async () => {
    await select("poet_93");
    assert.equal(await drawnPaths(), 64); // 32 x 2
  });
});

describe("redrawing does not leak", () => {
  test("zoomend is bound once, however many times the map is redrawn", async () => {
    await mode("placesMode");
    const before = await page.evaluate(() => /** @type {any} */ (window).__zoomendRegistrations);
    for (let i = 0; i < 6; i++) await select(i % 2 ? "relationship_1" : "relationship_3");
    await mode("travelMode");
    await mode("geoimaginaryMode");
    await mode("placesMode");
    assert.equal(await page.evaluate(() => /** @type {any} */ (window).__zoomendRegistrations), before);
  });
});
