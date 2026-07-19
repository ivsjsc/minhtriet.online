import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const output = path.join(process.cwd(), 'public');
const manifest = JSON.parse(await fs.readFile(path.join(output, 'build-manifest.json'), 'utf8'));
const failures = [];
const byPath = new Map(manifest.files.map((entry) => [entry.path, entry]));
const assertBudget = (file, maxBytes) => {
  const entry = byPath.get(file);
  if (!entry) failures.push(`Missing performance asset: ${file}`);
  else if (entry.bytes > maxBytes) failures.push(`${file}: ${entry.bytes} bytes exceeds ${maxBytes}`);
};

assertBudget('index.html', 80_000);
for (const entry of manifest.files.filter((item) => /^(en|vi)\/updates\/.*index\.html$/.test(item.path))) assertBudget(entry.path, 50_000);
for (const entry of manifest.files.filter((item) => /^assets\/site\..*\.css$/.test(item.path))) assertBudget(entry.path, 40_000);
for (const entry of manifest.files.filter((item) => /^assets\/site\..*\.js$/.test(item.path))) assertBudget(entry.path, 15_000);
for (const entry of manifest.files.filter((item) => /^images\/ventures\/.*\.webp$/.test(item.path))) assertBudget(entry.path, 220_000);

const primaryPages = ['index.html', ...manifest.files.filter((item) => /^(en|vi)\/updates\/.*index\.html$/.test(item.path)).map((item) => item.path)];
for (const page of primaryPages) {
  const html = await fs.readFile(path.join(output, page), 'utf8');
  if (html.includes('data:image/')) failures.push(`${page}: embedded base64 image found`);
  for (const image of html.matchAll(/<img\b([^>]+)>/gi)) {
    const attributes = image[1];
    if (!/src="\/images\/(?:ventures\/[^\"]+|avatar\.webp)"/.test(attributes)) continue;
    if (!/(?:loading="lazy"|fetchpriority="high")/.test(attributes)) failures.push(`${page}: content image lacks lazy loading or explicit high priority`);
  }
}

if (failures.length) {
  console.error(`Static performance budget failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
const cssBytes = manifest.files.filter((item) => /^assets\/site\..*\.css$/.test(item.path)).reduce((sum, item) => sum + item.bytes, 0);
const jsBytes = manifest.files.filter((item) => /^assets\/site\..*\.js$/.test(item.path)).reduce((sum, item) => sum + item.bytes, 0);
console.log(`Static performance budget passed: critical CSS ${cssBytes} bytes, critical JS ${jsBytes} bytes, optimized WebP editorial assets.`);
