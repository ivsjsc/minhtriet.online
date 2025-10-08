const fs = require('fs');
const path = require('path');
const vm = require('vm');

const LANG_DIR = path.join(__dirname, 'lang');
const requiredKeys = [
  'outstanding_projects_eyebrow',
  'outstanding_projects_title',
  'outstanding_projects_description',
  'featured_project1_title',
  'featured_project1_desc',
  'featured_project2_title',
  'featured_project2_desc',
  'featured_project3_title',
  'featured_project3_desc',
  'outstanding_projects_cta',
  'lightbox_title'
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Syntax check by executing in a vm with a fake window object
  try {
    vm.runInNewContext(content, { window: {} }, { filename: filePath });
  } catch (err) {
    return { ok: false, error: err.stack || err.toString() };
  }

  // Key presence check (simple substring search)
  const missing = requiredKeys.filter(k => !content.includes(k));
  if (missing.length) {
    return { ok: false, error: 'Missing keys: ' + missing.join(', ') };
  }

  return { ok: true };
}

const files = fs.readdirSync(LANG_DIR).filter(f => f.endsWith('.js'));
let overallOk = true;
const results = {};
for (const f of files) {
  const full = path.join(LANG_DIR, f);
  const res = checkFile(full);
  results[f] = res;
  if (!res.ok) overallOk = false;
}

console.log(JSON.stringify({ overallOk, results }, null, 2));
process.exit(overallOk ? 0 : 2);
