import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const output = path.join(process.cwd(), 'public');
const pages = ['index.html'];
for (const lang of ['en', 'vi']) {
  async function collect(directory) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await collect(full);
      else if (entry.name === 'index.html') pages.push(path.relative(output, full).replaceAll('\\', '/'));
    }
  }
  await collect(path.join(output, lang, 'updates'));
}

const failures = [];
let checks = 0;
const textOnly = (html) => html.replace(/<[^>]+>/g, '').replace(/&[a-z0-9#]+;/gi, ' ').trim();
for (const page of pages) {
  const html = await fs.readFile(path.join(output, page), 'utf8');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  for (const id of new Set(ids)) { checks += 1; if (ids.filter((value) => value === id).length > 1) failures.push(`${page}: duplicate id ${id}`); }
  checks += 1; if (!/<html lang="[^"]+">/.test(html)) failures.push(`${page}: missing html lang`);
  checks += 1; if (!/<main\b[^>]*id="main"/.test(html)) failures.push(`${page}: missing main landmark`);
  checks += 1; if (!/<a class="skip-link" href="#main"/.test(html)) failures.push(`${page}: missing skip link`);
  const h1 = [...html.matchAll(/<h1\b/g)].length; checks += 1; if (h1 !== 1) failures.push(`${page}: expected one h1, found ${h1}`);
  const levels = [...html.matchAll(/<h([1-6])\b/g)].map((match) => Number(match[1]));
  for (let index = 1; index < levels.length; index += 1) { checks += 1; if (levels[index] > levels[index - 1] + 1) failures.push(`${page}: heading jump h${levels[index - 1]} to h${levels[index]}`); }
  for (const image of html.matchAll(/<img\b([^>]+)>/g)) {
    checks += 2;
    if (!/\salt="[^"]*"/.test(image[1])) failures.push(`${page}: image missing alt`);
    if (!/\swidth="\d+"/.test(image[1]) || !/\sheight="\d+"/.test(image[1])) failures.push(`${page}: image missing intrinsic dimensions`);
  }
  for (const button of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
    checks += 1;
    if (!/aria-label="[^"]+"/.test(button[1]) && !textOnly(button[2])) failures.push(`${page}: button missing accessible name`);
  }
  for (const select of html.matchAll(/<select\b([^>]*)>/g)) {
    checks += 1;
    if (!/aria-label="[^"]+"/.test(select[1]) && !/aria-labelledby="[^"]+"/.test(select[1])) failures.push(`${page}: select missing accessible name`);
  }
  for (const anchor of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
    checks += 1;
    if (!/aria-label="[^"]+"/.test(anchor[1]) && !textOnly(anchor[2]) && !/<img\b[^>]*alt="[^"]+"/.test(anchor[2])) failures.push(`${page}: link missing accessible name`);
    if (/target="_blank"/.test(anchor[1]) && !/rel="[^"]*noopener[^"]*noreferrer[^"]*"/.test(anchor[1])) failures.push(`${page}: external new-tab link missing noopener noreferrer`);
  }
}

const css = await fs.readFile(path.join(process.cwd(), 'src', 'site', 'css', 'site.css'), 'utf8');
checks += 3;
if (!css.includes('@media (max-width: 980px)') || !css.includes('@media (max-width: 720px)')) failures.push('Responsive breakpoints missing');
if (!css.includes('@media (prefers-reduced-motion: reduce)')) failures.push('Reduced-motion support missing');
if (/outline\s*:\s*none/.test(css)) failures.push('Focus outline is disabled');

if (failures.length) {
  console.error(`Accessibility static audit failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Accessibility static audit passed: ${checks} checks across ${pages.length} primary pages.`);
