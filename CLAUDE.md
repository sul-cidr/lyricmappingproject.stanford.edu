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
