import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const output = path.join(root, 'public');
const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);

const updatesDir = path.join(root, 'src', 'content', 'updates');
const updateFiles = (await fs.readdir(updatesDir)).filter((name) => name.endsWith('.json')).sort();
const updates = [];
for (const file of updateFiles) {
  try { updates.push(JSON.parse(await fs.readFile(path.join(updatesDir, file), 'utf8'))); }
  catch (error) { fail(`${file}: invalid JSON (${error.message})`); }
}

for (const item of updates) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || '')) fail(`${item.slug || '<missing slug>'}: invalid slug`);
  if (!item.en?.title || !item.vi?.title) fail(`${item.slug}: missing EN or VI title`);
  if (!Array.isArray(item.en?.sections) || !Array.isArray(item.vi?.sections)) fail(`${item.slug}: missing article sections`);
  if (item.dateModified && !item.datePublished) fail(`${item.slug}: dateModified cannot exist without datePublished`);
  if (!item.datePublished) warnings.push(`${item.slug}: publication date pending; generated pages remain noindex and are excluded from sitemap`);
  const serialized = JSON.stringify(item);
  if (/\b\d+(?:[.,]\d+)?\s*(?:%|\+|projects?|clients?|schools?|users?|leads?)\b/i.test(serialized)) fail(`${item.slug}: possible unverified quantitative claim`);
}

for (const file of ['ventures.json', 'case-studies.json']) {
  const data = JSON.parse(await fs.readFile(path.join(root, 'src', 'content', file), 'utf8'));
  for (const entry of data) {
    if (!Array.isArray(entry.metrics)) fail(`${file}/${entry.id}: metrics must be an array`);
    if (entry.metrics.length) fail(`${file}/${entry.id}: metrics must remain empty until verified`);
  }
}

const enText = await fs.readFile(path.join(root, 'src', 'site', 'lang', 'en.js'), 'utf8');
const viText = await fs.readFile(path.join(root, 'src', 'site', 'lang', 'vi.js'), 'utf8');
const homeSource = await fs.readFile(path.join(root, 'src', 'site', 'index.html'), 'utf8');
const keys = [...homeSource.matchAll(/data-i18n(?:-alt)?="([^"]+)"/g)].map((match) => match[1]);
for (const key of new Set(keys)) {
  if (!enText.includes(`"${key}"`)) fail(`Missing EN key: ${key}`);
  if (!viText.includes(`"${key}"`)) fail(`Missing VI key: ${key}`);
}

const pages = ['index.html'];
for (const item of updates) for (const lang of ['en', 'vi']) pages.push(`${lang}/updates/${item.slug}/index.html`);
for (const lang of ['en', 'vi']) pages.push(`${lang}/updates/index.html`);

for (const relative of pages) {
  const full = path.join(output, relative);
  let html;
  try { html = await fs.readFile(full, 'utf8'); } catch { fail(`Missing generated page: ${relative}`); continue; }
  if (/\{\{[A-Z0-9_]+\}\}/.test(html)) fail(`${relative}: unresolved build token`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!schemas.length) fail(`${relative}: missing structured data`);
  for (const schema of schemas) {
    try { JSON.parse(schema[1]); } catch (error) { fail(`${relative}: invalid JSON-LD (${error.message})`); }
  }
  if (relative.includes('/updates/')) {
    const canonical = html.match(/<link rel="canonical" href="([^"]+)">/)?.[1];
    const expected = `https://minhtriet.online/${relative.replace(/index\.html$/, '')}`;
    if (canonical !== expected) fail(`${relative}: canonical mismatch (${canonical} != ${expected})`);
    for (const lang of ['en', 'vi']) {
      const hreflang = html.match(new RegExp(`<link rel="alternate" hreflang="${lang}" href="([^"]+)">`))?.[1];
      const routeSuffix = relative.split('/updates/')[1].replace(/index\.html$/, '');
      const target = `https://minhtriet.online/${lang}/updates/${routeSuffix}`;
      if (hreflang !== target) fail(`${relative}: ${lang} hreflang mismatch`);
      const targetFile = path.join(output, lang, 'updates', routeSuffix, 'index.html');
      try { await fs.access(targetFile); } catch { fail(`${relative}: reciprocal target missing for ${lang}`); }
    }
    if (!html.includes('hreflang="x-default" href="https://minhtriet.online/en/updates/')) fail(`${relative}: x-default must point to EN route`);
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(output, 'build-manifest.json'), 'utf8'));
const migrationAllowlist = JSON.parse(await fs.readFile(path.join(root, 'src', 'migration-allowlist.json'), 'utf8'));
for (const required of migrationAllowlist.required) {
  if (!manifest.files.some((entry) => entry.path === required)) fail(`Build manifest missing allowlisted asset: ${required}`);
}

if (failures.length) {
  console.error(`Validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Validation passed: ${pages.length} primary pages, ${keys.length} localized references, ${manifest.files.length} built files.`);
for (const message of warnings) console.warn(`Warning: ${message}`);
