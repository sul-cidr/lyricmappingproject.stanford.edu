# Notes for agents

Vanilla JS, served with no build step. Nothing is bundled or compiled, and the
site is plain files served as-is. Keep it that way — see the README for why.

## Checks

Run these, in this order, before saying a change is done. They are the same four
things CI runs, and all four should be silent on a clean tree.

```sh
npm test              # needs nothing but Node
npm run lint
npm run format        # or format:check, to see rather than fix
npm run typecheck     # installs @types/node and playwright itself
```

`npm run test:browser` serves the repository and opens it in headless Chromium.
It installs its own dependencies too, but downloads Chromium the first time, so
it is slow on a fresh clone and is not part of `npm test`. Run it for changes to
`js/renderMap/` or anything else that only shows up once Leaflet draws.

## Screenshots in issues and pull requests

A data bug a reader can see on the page is worth showing rather than only
describing, and the picture has to come from the real application.
`tests/browser/serve.js` serves the repository exactly as GitHub Pages does, so
a throwaway Playwright script that imports it gets the actual site. To reach a
particular popup, wrap the Leaflet factory in an init script —

```js
await page.addInitScript(() => {
  let leaflet;
  Object.defineProperty(window, "L", {
    configurable: true,
    get: () => leaflet,
    set: v => {
      leaflet = v;
      const original = v.map;
      v.map = (...args) => (window.__map = original(...args));
    }
  });
});
```

— and then `map.eachLayer()` to find the layer whose popup content matches, and
`layer.openPopup()`. That beats hunting for the right pixel to click. Leave the
basemap tiles unstubbed here: the smoke test stubs them to stay hermetic, but a
screenshot wants the map a reader actually sees.

### Uploading them has no CLI

`gh` cannot attach an image, and the endpoint that does rejects a personal
access token — only a logged-in web session works. So this step needs the user:
ask them to open any issue in the browser, start attaching a file, and copy the
`POST https://github.com/upload/policies/assets` request out of the Network tab
as cURL. The `Cookie` header and `authenticity_token` in it drive three calls:

1. `POST https://github.com/upload/policies/assets` with `name`, `size`,
   `content_type`, `authenticity_token` and `repository_id`, sending the cookie
   plus `origin`, `referer` and `x-requested-with: XMLHttpRequest`. It returns
   an S3 policy and the asset's eventual href.
2. `POST` the returned `form` fields, plus the bytes as `file`, to `upload_url`.
3. `PUT https://github.com{asset_upload_url}` with
   `asset_upload_authenticity_token` to mark it uploaded. Skip this and the
   asset exists but never renders.

`asset.href` is then a `https://github.com/user-attachments/assets/<uuid>` URL,
which is the form to use — it is hosted by GitHub, needs no branch, and does not
put binaries in a repository that is also the published site. Embed it as
`<img width= height= alt= src=>` with alt text saying what the picture shows.
Downscale anything huge first (`sips -Z 1700`, and JPEG for photographic map
shots) so the page stays quick.

Delete the session file afterwards — it is a live login, not a token that can be
scoped or revoked on its own.

One more trap: `gh` may be authenticated as several accounts, and the default
one may have no write access here, which surfaces as `Unauthorized: As an
Enterprise Managed User`. Check `gh auth status` and prefix writes with
`GH_TOKEN=$(gh auth token --user <account>)` rather than switching the global
default.

## Don't run tsc by hand

`npm run typecheck` installs before it checks, deliberately. Calling
`npx tsc -p jsconfig.json` yourself skips that, and the failure is misleading
rather than obvious: without `@types/node`, TypeScript resolves the missing
packages by walking up out of the repository, then reports errors in whatever
unrelated `node_modules` it lands in. A wall of errors in files with `../../`
paths means the install was skipped, not that the code is broken.

## Commit messages and PR descriptions

Both are a one-sentence summary and then a fuller description. The summary is
the commit subject, or the PR title; shorter is better as long as it stays
specific. Say what the change does, in the imperative, and say enough of why
that the line stands on its own — `Report data problems to the console, not to
a dialog the reader dismisses`, not `fix: alerts`. No `type:` prefix and no
issue number: the squash merge appends the PR number itself.

The description carries the argument. What was wrong, what the change does
about it, and the decisions the diff cannot show — the option rejected, the
case deliberately left alone, why a number is that number. Cite issues, files
and old commits by name where they carry the reasoning. Close with a line
saying which checks were run and that they pass.

The PR description and the commit message are that argument in two renderings,
not the same text. The PR body is markdown and uses it: `##` headings, tables,
code fences, backticks, en dashes. The commit message is plain text, so that it
reads in `git log` — no headings, no backticks, ASCII, wrapped at about 80
columns, tables recast as paragraphs or `-` bullets. Write the PR body first,
then render it down.

Keep the `Co-authored-by: Claude ...` trailer and the "Generated with Claude
Code" footer; the attribution is wanted. Never include a `Claude-Session:`
trailer or any other `claude.ai` link. This repository is public and those
sessions are not.
