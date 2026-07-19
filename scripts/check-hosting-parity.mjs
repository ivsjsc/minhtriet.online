import { promises as fs } from 'node:fs';
import process from 'node:process';

const firebase = JSON.parse(await fs.readFile('firebase.json', 'utf8'));
const netlify = await fs.readFile('netlify.toml', 'utf8');
const failures = [];
const assert = (condition, message) => { if (!condition) failures.push(message); };

assert(firebase.hosting.public === 'public', 'Firebase must publish public/');
assert(firebase.hosting.predeploy?.includes('npm run build'), 'Firebase must run npm run build before deploy');
assert(/command\s*=\s*"npm run build"/.test(netlify), 'Netlify must run npm run build');
assert(/publish\s*=\s*"public"/.test(netlify), 'Netlify must publish public/');

const firebaseRedirects = firebase.hosting.redirects || [];
for (const source of ['/updates', '/updates/']) {
  const rule = firebaseRedirects.find((item) => item.source === source);
  assert(rule?.destination === '/en/updates/' && rule?.type === 301, `Firebase redirect mismatch for ${source}`);
  const escaped = source.replaceAll('/', '\\/');
  assert(new RegExp(`from\\s*=\\s*"${escaped}"[\\s\\S]*?to\\s*=\\s*"\\/en\\/updates\\/"[\\s\\S]*?status\\s*=\\s*301`).test(netlify), `Netlify redirect mismatch for ${source}`);
}

const firebaseAssetHeader = (firebase.hosting.headers || []).find((rule) => rule.source === '/assets/**');
assert(firebaseAssetHeader?.headers?.some((header) => header.key === 'Cache-Control' && header.value.includes('immutable')), 'Firebase hashed assets must be immutable');
assert(/for\s*=\s*"\/assets\/\*"[\s\S]*?immutable/.test(netlify), 'Netlify hashed assets must be immutable');

const expectedRewrites = ['/en', '/vi', '/de', '/es', '/fr', '/ja', '/ko', '/ru', '/th', '/zh'];
for (const source of expectedRewrites) {
  const firebaseRule = firebase.hosting.rewrites?.find((item) => item.source === source && item.destination === '/index.html');
  assert(Boolean(firebaseRule), `Firebase missing homepage language rewrite ${source}`);
  const escaped = source.replaceAll('/', '\\/');
  assert(new RegExp(`from\\s*=\\s*"${escaped}"[\\s\\S]*?to\\s*=\\s*"\\/index\\.html"[\\s\\S]*?status\\s*=\\s*200`).test(netlify), `Netlify missing homepage language rewrite ${source}`);
}

if (failures.length) {
  console.error(`Hosting parity failed (${failures.length}):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Hosting parity passed: shared build output, update redirects, 10 homepage language routes, and hashed-asset cache policy.');
console.log('Intentional difference: Netlify uses a final SPA fallback; Firebase relies on explicit rewrites and static file resolution.');
