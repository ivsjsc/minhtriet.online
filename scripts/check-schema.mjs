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

const response = await fetch('https://schema.org/docs/jsonldcontext.json');
if (!response.ok) throw new Error(`Schema.org context request failed: ${response.status}`);
const officialContext = (await response.json())['@context'];
const knownTerms = new Set(Object.keys(officialContext));
const failures = [];
let graphs = 0;
let terms = 0;

function validateNode(node, page) {
  if (Array.isArray(node)) { node.forEach((item) => validateNode(item, page)); return; }
  if (!node || typeof node !== 'object') return;
  for (const [key, value] of Object.entries(node)) {
    if (!key.startsWith('@')) {
      terms += 1;
      if (!knownTerms.has(key)) failures.push(`${page}: unknown Schema.org property ${key}`);
    }
    if (key === '@type') {
      for (const type of Array.isArray(value) ? value : [value]) if (!knownTerms.has(type)) failures.push(`${page}: unknown Schema.org type ${type}`);
    }
    validateNode(value, page);
  }
}

for (const page of pages) {
  const html = await fs.readFile(path.join(output, page), 'utf8');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) failures.push(`${page}: no JSON-LD found`);
  for (const block of blocks) {
    let data;
    try { data = JSON.parse(block[1]); } catch (error) { failures.push(`${page}: JSON-LD parse error (${error.message})`); continue; }
    graphs += 1;
    validateNode(data, page);
    const graph = data['@graph'];
    if (!Array.isArray(graph) || graph[0]?.['@type'] !== 'Person') failures.push(`${page}: Person must be the first entity in @graph`);
    const article = graph?.find((entry) => entry['@type'] === 'Article');
    if (article) {
      if (article.author?.['@id'] !== 'https://minhtriet.online/#person') failures.push(`${page}: Article author must reference the portfolio Person`);
      if (article.dateModified && !article.datePublished) failures.push(`${page}: dateModified exists without datePublished`);
      if (!String(article.image || '').startsWith('https://minhtriet.online/')) failures.push(`${page}: Article image must use an absolute portfolio URL`);
    }
  }
}

if (failures.length) {
  console.error(`Schema validation failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log(`Schema validation passed against the official Schema.org context: ${graphs} graphs, ${terms} property references, ${pages.length} pages.`);
