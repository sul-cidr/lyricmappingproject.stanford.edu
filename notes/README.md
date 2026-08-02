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

## Where the control bar lists came from

Issue #373: four `*ToOmit` lists in `js/calcData/data.js`, twenty hardcoded ids,
no reason given for any of them. Three of the four turned out not to be editorial
decisions at all. The CartoDB control bars were hand-written HTML, one radio
button per line, and v2 reproduces them by subtracting from the CSVs whatever
those bars did not list. Set against the last version of the old map, the match
is exact:

    git show 4c3ed7d^:production/html/linemap.html      poets, small regions
    git show 4c3ed7d^:production/html/bubblemap.html    genres
    git show 4c3ed7d^:production/html/imaginary.html    geographical imaginary

The poet lists were generated rather than typed — the SQL is still in
`4c3ed7d^:queries/`, and `query to update poets on travel map.txt` is the
ancestor of `createTravelPoets()`. The small region and genre bars were typed by
hand, which is why only they had to be reproduced by subtraction.

The one list that is not a reproduction is the geographical imaginary, where v2
also drops Pindar. He was on the old bar, and his button showed nothing: all
fifteen of his rows have a blank `cityId`, in the CartoDB data as in this one.
Issue #130 had already settled that thinness is no reason to leave a poet out
("any number of references gets you on there", closed "keep them"), so the
standing rule is the narrower one Peponi applied to Melanippides and Scythinus —
a poet who shows nothing when clicked comes off the list.

Knowing all that, most of the ids went. Twenty are now eight, and the lists draw
exactly what they drew before:

- The travel list is gone. Both rulings had already been carried out in the data,
  so it struck out two poets who could not appear anyway; the reasons are now
  with the archived rows in `dataFiles/removed_data.txt`.
- The geographical imaginary list is gone, replaced by the rule it was standing
  in for — a poet is offered if any one of their references names a city the map
  can place. Cinesias, Bacchylides and Pindar fail that today, and the work that
  would change it is #377 and #326 rather than a decision about scope.
- The small region list keeps six of thirteen. Seven regions are reached by no
  travel line, which the same kind of rule now handles; the six that remain are
  the ones a person has to argue for.
- The genre list keeps both. Neither Diaskeue nor "Possibly lyric" is a genre,
  and no rule can be asked that.

Two things fell out of this that are worth knowing. Most of the regions above id
18 exist to place what the geographical imaginary names rather than to be
travelled to, which is issue #240's "This only matters for the imaginary map";
but three of them — Aeolis, Asia and Asia Minor islands — hold a city the travel
map draws, and no hand ever added them to the bar, so Cyme, Persia, Samos and
Chios are in no small region a reader can select. Samos and Chios were covered
until 14 May 2015, when region 8 stopped reading "Lesbos & other Asia Minor
islands (Samos, Chios)" and became plain "Lesbos". That one is a live bug, and is
asserted as such in `tests/initializeData.test.js`.

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
