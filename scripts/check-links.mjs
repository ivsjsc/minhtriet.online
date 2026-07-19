import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const output = path.join(root, 'public');
const pages = ['index.html'];
for (const lang of ['en', 'vi']) {
  const updatesRoot = path.join(output, lang, 'updates');
  async function collect(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(full);
      else if (entry.name === 'index.html') pages.push(path.relative(output, full).replaceAll('\\', '/'));
    }
  }
  await collect(updatesRoot);
}

const failures = [];
let checked = 0;
for (const page of pages) {
  const html = await fs.readFile(path.join(output, page), 'utf8');
  const ids = new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  for (const match of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const value = match[1];
    if (!value || value.startsWith('mailto:') || value.startsWith('tel:') || value.startsWith('data:') || value.startsWith('https://') || value.startsWith('http://')) continue;
    checked += 1;
    if (value.startsWith('#')) {
      if (!ids.has(value.slice(1))) failures.push(`${page}: missing anchor ${value}`);
      continue;
    }
    const url = new URL(value, `https://minhtriet.online/${page}`);
    let pathname = decodeURIComponent(url.pathname);
    if (/^\/(?:en|vi|de|es|fr|ja|ko|ru|th|zh)\/?$/.test(pathname)) pathname = '/index.html';
    else if (pathname.endsWith('/')) pathname += 'index.html';
    else if (!path.extname(pathname)) pathname += '/index.html';
    const target = path.join(output, pathname.replace(/^\//, ''));
    try { await fs.access(target); } catch { failures.push(`${page}: missing ${value} -> ${path.relative(output, target)}`); }
  }
}

if (failures.length) {
  console.error(`Link check failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Link check passed: ${checked} internal references across ${pages.length} primary pages.`);
