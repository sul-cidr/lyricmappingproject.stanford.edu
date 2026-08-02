// Provenance checks over 3rdparty/.
//
// The libraries the site uses are copied into this repository rather than
// loaded from a CDN, which trades a runtime dependency for a record-keeping
// one: nothing but 3rdparty/README.md says what version a file is or where it
// came from, and nothing but a person's care keeps that true.
//
// So the claim is made checkable. 3rdparty/checksums.txt holds the hash of the
// upstream artifact each file was copied from, and these tests assert the files
// still match it, that every file served is accounted for, and that each
// library's licence text is present — copying a library in is redistributing
// it, and all of these licences require the text travel with the code.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const vendorDir = join(root, "3rdparty");

/** The manifest, as `shasum -a 256` writes and reads it. */
const checksums = readFileSync(join(vendorDir, "checksums.txt"), "utf8")
  .split("\n")
  .filter(line => line.trim() !== "")
  .map(line => {
    const match = /^([0-9a-f]{64}) {2}(.+)$/.exec(line);
    assert.ok(match, `checksums.txt line is not 'sha256  path': ${line}`);
    return { expected: match[1], path: match[2] };
  });

/**
 * Every file under 3rdparty/, relative to it, with / separators.
 * @param {string} dir
 * @returns {string[]}
 */
function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : [relative(vendorDir, full).split("\\").join("/")];
  });
}

const present = filesUnder(vendorDir);

/** Files that are this repository's own, so have no upstream hash to match. */
const notCopiedFromUpstream = new Set([
  "README.md",
  "checksums.txt",
  // Hand-written from what Google Fonts serves, to point at the local .woff2
  // files and to drop the subsets the site does not use.
  "google/gentiumbasic/gentiumbasic.css",
  "google/opensans/opensans.css"
]);

describe("3rdparty files match the upstream they were copied from", () => {
  for (const { expected, path } of checksums) {
    test(path, () => {
      const actual = createHash("sha256")
        .update(readFileSync(join(vendorDir, path)))
        .digest("hex");
      assert.equal(
        actual,
        expected,
        `${path} no longer matches 3rdparty/checksums.txt. If it was re-vendored ` +
          `on purpose, update that file and its row in 3rdparty/README.md.`
      );
    });
  }
});

test("every file in 3rdparty/ is either checksummed or licence text", () => {
  const checksummed = new Set(checksums.map(c => c.path));
  const unaccounted = present.filter(
    (/** @type {string} */ path) =>
      !checksummed.has(path) && !notCopiedFromUpstream.has(path) && !path.startsWith("licenses/")
  );
  assert.deepEqual(
    unaccounted,
    [],
    "files in 3rdparty/ with no line in checksums.txt: add them, or list them in " +
      "notCopiedFromUpstream above if this repository wrote them"
  );
});

test("checksums.txt lists nothing that has been deleted", () => {
  const missing = checksums.map(c => c.path).filter(path => !present.includes(path));
  assert.deepEqual(missing, [], "checksums.txt names files that are not in 3rdparty/");
});

describe("each vendored library ships its licence", () => {
  // Keyed by the licence file, valued by a file it covers, so that removing a
  // library and forgetting its licence — or the reverse — fails here.
  const licences = {
    "leaflet.txt": "leaflet/leaflet.js",
    "papaparse.txt": "papaparse.min.js",
    "leaflet.geodesic.txt": "leaflet.geodesic.umd.min.js",
    "leaflet.curve.txt": "leaflet.curve.js",
    "leaflet-polylinedecorator.txt": "leaflet-polylinedecorator.js",
    "nouislider.txt": "nouislider.js",
    "gentiumbasic.txt": "google/gentiumbasic/gentiumbasic.css",
    "opensans.txt": "google/opensans/opensans.css"
  };

  for (const [licence, covered] of Object.entries(licences)) {
    test(licence, () => {
      assert.ok(present.includes(covered), `${covered} is gone; drop licenses/${licence} too`);
      const path = join(vendorDir, "licenses", licence);
      assert.ok(statSync(path).size > 0, `licenses/${licence} is missing or empty`);
    });
  }

  test("no licence is left behind for a library that was removed", () => {
    const filenames = readdirSync(join(vendorDir, "licenses"));
    assert.deepEqual(
      filenames.filter(name => !(name in licences)),
      [],
      "licenses/ holds a file for a library that is no longer vendored"
    );
  });
});

test("nothing under 3rdparty/ is fetched from a third party at runtime", () => {
  // The commented-out original URLs are how each file records where it came
  // from, so only live references count.
  const styles = present.filter((/** @type {string} */ path) => path.endsWith(".css"));
  for (const path of styles) {
    const withoutComments = readFileSync(join(vendorDir, path), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const remote = withoutComments.match(/url\(\s*['"]?https?:/g) ?? [];
    assert.deepEqual(remote, [], `${path} still loads from a remote host`);
  }
});
