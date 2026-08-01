// A minimal RFC-4180 CSV reader, so the tests have no dependencies at all.
//
// The site itself parses these files with Papa Parse in the browser; the tests
// deliberately do not reuse that code, both to avoid vendoring it into Node and
// so that a parser bug cannot hide a data bug from itself.

/**
 * Returns an array of rows, each an array of raw string fields. Strips a
 * leading UTF-8 BOM, which regions.csv and big_regions.csv both have.
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsvRows(text) {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  /** @type {string[][]} */
  const rows = [];
  /** @type {string[]} */
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // handled by the \n that follows
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Reads a CSV into objects keyed by its header row, the same shape Papa Parse
 * produces in the browser. Fields are left as strings.
 * @param {string} text
 * @returns {Record<string, string>[]}
 */
export function parseCsv(text) {
  const rows = parseCsvRows(text);
  if (rows.length === 0) return [];
  const header = rows[0];
  return rows.slice(1).map(cells => {
    /** @type {Record<string, string>} */
    const obj = {};
    header.forEach((name, idx) => {
      obj[name] = cells[idx] ?? "";
    });
    return obj;
  });
}
