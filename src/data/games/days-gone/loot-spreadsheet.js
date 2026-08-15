const LOOT_SPREADSHEET = "assets/games/days-gone/loot-data/days-gone-all-loot.xlsx";
const ITEM_COLUMNS = ["E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "AA", "AB", "AC", "AD", "AE", "AF", "AG", "AH", "AI", "AJ", "AK", "AL"];
const REGION_STAGING_POINTS = {
  CASCADES: { x: 0.76, y: 0.30 },
  "CAS-BEL": { x: 0.53, y: 0.19 },
  "LOST LAKE": { x: 0.69, y: 0.48 },
};
const GRID_OVERRIDES = {
  "Old Pioneer Cemetery NERO Checkpoint": "I2",
};

function columnFromReference(reference) {
  return reference.replace(/\d/g, "");
}

function textContent(element, tagName) {
  return element?.getElementsByTagNameNS("*", tagName)[0]?.textContent ?? "";
}

async function unzipXlsx(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  let endOffset = -1;

  for (let index = bytes.length - 22; index >= Math.max(0, bytes.length - 65557); index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) {
      endOffset = index;
      break;
    }
  }
  if (endOffset < 0) throw new Error("Invalid loot spreadsheet archive.");

  const directoryOffset = view.getUint32(endOffset + 16, true);
  const entries = new Map();
  let offset = directoryOffset;

  while (view.getUint32(offset, true) === 0x02014b50) {
    const compression = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = new TextDecoder().decode(bytes.slice(offset + 46, offset + 46 + nameLength));
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    entries.set(name, { compression, bytes: bytes.slice(start, start + compressedSize) });
    offset += 46 + nameLength + extraLength + commentLength;
  }

  return async (name) => {
    const entry = entries.get(name);
    if (!entry) throw new Error(`Spreadsheet entry missing: ${name}`);
    if (entry.compression === 0) return new TextDecoder().decode(entry.bytes);
    if (entry.compression !== 8) throw new Error(`Unsupported spreadsheet compression: ${entry.compression}`);
    const stream = new Blob([entry.bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new TextDecoder().decode(await new Response(stream).arrayBuffer());
  };
}

function spreadsheetRows(sharedStringsXml, sheetXml) {
  const parser = new DOMParser();
  const sharedDocument = parser.parseFromString(sharedStringsXml, "application/xml");
  const shared = [...sharedDocument.getElementsByTagNameNS("*", "si")].map((entry) => entry.textContent);
  const sheetDocument = parser.parseFromString(sheetXml, "application/xml");

  return [...sheetDocument.getElementsByTagNameNS("*", "row")].map((row) => {
    const values = {};
    [...row.getElementsByTagNameNS("*", "c")].forEach((cell) => {
      const value = textContent(cell, "v");
      values[columnFromReference(cell.getAttribute("r"))] = cell.getAttribute("t") === "s" ? shared[Number(value)] : value;
    });
    return values;
  });
}

function gridPosition(grid, mapSize) {
  const [, column, row] = grid.match(/^([A-I])(\d+)/);
  return {
    x: ((column.charCodeAt(0) - 65) + 0.5) * (mapSize.width / 9),
    y: (Number(row) - 0.5) * (mapSize.height / 15),
  };
}

function regionalStagingPosition(region, mapSize, index) {
  const anchor = REGION_STAGING_POINTS[region] ?? { x: 0.5, y: 0.5 };
  const angle = index * 2.4;
  const radius = 220 + Math.floor(index / 7) * 135;
  return {
    x: anchor.x * mapSize.width + Math.cos(angle) * radius,
    y: anchor.y * mapSize.height + Math.sin(angle) * radius,
  };
}

function itemCount(value) {
  const numericValue = Number.parseInt(value, 10);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1;
}

export async function loadLootItemMarkers(mapSize) {
  const response = await fetch(LOOT_SPREADSHEET);
  if (!response.ok) throw new Error("Loot spreadsheet could not be loaded.");

  const readEntry = await unzipXlsx(await response.arrayBuffer());
  const rows = spreadsheetRows(await readEntry("xl/sharedStrings.xml"), await readEntry("xl/worksheets/sheet2.xml"));
  const headers = rows[1];
  const markers = [];
  const regionalIndexes = new Map();

  rows.slice(2).forEach((row, rowIndex) => {
    if (!row.D) return;
    const resolvedGrid = GRID_OVERRIDES[row.D] ?? row.B ?? "";
    const hasGridReference = /^[A-I](?:[1-9]|1[0-5])\??$/.test(resolvedGrid);
    const grid = hasGridReference ? resolvedGrid : "Regional staging";
    const regionalIndex = regionalIndexes.get(row.A) ?? 0;
    regionalIndexes.set(row.A, regionalIndex + 1);
    const origin = hasGridReference
      ? gridPosition(resolvedGrid.replace("?", ""), mapSize)
      : regionalStagingPosition(row.A, mapSize, regionalIndex);
    let locationItemIndex = 0;

    ITEM_COLUMNS.forEach((column) => {
      if (!row[column]) return;
      const count = itemCount(row[column]);
      for (let instance = 0; instance < count; instance += 1) {
        const angle = locationItemIndex * 2.4;
        const radius = 48 + Math.floor(locationItemIndex / 7) * 38;
        markers.push({
          id: `loot-${rowIndex + 3}-${column}-${instance + 1}`,
          type: "loot_item",
          title: headers[column].replace(/\n/g, " "),
          location: row.D,
          region: row.A,
          grid: row.B,
          category: row.C ?? "",
          note: [row.AM, !hasGridReference && "Initial regional staging placement — drag to the exact site."].filter(Boolean).join(" · "),
          quantityHint: row[column],
          position: {
            x: origin.x + Math.cos(angle) * radius,
            y: origin.y + Math.sin(angle) * radius,
          },
        });
        locationItemIndex += 1;
      }
    });
  });

  return markers;
}
