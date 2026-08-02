# Third-party code

Every library the site uses is copied in here and served from this repository.
Nothing is fetched from a CDN at runtime, so the site has no third-party
dependency that can go away, slow down, change under it, or watch its visitors.
That is the whole point: a CDN URL that works today is the most likely reason a
site like this stops working in ten years.

The cost of copying libraries in is that provenance has to be recorded by hand,
which is what this file is for. Each library below is pinned to a version, and
each file is listed with the checksum of the upstream artifact it was copied
from, so anyone can confirm a file is still what it claims to be without
trusting this repository's history.

## Libraries

| Library                                                                            | Version | Released   | Copied from                                                                  | License                                                                               |
| ---------------------------------------------------------------------------------- | ------- | ---------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| [Leaflet](https://leafletjs.com/)                                                  | 1.9.4   | 2023/05/18 | `npm: leaflet@1.9.4` → `dist/leaflet.js`, `dist/leaflet.css`                 | BSD-2-Clause, [licenses/leaflet.txt](licenses/leaflet.txt)                            |
| [Papa Parse](https://www.papaparse.com/)                                           | 5.4.1   | 2023/03/23 | `npm: papaparse@5.4.1` → `papaparse.min.js`                                  | MIT, [licenses/papaparse.txt](licenses/papaparse.txt)                                 |
| [Leaflet.Geodesic](https://github.com/henrythasler/Leaflet.Geodesic)               | 2.7.1   | 2023/10/02 | `npm: leaflet.geodesic@2.7.1` → `dist/leaflet.geodesic.umd.min.js`           | **GPL-3.0**, [licenses/leaflet.geodesic.txt](licenses/leaflet.geodesic.txt)           |
| [Leaflet.curve](https://github.com/elfalem/Leaflet.curve)                          | 0.9.2   | 2023/03/07 | tag `v0.9.2` → `src/leaflet.curve.js`                                        | MIT, [licenses/leaflet.curve.txt](licenses/leaflet.curve.txt)                         |
| [Leaflet.PolylineDecorator](https://github.com/bbecquet/Leaflet.PolylineDecorator) | 1.6.0   | 2018/01/28 | `npm: leaflet-polylinedecorator@1.6.0` → `dist/leaflet.polylineDecorator.js` | MIT, [licenses/leaflet-polylinedecorator.txt](licenses/leaflet-polylinedecorator.txt) |
| [noUiSlider](https://github.com/leongersen/noUiSlider)                             | 15.7.1  | 2023/06/14 | `npm: nouislider@15.7.1` → `dist/nouislider.js`, `dist/nouislider.css`       | MIT, [licenses/nouislider.txt](licenses/nouislider.txt)                               |
| [Gentium Basic](https://software.sil.org/gentium/)                                 | v18     | —          | Google Fonts, `fonts.gstatic.com/s/gentiumbasic/v18/`                        | OFL-1.1, [licenses/gentiumbasic.txt](licenses/gentiumbasic.txt)                       |
| [Open Sans](https://github.com/googlefonts/opensans)                               | v36     | —          | Google Fonts, `fonts.gstatic.com/s/opensans/v36/`                            | OFL-1.1, [licenses/opensans.txt](licenses/opensans.txt)                               |

`index.html` loads these in order and repeats the version and upstream URL above
each `<script>`, with the CDN tag the file replaced left commented out beside it.

Leaflet and Leaflet.Geodesic additionally carry `integrity` attributes there.
Those are the hashes their publishers advertise, kept as a second, independent
record of what upstream shipped — a local file cannot be tampered with in
transit, but the attribute still documents which upstream bytes these are.

### Notes on particular libraries

**Leaflet is deliberately not on 2.x.** 1.9.4 is the last 1.x release and is
still current; 2.0 is a breaking rewrite to ES modules that removes the global
`L` this codebase is written against. Moving to it is a port, not an upgrade.

**Leaflet.curve and Leaflet.PolylineDecorator are frozen upstream** — last
released 2023 and 2018 respectively. They are at their final versions, not
merely behind. `leaflet-curve@1.0.0` on npm is a different maintainer's fork and
is not a newer version of the file here.

**Leaflet.Geodesic is GPL-3.0**, the only copyleft library here. It is served
unmodified, and its full licence text ships alongside it.

### Fonts

The two `.css` files under `google/` were written by hand, from what Google
Fonts serves, so they are the only files here that are not byte-for-byte
upstream. Each `@font-face` keeps the original `fonts.gstatic.com` URL commented
directly above the local one, which is the only way to tell which subset each
opaquely-named `.woff2` holds.

The subsets kept are the ones the site's text actually uses: latin, latin-ext
and greek, plus the vietnamese subset of Open Sans, which is where the
dot-below diacritics marking uncertain readings in quoted Greek live. The
cyrillic, cyrillic-ext and hebrew subsets were dropped — no text on the site
falls in those ranges, and they were the last four faces still being fetched
from Google at runtime.

## Verifying

Every file listed below is byte-for-byte the upstream artifact. From this
directory:

```sh
shasum -a 256 -c checksums.txt
```

`npm test` checks the same thing, so a file that is edited or replaced without
this list being updated fails CI rather than quietly drifting.

To re-vendor a library, replace the file from upstream, update its row above and
its line in `checksums.txt`, and copy in the new licence text if it changed.
