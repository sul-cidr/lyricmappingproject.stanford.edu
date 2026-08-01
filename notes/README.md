# Project notes

Meeting minutes and research notes from 2014–15, when the map was a CartoDB
application and the data lived in spreadsheets. They were deleted in
`4c3ed7d "delete old map"` (4 December 2023) along with the map they belonged
to, and are restored here as text.

They are worth having back because the CSVs still carry decisions taken in these
meetings, and nothing else in the repository says so. A row that looks like a
mistake is quite often a ruling — and the reverse is also true, which is why the
index below distinguishes rulings that landed from rulings that did not.

Converted from RTF and DOCX with `textutil`; the wording is unchanged.

## Contents

- `minutes/` — seventeen meetings, February 2014 to September 2015.
- `corrections-2015-12.md` — A.-E. Peponi's corrections of December 2015, run
  through to a "FINAL Dec. 13th". The densest single document here: most of the
  vocabulary the interface still uses was settled in it.
- `research/travel-questions.md` — open questions about the corpus, including
  the caveat that Bacchylides' places of activity are victory sites rather than
  attested visits.
- `research/geographical-imaginary-examples.md` — the worked examples the
  geographical imaginary was piloted on (Olympian 1, Bacchylides 17).
- `research/new-poets-searches.md`, `research/searches.md` — how the poet list
  was assembled, from the New Pauly and the TLG canon.

## Decisions that still bind the data

Each of these is a standing ruling, not a one-off fix. Where it is recorded in a
GitHub issue the issue number is given, since the issues are searchable and
these files are not.

**A poet may have several attested birthplaces, and all of them are shown.**
Issue #33, "pick one birthplace for tyrtaeus", was closed "We no longer do
this"; #208 and #218 then asked for the alternative traditions to be displayed.
Thirteen poets have more than one. This is why Tyrtaeus has three and Sappho
two, and it is not a data error.

**ACTIVITY splits into NATIVE and NON-NATIVE, non-native first.** Peponi's
suggestion, issue #165: "The NON-NATIVE should come first, I think, since this
is more unexpected." Renamed from "NATIVE POETS ACTIVE IN X" to "NATIVE LYRIC
ACTIVITY IN X" in the December corrections, on the reasoning that "a poet was
not necessarily there but his poetry was circulating in that area". Still what
`createActivePopupHtml` renders.

**Being born in a city and counting as a native of it are different questions.**
Issues #257 (Alcman) and #284 (Euripides): "Though we have to state his birth on
Salamis it is important to include him in the native poets of Athens." The
answer was the `nativeid` column, and `28f4504 "changed active query from
relationshipid to nativeid"` pointed the old ACTIVITY query at it. **This did
not survive the rewrite** — v2 splits on `relationshipId`, so Alcman is a native
of Sparta again, which is what #257 was raised to prevent. `nativeid` is
otherwise a copy of `relationshipId` on every row of `poets_cities.csv`, which
is why it looks redundant.

**A disputed origin says "See also: <the other cities>".** How #208, #218 and
the second half of #257 were closed — a derived line in the old query,
`'<br>See also: ' || string_agg(birth_cities.city_name, ...)`. **Also dropped in
the rewrite**, and now open issue #332, which asks for "Poets possibly born in
Sardis" and wonders whether Alcman is the only case. He is not; there are
thirteen.

**Tyrtaeus is not active in Sicily.** Issue #271: "Messena (Sicily) - Tyrtaeus -
erase this location from his activity (it refers to the Pelop. location)", with
#272 adding the Messenian region he goes to instead. The two Sicilian rows were
retired by blanking their `relationshipid` rather than being deleted, which left
them showing under ACTIVITY for another decade.

**Pindar and Bacchylides get dotted lines wherever the evidence is a title.**
December corrections: "IN GENERAL : to be consistent we need dotted lines for
Pindar and Bacchylides in all cases we use TITLES." The `dotted` column.

**TRAVEL is called MOBILITY, and ALL TRAVEL is ALL CASES.** December
corrections, for the same reason as the ACTIVITY rename: the term "covers us in
all cases where it seems that the poetry is mobile but we do not know if the
poet was actually there". Still in `travelInterface.js`.

**ORIGIN SOURCE and ACTIVITY SOURCE are singular.** December corrections, item 3. Still in `travelPopups.js`.

**The project does not adjudicate its sources.** December corrections: 'Intro –
please add a couple of words: "We report and display data based on the ancient
sources, without judging whether they are all historically accurate"'. Still the
third sentence of the essay, in `js/essay/essay.js`.

The December corrections also settle a long list of regimes — Salamis follows
Athens, Isthmus follows Corinth, the sanctuary of Poseidon Petraios follows
Larisa, Mt. Ptoios follows Akraiphia, Messenia follows Sparta after the
Messenian Wars — and are the place to check before changing `city_politics.csv`.

## Not restored

The rest of what `4c3ed7d` deleted documents a map that no longer exists: the
CartoDB SQL under `queries/`, the CartoDB CSS, the jQRangeSlider vendor docs,
and the letters and blog drafts under `humanities + design/`. They are still in
git, one command away:

    git show 4c3ed7d^:'queries/big activity query with native and non-native poets.txt'

`old/humanities + design/12-9-13 meeting.rtf` is deliberately left out: it
records a login and password for the Palladio beta.

## Stephanis

`old/` also held working material from I. E. Stephanis, _Διονυσιακοὶ Τεχνῖται_
(Heraklion 1988) — the preface in full, and page scans with transcriptions:

    old/intro to stefanis.txt          the ΠΡΟΛΟΓΟΣ, 20 KB of Greek
    old/stefanis p. 95.JPG
    old/stefanis p. 117.JPG   + .rtf   transcription
    old/stefanis p. 118.JPG   + .rtf
    old/stefanis p. 352.JPG   + .rtf
    old/stefanis p. 441.JPG   + .rtf
    old/stefanis p. 442.JPG   + .rtf

Left out of this restore because republishing scanned pages of an in-copyright
book is a decision for the project rather than a cleanup. The blobs are in the
history either way.
