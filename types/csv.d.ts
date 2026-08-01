// Types for the raw CSV rows as the tests read them from disk.
//
// js/ works with hydrated data — ids parsed to numbers, dates negated, derived
// lookups attached — which is what types/globals.d.ts describes. The tests also
// read the files exactly as they sit on disk, where every field is a string and
// only the CSV's own columns exist. Those shapes are declared here.
//
// The interfaces below were generated from the actual header rows, so a column
// renamed in a spreadsheet shows up as a type error in the tests that read it.
//
// Like globals.d.ts, this file is never loaded by the browser and is not part
// of the site.

/** A row of dataFiles/regions.csv, exactly as parsed: every field a string. */
interface RawRegion {
  regionId: string;
  bigRegionId: string;
  regionname: string;
}

/** A row of dataFiles/cities.csv, exactly as parsed: every field a string. */
interface RawCity {
  cityname: string;
  infowindowName: string;
  cityId: string;
  notes: string;
  lat: string;
  long: string;
  region: string;
  regionId: string;
}

/** A row of dataFiles/poets_cities.csv, exactly as parsed: every field a string. */
interface RawPoetCity {
  poetname: string;
  poetId: string;
  cityname: string;
  cityId: string;
  /** Human-readable form of relationshipId; often blank in the CSV. */
  relationship: string;
  relationshipId: string;
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

/** A row of dataFiles/poets.csv, exactly as parsed: every field a string. */
interface RawPoet {
  poetname: string;
  poetDetailName: string;
  poetId: string;
  sources: string;
  dates: string;
  dates_source: string;
  notes: string;
}

/** A row of dataFiles/genres.csv, exactly as parsed: every field a string. */
interface RawGenre {
  genres_poetname: string;
  poetId: string;
  genre: string;
  genreId: string;
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

/** A row of dataFiles/geographical_imaginary_group.csv, exactly as parsed: every field a string. */
interface RawGeoPoetCity {
  imaginaryid: string;
  poetname: string;
  poetId: string;
  cityname: string;
  cityId: string;
  relationship: string;
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

/** A row of dataFiles/city_politics.csv, exactly as parsed: every field a string. */
interface RawCityPolitics {
  city: string;
  cityId: string;
  government: string;
  governmentId: string;
  "questionable?": string;
  date: string;
  notes: string;
}

/** A row of dataFiles/big_regions.csv, exactly as parsed: every field a string. */
interface RawBigRegion {
  regionId: string;
  regionname: string;
}

/** A row of dataFiles/dates.csv, exactly as parsed: every field a string. */
interface RawDate {
  dates_poetname: string;
  poetId: string;
  date: string;
  iso_8601: string;
  notes: string;
}

/** A row of dataFiles/governments.csv, exactly as parsed: every field a string. */
interface RawGovernment {
  government: string;
  governmentId: string;
}

/** The ten CSVs as the tests load them from disk. */
interface RawCsvs {
  regions: RawRegion[];
  cities: RawCity[];
  poetCities: RawPoetCity[];
  poets: RawPoet[];
  genres: RawGenre[];
  geopoetCities: RawGeoPoetCity[];
  cityPolitics: RawCityPolitics[];
  bigRegions: RawBigRegion[];
  dates: RawDate[];
  governments: RawGovernment[];
}

/**
 * Which fields of which CSV hydrate() parses out of their string form.
 *
 * Total over the ten CSVs, and each field name is checked against that CSV's own
 * columns — `keyof RawCsvs[K][number]` is the column set of one row of table K.
 * So a field named here that the CSV does not have, or a table left out
 * entirely, is a type error.
 *
 * This exists because hydrate() used to be a flat list of forEach calls with no
 * relationship to the types they were producing, and three fields were simply
 * missing from it: poets.poetId, genres.poetId, and the whole of bigRegions.
 */
type NumericCsvFields = {
  [K in keyof RawCsvs]: {
    int?: (keyof RawCsvs[K][number])[];
    float?: (keyof RawCsvs[K][number])[];
    /** Written as a positive year BCE in the CSV, stored negative so it sorts. */
    bce?: (keyof RawCsvs[K][number])[];
  };
};

/** The three tables that carry source citations. */
type CitedCsv = "poetCities" | "geopoetCities" | "genres";

/** The two tables that join poets to cities. */
type PoetCityCsv = "poetCities" | "geopoetCities";
