import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SPREADSHEET_ID = '1qRbHHY_05Wxq_lvCFYMdSansiwjfgOmD3Vul1OMW4Ng';
const OUTPUT = new URL('../src/catalog.generated.json', import.meta.url);
const DIRECTIONS = [
  { name: 'Бухгалтерия', sources: [/^Актион Бухгалтерия$/] },
  { name: 'Финансы', sources: [/^Актион Финансы$/] },
  { name: 'Кадры и HR', sources: [/^Актион Кадры и HR$/] },
  { name: 'Право', sources: [/^Актион Право$/] },
  { name: 'ОТ, Промка, Экология', sources: [/^Актион Охрана труда/] },
  { name: 'Бюджет', sources: [/^Актион Госфинансы$/, /^Актион Госзакупки$/] },
  { name: 'Медицина', sources: [/^Актион Медицина$/] },
  { name: 'Образование', sources: [/^Актион Образование$/] },
  { name: 'Лидерство, продажи, маркетинг', sources: [/^Актион Управление$/] },
  { name: 'Цифровые навыки и ресурс команд', sources: [/^Актион Цифровые навыки/] },
  { name: 'Строительство', sources: [/^Актион ПроТех$/] },
  { name: 'Культура', sources: [/^Актион Культура$/] },
];

const clean = value => String(value ?? '')
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+\n/g, '\n')
  .trim();

const decodeXml = value => value
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&apos;/g, "'")
  .replace(/&amp;/g, '&')
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));

function unzipText(file, entry) {
  return execFileSync('unzip', ['-p', file, entry], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
}

function textNodes(xml) {
  return [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(match => decodeXml(match[1])).join('');
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => textNodes(match[1]));
}

function columnIndex(reference) {
  const letters = reference.match(/^[A-Z]+/)?.[0] || 'A';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseSheet(xml, sharedStrings) {
  return [...xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const cells = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cellMatch[1];
      const body = cellMatch[2] || '';
      const reference = attrs.match(/\br="([^"]+)"/)?.[1] || 'A1';
      const type = attrs.match(/\bt="([^"]+)"/)?.[1];
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] || '';
      cells[columnIndex(reference)] = type === 's' ? sharedStrings[Number(raw)] || '' : type === 'inlineStr' ? textNodes(body) : decodeXml(raw);
    }
    return cells;
  });
}

function splitDescription(value) {
  const text = clean(value);
  const paragraphs = text.split(text.match(/\n\s*\n+/) ? /\n\s*\n+/ : /\n+/).map(clean).filter(Boolean);
  return { lead: paragraphs.shift() || '', details: paragraphs.join('\n\n') };
}

function normalizeProduct(cells, columns, firstRowIsProduct = false) {
  let title = clean(cells[columns.title]);
  let description = clean(cells[columns.description]);
  let badge = clean(cells[columns.badge]);
  let audience = clean(cells[columns.audience]);
  let price = clean(cells[columns.price]);
  let resource = columns.resource < 0 ? '' : clean(cells[columns.resource]);
  if (firstRowIsProduct) {
    title = title.replace(/^Блок\s+/i, '');
    description = description.replace(/^Описание\s+/i, '');
    badge = badge.replace(/^Бейдж сверху\s+/i, '');
    audience = audience.replace(/^Кому\s+/i, '');
    price = price.replace(/^Цена\s*\([^)]*\)\s*/i, '');
    resource = resource.replace(/^УДАЛИТЬ\s+/i, '');
  }

  if (/^(нет|no)$/i.test(badge)) badge = '';

  if (/^NEW\s*[-–—]\s*/i.test(title)) {
    badge = 'Новое';
    title = title.replace(/^NEW\s*[-–—]\s*/i, '').trim();
  }

  if (/^\d/.test(price)) price = `от ${price}`;
  const { lead, details } = splitDescription(description);
  return {
    title,
    badge,
    price,
    lead,
    details,
    audience,
    resource,
  };
}

function loadSheetProducts(file, sharedStrings, index) {
  const rows = parseSheet(unzipText(file, `xl/worksheets/sheet${index + 1}.xml`), sharedStrings);
  const hasHeader = clean(rows[0]?.[0]) === 'Блок';
  const headers = hasHeader ? rows[0].map(clean) : [];
  const findColumn = (pattern, fallback) => {
    const found = headers.findIndex(header => pattern.test(header));
    return found < 0 ? fallback : found;
  };
  const columns = {
    title: findColumn(/^Блок$/i, 0),
    description: findColumn(/^Описание$/i, 1),
    badge: hasHeader ? findColumn(/Бейдж/i, -1) : 2,
    audience: findColumn(/^Кому/i, 3),
    price: findColumn(/Цена/i, 4),
    resource: findColumn(/Преза|Промосайт|Материал/i, -1),
  };
  const productRows = hasHeader ? rows.slice(1) : rows;
  const products = productRows
    .map((row, rowIndex) => normalizeProduct(row, columns, !hasHeader && rowIndex === 0))
    .filter(product => product.title);
  if (!products.length) throw new Error(`Sheet ${index + 1}: no product rows found`);
  return products;
}

try {
  const response = await fetch(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Google Sheets returned ${response.status}`);

  const temporaryDirectory = await mkdtemp(join(tmpdir(), 'action-360-catalog-'));
  const workbookFile = join(temporaryDirectory, 'catalog.xlsx');
  await writeFile(workbookFile, Buffer.from(await response.arrayBuffer()));
  const sharedStrings = parseSharedStrings(unzipText(workbookFile, 'xl/sharedStrings.xml'));
  const workbookSheetNames = [...unzipText(workbookFile, 'xl/workbook.xml').matchAll(/<sheet\b[^>]*\bname="([^"]+)"/g)]
    .map(match => decodeXml(match[1]));
  const catalog = DIRECTIONS.map(direction => {
    const sourceIndexes = direction.sources.map(pattern => workbookSheetNames.findIndex(name => pattern.test(name)));
    if (sourceIndexes.some(index => index < 0)) throw new Error(`${direction.name}: source sheet not found`);
    const products = sourceIndexes.flatMap(index => loadSheetProducts(workbookFile, sharedStrings, index));
    return { name: direction.name, products };
  });
  await writeFile(OUTPUT, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
  await rm(temporaryDirectory, { recursive: true, force: true });
  const count = catalog.reduce((sum, section) => sum + section.products.length, 0);
  console.log(`Catalog synced: ${catalog.length} directions, ${count} products.`);
} catch (error) {
  console.error(`Catalog sync failed: ${error.message}`);
  console.error('Keeping the last successfully generated catalog.');
  if (process.env.CATALOG_SYNC_STRICT === '1') process.exitCode = 1;
}
