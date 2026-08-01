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
// Papa Parse hands back every field as a string. initializeData() then mutates
// the id/lat/long fields in place into numbers. The types below describe the
// HYDRATED shape, i.e. what the rest of the codebase actually sees; the raw
// pre-hydration arrays are cast to any[] inside initializeData().
// ---------------------------------------------------------------------------

/** A row of dataFiles/cities.csv. */
interface City {
  cityname: string;
  infowindowName: string;
  cityId: number;
  notes: string;
  lat: number;
  long: number;
  region: string;
  regionId: number;
  /** Added by addBigRegionIdToCities(); absent for cities with no mapped region. */
  bigRegionId?: number;
}

/** A row of dataFiles/regions.csv. */
interface Region {
  regionId: number;
  bigRegionId: number;
  regionname: string;
}

/** A row of dataFiles/big_regions.csv. */
interface BigRegion {
  regionId: number;
  regionname: string;
}

/** A row of dataFiles/governments.csv. */
interface Government {
  government: string;
  governmentId: number;
}

/** A row of dataFiles/city_politics.csv: one city's regime at one date. */
interface CityPolitics {
  city: string;
  cityId: number;
  government: string;
  governmentId: number;
  "questionable?": string;
  /** Negative for BCE, e.g. -600. */
  date: number;
  notes: string;
}

/** A row of dataFiles/dates.csv. */
interface PoetDate {
  dates_poetname: string;
  poetId: number;
  /** Negative for BCE, e.g. -600. */
  date: number;
  iso_8601: string;
  notes: string;
}

/** A row of dataFiles/poets.csv. */
interface Poet {
  poetname: string;
  poetDetailName: string;
  poetId: number;
  sources: string;
  dates: string;
  dates_source: string;
  notes: string;
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
interface Genre {
  genres_poetname: string;
  poetId: number;
  genre: string;
  genreId: number;
  source_work: string;
  source_workid: string;
  source_citation: string;
  source_greektext: string;
  source_translation: string;
  source_translator: string;
  source_notes: string;
  source_explicit: string;
  notes: string;
  source: string;
}

/**
 * Poet metadata copied onto poet-city rows and travel lines by
 * primeObjWithPoetData(), so popups can render without a second lookup.
 */
interface PoetPrimed {
  poetDetailName: string;
  poetDates: string;
  poetSources: string;
  poetGenres: string;
}

/** A row of dataFiles/poets_cities.csv, after hydration and priming. */
interface PoetCity extends PoetPrimed {
  poetname: string;
  poetId: number;
  cityname: string;
  cityId: number;
  /** Human-readable form of relationshipId; often blank in the CSV. */
  relationship: string;
  /** 1 = born, 2 = died, 3 = performed. Prefer this over `relationship`. */
  relationshipId: number;
  nativeid: string;
  /** The literal string "dotted", or "". Marks an inferred connection. */
  dotted: string;
  notes: string;
  source_work: string;
  source_workid: string;
  source_citation: string;
  source_greektext: string;
  source_translation: string;
  source_translator: string;
  source_notes: string;
  source_explicit: string;
}

/** A row of dataFiles/geographical_imaginary_group.csv, after hydration and priming. */
interface GeoPoetCity extends PoetPrimed {
  imaginaryid: number;
  poetname: string;
  poetId: number;
  cityname: string;
  cityId: number;
  relationship: string;
  /**
   * Not a column in geographical_imaginary_group.csv, so always undefined here.
   * Declared so code can read it off either kind of row.
   */
  relationshipId?: number;
  destination: string;
  destination_id: string;
  speaker: string;
  speakerid: string;
  notes: string;
  source_poem: string;
  source_citation: string;
  original_source: string;
  source_greektext: string;
  source_translation: string;
  source_translator: string;
  source_notes: string;
  source_explicit: string;
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
 * The filter kinds encoded in the first half of State.selectedId, e.g. the
 * "poet" in "poet_93".
 *
 * Each map offers its own set, and the two overlap rather than nest: "all" and
 * "poet" appear on both, "genre" only on places, "gov" only on travel. Keeping
 * them as separate unions lets getPlacesFilter() and getTravelFilter() each
 * hand back exactly what their map can produce, so consumers switch over four
 * or six cases with nothing impossible left to handle.
 */
type PlacesFilterType = "all" | "relationship" | "poet" | "genre";

/** As PlacesFilterType, for the travel map. */
type TravelFilterType = "all" | "poet" | "destination" | "smallregion" | "region" | "gov";

/** Any filter kind, whichever map produced it. */
type MapFilterType = PlacesFilterType | TravelFilterType;

/** One poet's attested movement from one birthplace to one place of activity. */
interface Line extends PoetPrimed {
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
interface RenderedPoetCity extends PoetPrimed {
  poetId: number;
  cityId: number;
  cityname: string;
  poetname: string;
  /** Undefined for geographical-imaginary rows, which have no relationship. */
  relationshipId?: number;
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
 * The rows behind one city's bubble. Split from Bubble because it is all the
 * popup is rendered from, which is what lets calculateBubbles() build a whole
 * Bubble in one go rather than filling an empty one in field by field.
 */
interface BubbleContents {
  city: City;
  poetCities: RenderedPoetCity[];
  /** Only populated in geoimaginaryMode. */
  poets?: GeoBubblePoet[];
}

/** A circle drawn on the map for one city, with the rows behind its popup. */
interface Bubble extends BubbleContents, DrawableBubble {}

/**
 * One drawn arc, merging every Line that shares the same city pair, before its
 * popup is rendered. As BubbleContents, this is everything the popup is built
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

/** Which of the three maps is showing, and the current filters. */
interface State {
  currentMapMode: "placesMode" | "travelMode" | "geoimaginaryMode";
  /** Negative for BCE. */
  minDate: number;
  /** Negative for BCE. */
  maxDate: number;
  /** The checked radio button's id, e.g. "poet_93" or "relationship_1". */
  selectedId: string;
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
