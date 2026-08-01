# Mapping Greek Lyric: Places, Travel, Geographical Imaginary

This project is the first-ever attempt to illustrate on an interactive map key geocultural aspects of the rich lyric production that was generated and spread throughout the Greek world from the 8th to the beginning of the 4th century BC. We report and display data based on the ancient sources, without judging whether they are all historically accurate. It is the users’ responsibility to explore further.

The composition of melic, elegiac and iambic poetry, all included here under the term lyric, was a crucial component of Greek musical cultures. As mousike, with its various combinations of vocal, instrumental and kinetic activity, was a cornerstone in forming sensibilities and establishing ideologies, our project aspires to be a useful tool for all those interested in exploring the local origins and mobile dynamics of performance and culture in the ancient world.

Created and implemented by David Driscoll, designed and researched by David Driscoll, Israel McMullin, Stephen Sansom, maintained by Sinead Brennan-McMahon, headed by Anastasia-Erasmia Peponi.

Please cite as: D. Driscoll, I. McMullin, S. Sansom, S. Brennan-McMahon, A.-E. Peponi. Mapping Greek Lyric : Places, Travel, Geographical Imaginary [Date of access] (http://lyricmappingproject.stanford.edu)

Many thanks to: Stanford's Department of Classics for financial support, Ancient World Mapping Center, CartoDB, jQRangeSlider, Mapbox, Orbis, Pleiades, and Stanford's Humanities + Design Lab.

## Working on the code

The code is vanilla JS and is served without a build step. The goal is to
require minimal maintenance and let the site work as-is for as long as possible.
To develop, serve the directory — for example `python3 -m http.server 8000`.

### Tests

There are nevertheless tests, run in CI on every pull request.

```sh
node --test tests/*.test.js     # or: npm test
```

They use Node's built-in runner, so there is nothing to install. Most check the
CSVs in `dataFiles/`, which is where this project's bugs have historically come
from. Some record known data problems we plan to fix.

There is also a browser smoke test, which serves the repository and opens it in
headless Chromium to check each map actually paints and that nothing errors. It
needs an install, so it is kept separate from `npm test`:

```sh
npm run test:browser
```

That installs its own dependencies first, downloading Chromium the first time,
which is slow. Everything after the first run is fast.

### Formatting

Prettier, checked in CI. Run it before committing, or let your editor do it —
`.vscode/settings.json` already formats on save.

```sh
npm run format
```

### Types

Types are JSDoc comments, declared in `types/` and checked by TypeScript in
`--noEmit` mode. Nothing is compiled: the shipped files stay plain JavaScript,
and deleting `jsconfig.json` and `types/` would leave the site working exactly
as it does now.

```sh
npm run typecheck
```

It installs what it needs first, so it is clean from a fresh clone. Skipping
that install does not merely skip a check — it makes `tsc` report errors in
files that are not this project's, because `@types/node` is missing and
TypeScript resolves the missing packages by walking up to whatever
`node_modules` it can find above the repository.

The dependencies are `@types/node`, needed to check the tests, and `playwright`,
needed to check the browser smoke test. Both are type declarations as far as
this project is concerned: nothing from `node_modules` is imported by the site,
served or deployed.
