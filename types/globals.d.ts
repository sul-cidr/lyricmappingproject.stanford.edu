// Type declarations for Mapping Greek Lyric.
//
// This file is NEVER loaded by the browser and is NOT part of the site. It exists
// only so that editors and `npx tsc -p jsconfig.json` can check the plain ES modules
// in js/. Deleting it does not affect the running site in any way.
//
// Everything here is declared globally, so the .js files can write
// `@param {City} city` without any import boilerplate.

// ---------------------------------------------------------------------------
// Third-party globals, loaded via <script> tags in index.html.
// Typed loosely on purpose: pinning them would mean taking on dependencies
// (@types/leaflet etc.), and the Leaflet plugins we use (geodesic, curve,
// polylineDecorator) have no published types anyway.
// ---------------------------------------------------------------------------

declare const L: any;
declare const Papa: any;
declare const noUiSlider: any;
declare const axe: any;

/** A Leaflet LayerGroup, narrowed to the methods this project calls. */
interface LeafletLayerGroup {
  clearLayers(): void;
  addLayer(layer: any): void;
}

/**
 * The Leaflet map, narrowed to the methods this project calls, plus the three
 * layer groups initializeMap() attaches to it.
 */
interface LyricMap {
  on(event: string, handler: () => void): void;
  getZoom(): number;
  addLayer(layer: any): void;
  bubbleLayerGroup: LeafletLayerGroup;
  legendLayerGroup: LeafletLayerGroup;
  lineLayerGroup: LeafletLayerGroup;
}

// ---------------------------------------------------------------------------
// CSV-backed entities.
//
// Papa Parse hands back every field as a string. hydrate(), in data.js, then
// parses the id/lat/long fields in place into numbers. The types below describe
// the HYDRATED shape, i.e. what the rest of the codebase actually sees; the
// pre-hydration string forms are the Raw* types in types/csv.d.ts.
// ---------------------------------------------------------------------------

// Each of these extends its Raw counterpart in types/csv.d.ts with the parsed
// columns omitted and redeclared. So the string columns are not restated here at
// all: they come from the CSV's own header row, and renaming one in a
// spreadsheet breaks every reader of the hydrated type, not only the tests that
// read the file. What is spelled out below is exactly what hydration changes or
// adds — which is the same list NUMERIC_CSV_FIELDS applies at runtime.

/** A row of dataFiles/cities.csv. */
interface City extends Omit<RawCity, "cityId" | "regionId" | "lat" | "long"> {
  cityId: number;
  regionId: number;
  /** NaN for the two cities with no coordinates; drawBubbles() skips those. */
  lat: number;
  long: number;
  /** Added by addBigRegionIdToCities(); absent for cities with no mapped region. */
  bigRegionId?: number;
}

/** A row of dataFiles/regions.csv. */
interface Region extends Omit<RawRegion, "regionId" | "bigRegionId"> {
  regionId: number;
  bigRegionId: number;
}

/** A row of dataFiles/big_regions.csv. */
interface BigRegion extends Omit<RawBigRegion, "regionId"> {
  regionId: number;
}

/** A row of dataFiles/governments.csv. */
interface Government extends Omit<RawGovernment, "governmentId"> {
  governmentId: number;
}

/** A row of dataFiles/city_politics.csv: one city's regime at one date. */
interface CityPolitics extends Omit<RawCityPolitics, "cityId" | "governmentId" | "date"> {
  cityId: number;
  governmentId: number;
  /** Negative for BCE, e.g. -600. */
  date: number;
}

/** A row of dataFiles/dates.csv. */
interface PoetDate extends Omit<RawDate, "poetId" | "date"> {
  poetId: number;
  /** Negative for BCE, e.g. -600. */
  date: number;
}

/** A row of dataFiles/poets.csv. */
interface Poet extends Omit<RawPoet, "poetId"> {
  poetId: number;
  /**
   * Added by addDatesToPoets() from dates.csv, and required here even though
   * that function can only set it for poets that have rows in dates.csv.
   *
   * This is a claim about the data, not something the code guarantees: a poet
   * with no dates would silently vanish from the map, because getDateFilterFn()
   * compares against these. The claim is enforced by the "every poet on the map
   * has a min and max date" test in tests/initializeData.test.js. If that test
   * is ever deleted, these should go back to being optional.
   */
  minDate: number;
  /** See minDate. */
  maxDate: number;
}

/** A row of dataFiles/genres.csv. */
interface Genre extends Omit<RawGenre, "poetId" | "genreId"> {
  poetId: number;
  genreId: number;
}

/**
 * The strings a popup shows about a poet, read through getPoetDisplay() when the
 * popup is built.
 *
 * These used to be four fields copied onto every poet-city row and travel line
 * at startup — "priming" — so that popups could render without a second lookup.
 * The lookup they saved is a property access on poetsById. What they cost was
 * four fields on each of PoetCity, GeoPoetCity, Line and RenderedPoetCity that
 * the rows did not have for part of startup, and an ordering constraint between
 * the priming pass and createLines().
 */
interface PoetDisplay {
  detailName: string;
  dates: string;
  sources: string;
}

/**
 * How a poet is attested to relate to a city: 1 = born, 2 = died, 3 = active
 * there. These are the only three values poets_cities.csv uses, so a comparison
 * against 4 is now a type error rather than a filter that silently matches
 * nothing.
 *
 * A claim about the data, like Poet.minDate, and enforced the same way: by the
 * "relationshipId is 1, 2 or 3 on every row" test in
 * tests/initializeData.test.js.
 */
type RelationshipId = 1 | 2 | 3;

/** A row of dataFiles/poets_cities.csv, hydrated. */
interface PoetCity extends Omit<RawPoetCity, "poetId" | "cityId" | "relationshipId"> {
  poetId: number;
  cityId: number;
  /** Required: every row of the CSV classifies its attestation. */
  relationshipId: RelationshipId;
}

/** A row of dataFiles/geographical_imaginary_group.csv, hydrated. */
interface GeoPoetCity extends Omit<RawGeoPoetCity, "poetId" | "cityId" | "imaginaryid"> {
  poetId: number;
  cityId: number;
  imaginaryid: number;
  /**
   * Not a column in geographical_imaginary_group.csv, so always absent here.
   * Declared, as undefined rather than as a number, so that code reading it off
   * either kind of row gets RelationshipId | undefined and no more.
   */
  relationshipId?: undefined;
}

// ---------------------------------------------------------------------------
// Derived structures, built at runtime.
// ---------------------------------------------------------------------------

/**
 * One option in the control bar: the id it filters by, and the label shown.
 *
 * An object rather than an [id, name] tuple. TypeScript widens an array literal
 * to `(number | string)[]` unless it is given a contextual tuple type, so every
 * place that built one needed an annotation to say so — and a tuple of two
 * same-typed values could still be filled in the wrong order silently. Named
 * fields infer correctly on their own and cannot be transposed.
 */
interface FilterOption {
  id: number;
  name: string;
}

/**
 * The filter kinds encoded in the first half of a control bar radio button's
 * id, e.g. the "poet" in "poet_93".
 *
 * There are three maps and three sets, overlapping rather than nesting: "poet"
 * is on all three, "all" on geographical imaginary and travel but not places,
 * "relationship" and "genre" only on places, "gov" only on travel. Keeping them
 * as separate unions lets each getter hand back exactly what its own control
 * bar can produce, so consumers switch over two or three cases with nothing
 * impossible left to handle.
 *
 * These are what createPlacesInterfaceHtml() actually emits: ORIGIN and
 * ACTIVITY (relationship), the poets with unknown travel, and the genres.
 */
type PlacesFilterType = "relationship" | "poet" | "genre";

/**
 * What createGeoImaginaryInterfaceHtml() emits: ALL REFERENCES, and one button
 * per poet. It offers no relationship and no genre, and it is the only one of
 * the three place-and-bubble maps with an ALL.
 */
type GeoFilterType = "all" | "poet";

/** As above, for the travel map. */
type TravelFilterType = "all" | "poet" | "destination" | "smallregion" | "region" | "gov";

/** Any filter kind, whichever map produced it. */
type MapFilterType = PlacesFilterType | GeoFilterType | TravelFilterType;

/** One poet's attested movement from one birthplace to one place of activity. */
interface Line {
  poetId: number;
  bornCityId: number;
  activeCityId: number;
  bornPc: PoetCity;
  activePc: PoetCity;
  dotted: boolean;
  bornCity: City;
  activeCity: City;
  bornGovIds: number[];
  activeGovIds: number[];
}

/** The citation block rendered at the bottom of a popup. */
interface Reference {
  source_citation: string;
  source_greektext: string;
  source_translation: string;
  source_translator: string;
  source_poem?: string;
}

/**
 * A poet-city row flattened for rendering: the subset of fields popups need,
 * with the citation collapsed into a single `reference`.
 */
interface RenderedPoetCity {
  poetId: number;
  cityId: number;
  cityname: string;
  poetname: string;
  /** Absent for geographical-imaginary rows, which have no relationship. */
  relationshipId?: RelationshipId;
  reference: Reference;
}

/** A poet grouped inside a geographical-imaginary bubble, with all their citations. */
interface GeoBubblePoet extends RenderedPoetCity {
  references: Reference[];
}

/**
 * The minimum a circle needs to be drawn on the map. Travel mode builds these
 * directly; places and geographical-imaginary modes build the richer Bubble.
 */
interface DrawableBubble {
  city: City;
  /** Legacy name for bubble radius weighting. */
  price: number;
  popupHtml?: string;
  legend?: string;
}

/**
 * The rows behind one places bubble. Split from PlacesBubble because it is all
 * the popup is rendered from, which is what lets a whole bubble be built in one
 * go rather than filled in field by field.
 */
interface PlacesBubbleContents {
  city: City;
  poetCities: RenderedPoetCity[];
}

/**
 * The rows behind one geographical imaginary bubble, which additionally groups
 * them by poet: a poet often names the same place several times, and the popup
 * lists each poet once with all of their citations.
 *
 * `poets` is required here rather than optional on a shared type. It was the
 * latter, described as "only populated in geoimaginaryMode" — true, but not
 * something the type said, so the popup that reads it had to cast.
 */
interface GeoBubbleContents extends PlacesBubbleContents {
  poets: GeoBubblePoet[];
}

/**
 * A circle drawn on the places map. Unlike a travel bubble it always has a
 * popup and a label, so both are required.
 */
interface PlacesBubble extends PlacesBubbleContents, DrawableBubble {
  popupHtml: string;
  legend: string;
}

/** As PlacesBubble, for the geographical imaginary map. */
interface GeoBubble extends GeoBubbleContents, DrawableBubble {
  popupHtml: string;
  legend: string;
}

/** A circle on either of the two bubble maps. */
type Bubble = PlacesBubble | GeoBubble;

/**
 * One drawn arc, merging every Line that shares the same city pair, before its
 * popup is rendered. As PlacesBubbleContents, this is everything the popup is built
 * from, so the DrawnLine below can be built complete.
 */
interface TravelArc {
  fromCity: City;
  toCity: City;
  poetLines: Line[];
  dotted: boolean;
  color: string;
  name: string;
  weight: number;
}

/** A TravelArc with its popup rendered, ready to draw. */
interface DrawnLine extends TravelArc {
  popupHtml: string;
}

/** Which of the three maps is showing. */
type MapMode = "placesMode" | "travelMode" | "geoimaginaryMode";

/**
 * One control bar selection, parsed: the kind of filter, and the id it names.
 *
 * `num` means something different in each case — a relationshipId, a poetId, a
 * genreId, a cityId, a regionId or a governmentId — which is why the three
 * aliases below exist rather than one shared shape.
 */
interface PlacesFilter {
  type: PlacesFilterType;
  num: number;
}

/** As PlacesFilter, for the geographical imaginary map. */
interface GeoFilter {
  type: GeoFilterType;
  num: number;
}

/** As PlacesFilter, for the travel map. */
interface TravelFilter {
  type: TravelFilterType;
  num: number;
}

/**
 * Which map is showing and what its control bar has selected — one value,
 * because the two are not independent. A map mode and a filter its control bar
 * cannot produce is not a state this application has; before this was a union
 * it was merely a state nothing happened to write.
 *
 * The pairing was previously enforced at runtime, by getPlacesFilter() and its
 * neighbours re-parsing a selectedId string on every read and alerting if the
 * halves disagreed. Now the pair is constructed once, by mapStateFrom(), and
 * every consumer narrows it with a switch on currentMapMode.
 */
type MapState =
  | { currentMapMode: "placesMode"; filter: PlacesFilter }
  | { currentMapMode: "travelMode"; filter: TravelFilter }
  | { currentMapMode: "geoimaginaryMode"; filter: GeoFilter };

/** The map showing, its filter, and the date range every map shares. */
interface State {
  map: MapState;
  /** Negative for BCE. */
  minDate: number;
  /** Negative for BCE. */
  maxDate: number;
}

/**
 * The filter each map opens on, before anything is clicked. Typed one field per
 * mode, so a default its own control bar does not offer — placesMode: "all",
 * say — is a compile error rather than an alert on first paint.
 */
interface DefaultFilters {
  placesMode: PlacesFilter;
  travelMode: TravelFilter;
  geoimaginaryMode: GeoFilter;
}

/**
 * The ten CSVs, hydrated: ids and coordinates parsed to numbers, dates negated
 * to BCE years. The pre-hydration string forms are RawCsvs, in types/csv.d.ts.
 */
interface Csvs {
  cities: City[];
  regions: Region[];
  bigRegions: BigRegion[];
  governments: Government[];
  cityPolitics: CityPolitics[];
  dates: PoetDate[];
  poets: Poet[];
  genres: Genre[];
  poetCities: PoetCity[];
  geopoetCities: GeoPoetCity[];
}

/**
 * The by-id lookups. Each is a regrouping of exactly one CSV and depends on
 * nothing else, which is why they can all be built in a single step, before
 * anything that reads them.
 *
 * This, rather than the whole Data, is what getPoet() and its neighbours ask
 * for — so they can be used while Data is still being assembled, and so their
 * signatures say they need a lookup rather than the entire world.
 */
interface Lookups {
  citiesById: Record<number, City>;
  poetsById: Record<number, Poet>;
  regionsById: Record<number, Region>;
  genresByPoetId: Record<number, Genre[]>;
  genresByGenreId: Record<number, string>;
  govsByCityId: Record<number, CityPolitics[]>;
  govsById: Record<number, string>;
  datesByPoetId: Record<number, number[]>;
  /**
   * Every city a poet is attested as born in, distinct. Only 13 of the 93 poets
   * with a birthplace have more than one entry; those are the ones whose popups
   * carry a "See also:" line.
   */
  birthCityIdsByPoetId: Record<number, number[]>;
}

/** The travel lines and the control bar lists, derived from the CSVs through the lookups. */
interface Derived {
  lines: Line[];
  linesByPoetId: Record<number, Line[]>;
  linesByBornCityId: Record<number, Line[]>;
  linesByActiveCityId: Record<number, Line[]>;

  genreIdsWithName: FilterOption[];
  geoImaginaryPoets: FilterOption[];
  travelPoets: FilterOption[];
  travelCities: FilterOption[];
  poetsWithUnknownTravel: FilterOption[];
  regionsForInterface: FilterOption[];
}

/**
 * Everything the map draws from, assembled once by initializeData() and not
 * added to afterwards. The three halves above are the order it is built in.
 */
interface Data extends Csvs, Lookups, Derived {}
