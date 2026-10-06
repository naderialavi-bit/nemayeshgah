/*
NEMAYESHGAH — Google Drive + Google Sheets bridge

قبل از Deploy فقط این دو مقدار را تنظیم کن:
1) FOLDER_ID = شناسه پوشه nemayeshgah
2) SHEET_ID = شناسه فایل Google Sheet
*/

const FOLDER_ID = "1JyF_SSRCgeUNH_MSjZnuamOtiR1rCPLv";
const SHEET_ID = "1jHZoggZeE2D22WO0V0oswD9JwLO3PRDDjxlwpIi30w4";
const SHEET_NAME = "Artworks";

function doGet(e) {
  const output = {
    artworks: getArtworks(),
    generatedAt: new Date().toISOString(),
  };

  const callback = e && e.parameter && e.parameter.callback;
  if (callback && /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(callback)) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(output)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

function getArtworks() {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();

  const fileMap = {};
  while (files.hasNext()) {
    const file = files.next();
    fileMap[file.getName().trim().toLowerCase()] = {
      id: file.getId(),
      name: file.getName(),
      mimeType: file.getMimeType(),
    };
  }

  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Sheet named "Artworks" was not found.');
  }

  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim().toLowerCase());

  const col = (name) => headers.indexOf(name);

  const result = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];

    const filename = row[col("filename")] || "";
    const visibleRaw = row[col("visible")] || "TRUE";
    const visible = !["false", "0", "no", "نه"].includes(String(visibleRaw).trim().toLowerCase());

    if (!filename || !visible) continue;

    const file = fileMap[String(filename).trim().toLowerCase()];
    if (!file) continue;

    result.push({
      order: Number(row[col("order")] || rowIndex) || rowIndex,
      filename: file.name,
      fileId: file.id,
      title: row[col("title")] || file.name,
      description: row[col("description")] || "",
      year: row[col("year")] || "",
      technique: row[col("technique")] || "",
      visible: true,
      slug: slugify(row[col("title")] || file.name),
    });
  }

  result.sort((a, b) => a.order - b.order);
  return result;
}

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FF\w-]+/g, "")
    .replace(/-+/g, "-");
}

function testConnection() {
  const artworks = getArtworks();
  Logger.log(JSON.stringify(artworks, null, 2));
}
