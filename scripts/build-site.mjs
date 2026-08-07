import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const sourceRoot = path.join(root, 'src', 'site');
const contentRoot = path.join(root, 'src', 'content');
const templateRoot = path.join(root, 'src', 'templates');
const outputRoot = path.join(root, 'public');

const ALL_LANGS = ['en', 'vi', 'de', 'es', 'fr', 'ja', 'ko', 'ru', 'th', 'zh'];

const migrationAllowlist = JSON.parse(await fs.readFile(path.join(root, 'src', 'migration-allowlist.json'), 'utf8'));
const requiredSourceFiles = migrationAllowlist.required;

const sha = (buffer) => createHash('sha256').update(buffer).digest('hex');
const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const replaceTokens = (template, values) => template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => values[key] ?? '');

async function assertSourceAllowlist() {
  const missing = [];
  for (const relative of requiredSourceFiles) {
    try { await fs.access(path.join(sourceRoot, relative)); } catch { missing.push(relative); }
  }
  if (missing.length) throw new Error(`Migration allowlist is incomplete:\n- ${missing.join('\n- ')}`);
}

async function cleanOutput() {
  const resolved = path.resolve(outputRoot);
  if (path.dirname(resolved) !== path.resolve(root) || path.basename(resolved) !== 'public') {
    throw new Error(`Refusing to clean unexpected output path: ${resolved}`);
  }
  await fs.rm(resolved, { recursive: true, force: true });
  await fs.mkdir(resolved, { recursive: true });
}

async function copyTree(from, to) {
  await fs.mkdir(to, { recursive: true });
  const entries = (await fs.readdir(from, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const source = path.join(from, entry.name);
    const destination = path.join(to, entry.name);
    const relative = path.relative(sourceRoot, source).replaceAll('\\', '/');
    if (relative === 'css/site.css' || relative === 'js/site.js' || relative === 'sitemap.xml' || relative === 'sitemap-multilingual.xml' || relative.startsWith('sections/')) continue;
    if (entry.isDirectory()) await copyTree(source, destination);
    else if (relative === 'index.html') {
      let content = await fs.readFile(source, 'utf8');
      const sectionsDir = path.join(sourceRoot, 'sections');
      const sectionFiles = ['hero.html', 'about.html', 'strengths.html', 'experience.html', 'ventures.html', 'products.html', 'education.html', 'contact.html'];
      for (const sectionFile of sectionFiles) {
        const sectionPath = path.join(sectionsDir, sectionFile);
        try {
          const sectionHtml = await fs.readFile(sectionPath, 'utf8');
          const placeholder = `<!-- SECTION: ${sectionFile.replace('.html', '').toUpperCase()} -->`;
          content = content.replace(placeholder, sectionHtml);
        } catch (e) {
          // If section file doesn't exist, ignore
        }
      }
      await fs.writeFile(destination, content);
    }
    else await fs.copyFile(source, destination);
  }
}

async function renderHomePages() {
  const rootIndex = path.join(outputRoot, 'index.html');
  const baseHtml = await fs.readFile(rootIndex, 'utf8');
  for (const lang of ALL_LANGS) {
    let localized = baseHtml
      .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
      .replace(/<body data-page-type="home" data-page-lang="[^"]*">/, `<body data-page-type="home" data-page-lang="${lang}">`)
      .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="https://minhtriet.online/${lang}">`)
      .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="https://minhtriet.online/${lang}">`)
      .replace(/<script src="\/lang\/en\.js" data-lang-script><\/script>/, `<script src="/lang/${lang}.js" data-lang-script></script>`);
    const outPath = path.join(outputRoot, lang, 'index.html');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, localized);
  }
}

async function fingerprintAssets() {
  const css = await fs.readFile(path.join(sourceRoot, 'css', 'site.css'));
  const js = await fs.readFile(path.join(sourceRoot, 'js', 'site.js'));
  const cssName = `site.${sha(css).slice(0, 12)}.css`;
  const jsName = `site.${sha(js).slice(0, 12)}.js`;
  await fs.mkdir(path.join(outputRoot, 'assets'), { recursive: true });
  await fs.writeFile(path.join(outputRoot, 'assets', cssName), css);
  await fs.writeFile(path.join(outputRoot, 'assets', jsName), js);
  return { css: `/assets/${cssName}`, js: `/assets/${jsName}` };
}

function header(lang) {
  const vi = lang === 'vi';
  const options = [
    { value: 'en', label: 'English' },
    { value: 'vi', label: 'Tiếng Việt' },
    { value: 'de', label: 'Deutsch' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'ru', label: 'Русский' },
    { value: 'th', label: 'ไทย' },
    { value: 'zh', label: '中文' }
  ].map((opt) => `<option value="${opt.value}"${opt.value === lang ? ' selected' : ''}>${opt.label}</option>`).join('');

  return `<header class="site-header"><div class="wrap header-inner">
    <a class="brand" href="/${lang}/" aria-label="${vi ? 'Trang chủ Nguyễn Minh Triết' : 'Nguyen Minh Triet home'}"><img src="/images/logo/nmt-logo.png" alt="NMT" width="42" height="42"><span><small>minhtriet.online</small><strong>${vi ? 'Nguyễn Minh Triết' : 'Nguyen Minh Triet'}</strong></span></a>
    <nav class="desktop-nav" aria-label="${vi ? 'Điều hướng chính' : 'Primary navigation'}"><a href="/${lang}/#about">${vi ? 'Giới thiệu' : 'About'}</a><a href="/${lang}/#ventures">${vi ? 'Dự án trọng điểm' : 'Ventures'}</a><a href="/${lang}/#case-studies">Case Studies</a><a href="/${lang}/updates/">${vi ? 'Cập nhật' : 'Updates'}</a><a href="/${lang}/#contact">${vi ? 'Liên hệ' : 'Contact'}</a></nav>
    <label class="sr-only" for="language-select">Language</label><select class="language-select" id="language-select" data-language-select aria-label="Language">${options}</select>
    <button class="menu-button" type="button" aria-label="${vi ? 'Mở điều hướng' : 'Open navigation'}" aria-expanded="false" aria-controls="mobile-nav" data-menu-button><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
  </div><nav class="wrap mobile-nav" id="mobile-nav" aria-label="Mobile navigation" data-mobile-nav><a href="/${lang}/#about">${vi ? 'Giới thiệu' : 'About'}</a><a href="/${lang}/#ventures">${vi ? 'Dự án trọng điểm' : 'Ventures'}</a><a href="/${lang}/#case-studies">Case Studies</a><a href="/${lang}/updates/">${vi ? 'Cập nhật' : 'Updates'}</a><a href="/${lang}/#contact">${vi ? 'Liên hệ' : 'Contact'}</a></nav></header>`;
}

function footer(lang) {
  const vi = lang === 'vi';
  return `<footer class="site-footer"><div class="wrap footer-inner"><p>${vi ? 'Portfolio cá nhân của Nguyễn Minh Triết.' : 'Personal portfolio of Nguyen Minh Triet.'}</p><nav class="footer-links" aria-label="Footer navigation"><a href="/${lang}/">${vi ? 'Trang chủ' : 'Home'}</a><a href="/${lang}/updates/">${vi ? 'Cập nhật' : 'Updates'}</a><a href="https://www.linkedin.com/in/mtrietng/" target="_blank" rel="noopener noreferrer">LinkedIn</a></nav></div></footer>`;
}

async function loadUpdates() {
  const directory = path.join(contentRoot, 'updates');
  const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.json')).sort();
  const updates = [];
  for (const file of files) updates.push(JSON.parse(await fs.readFile(path.join(directory, file), 'utf8')));
  return updates.sort((a, b) => a.slug.localeCompare(b.slug));
}

function articleSchema(item, lang) {
  const vi = lang === 'vi';
  const content = item[lang] || (vi ? item.vi : item.en);
  const url = `https://minhtriet.online/${lang}/updates/${item.slug}/`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person', '@id': 'https://minhtriet.online/#person', name: 'Nguyen Minh Triet',
        url: 'https://minhtriet.online/', jobTitle: 'Founder and CEO at IVS JSC'
      },
      {
        '@type': 'Article', '@id': `${url}#article`, headline: content.title, description: content.description,
        image: `https://minhtriet.online${item.coverOg}`, inLanguage: lang,
        mainEntityOfPage: url, author: { '@id': 'https://minhtriet.online/#person' },
        about: { '@type': 'Thing', name: content.eyebrow.split(' · ')[0] }
      }
    ]
  };
  if (item.datePublished) schema['@graph'][1].datePublished = item.datePublished;
  if (item.dateModified) schema['@graph'][1].dateModified = item.dateModified;
  return JSON.stringify(schema).replaceAll('<', '\\u003c');
}

function collectionSchema(lang, updates) {
  const vi = lang === 'vi';
  const url = `https://minhtriet.online/${lang}/updates/`;
  return JSON.stringify({
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'Person', '@id': 'https://minhtriet.online/#person', name: 'Nguyen Minh Triet', url: 'https://minhtriet.online/' },
      { '@type': 'CollectionPage', '@id': `${url}#page`, url, name: vi ? 'Cập nhật' : 'Updates', about: { '@id': 'https://minhtriet.online/#person' },
        mainEntity: { '@type': 'ItemList', itemListElement: updates.map((item, index) => ({ '@type': 'ListItem', position: index + 1, url: `https://minhtriet.online/${lang}/updates/${item.slug}/`, name: (item[lang] || (vi ? item.vi : item.en)).title })) } }
    ]
  }).replaceAll('<', '\\u003c');
}

async function renderUpdates(assets, updates) {
  const indexTemplate = await fs.readFile(path.join(templateRoot, 'updates-index.html'), 'utf8');
  const articleTemplate = await fs.readFile(path.join(templateRoot, 'update-article.html'), 'utf8');
  for (const lang of ALL_LANGS) {
    const vi = lang === 'vi';
    const hasPublished = updates.some((item) => Boolean(item.datePublished));
    const cards = updates.map((item) => {
      const content = item[lang] || (vi ? item.vi : item.en);
      return `<article class="card update-card"><img src="${item.cover}" alt="${escapeHtml(content.title)}" width="1600" height="900" loading="lazy"><div class="update-card-body"><span class="draft-label">${item.datePublished ? escapeHtml(item.datePublished) : (vi ? 'Bản nháp để duyệt' : 'Draft for preview')}</span><h3>${escapeHtml(content.title)}</h3><p>${escapeHtml(content.description)}</p><a class="text-link" href="/${lang}/updates/${item.slug}/">${vi ? 'Đọc cập nhật →' : 'Read update →'}</a></div></article>`;
    }).join('');
    const indexValues = {
      LANG: lang, OG_LOCALE: vi ? 'vi_VN' : 'en_US', OG_ALT_LOCALE: vi ? 'en_US' : 'vi_VN',
      ROBOTS: hasPublished ? 'index,follow,max-image-preview:large' : 'noindex,follow,max-image-preview:large',
      TITLE: vi ? 'Cập nhật | Nguyễn Minh Triết' : 'Updates | Nguyen Minh Triet',
      DESCRIPTION: vi ? 'Các bài viết về chiến lược giáo dục, sản phẩm số và vận hành thực tế.' : 'Long-form notes on education strategy, digital products, and practical operations.',
      CANONICAL: `https://minhtriet.online/${lang}/updates/`,
      SCHEMA: collectionSchema(lang, updates), SITE_CSS: assets.css, SITE_JS: assets.js,
      SKIP: vi ? 'Chuyển đến nội dung chính' : 'Skip to content', HEADER: header(lang), FOOTER: footer(lang),
      EYEBROW: vi ? 'Ghi chép từ công việc đang thực hiện' : 'Notes from work in progress',
      HEADING: vi ? 'Cập nhật' : 'Updates',
      INTRO: vi ? 'Các bài viết ghi lại bối cảnh, quyết định và cách tiếp cận phía sau sản phẩm và dự án.' : 'Long-form notes documenting the context, decisions, and approaches behind products and ventures.',
      LIST_LABEL: vi ? 'Danh sách cập nhật' : 'Update list', CARDS: cards
    };
    const indexOutput = path.join(outputRoot, lang, 'updates', 'index.html');
    await fs.mkdir(path.dirname(indexOutput), { recursive: true });
    await fs.writeFile(indexOutput, replaceTokens(indexTemplate, indexValues));

    for (const item of updates) {
      const content = item[lang] || (vi ? item.vi : item.en);
      const enUrl = `https://minhtriet.online/en/updates/${item.slug}/`;
      const viUrl = `https://minhtriet.online/vi/updates/${item.slug}/`;
      const canonical = `https://minhtriet.online/${lang}/updates/${item.slug}/`;
      const articleBody = content.sections.map((section) => `<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</section>`).join('');
      const utm = new URL(item.ventureUrl);
      utm.searchParams.set('utm_source', 'minhtriet.online'); utm.searchParams.set('utm_medium', 'portfolio');
      utm.searchParams.set('utm_campaign', 'ivs_ecosystem'); utm.searchParams.set('utm_content', item.utmContent);
      const dateLabel = item.datePublished ? escapeHtml(item.datePublished) : (vi ? 'Bản nháp · Chưa có ngày công bố' : 'Draft · Publication date pending');
      const articleMeta = [item.datePublished ? `<meta property="article:published_time" content="${escapeHtml(item.datePublished)}">` : '', item.dateModified ? `<meta property="article:modified_time" content="${escapeHtml(item.dateModified)}">` : ''].filter(Boolean).join('\n  ');
      const values = {
        LANG: lang, SLUG: item.slug, ROBOTS: item.datePublished ? 'index,follow,max-image-preview:large' : 'noindex,follow,max-image-preview:large',
        DESCRIPTION: escapeHtml(content.description), CANONICAL: canonical, TITLE: escapeHtml(content.title),
        OG_IMAGE: `https://minhtriet.online${item.coverOg}`, OG_LOCALE: vi ? 'vi_VN' : 'en_US', OG_ALT_LOCALE: vi ? 'en_US' : 'vi_VN', ARTICLE_META: articleMeta,
        EN_URL: enUrl, VI_URL: viUrl, SITE_CSS: assets.css, SITE_JS: assets.js, SCHEMA: articleSchema(item, lang),
        SKIP: vi ? 'Chuyển đến nội dung chính' : 'Skip to content', HEADER: header(lang), FOOTER: footer(lang),
        HOME_LABEL: vi ? 'Trang chủ' : 'Home', UPDATES_LABEL: vi ? 'Cập nhật' : 'Updates', BREADCRUMB_CURRENT: escapeHtml(content.title),
        EYEBROW: escapeHtml(content.eyebrow), READING_TIME: escapeHtml(content.readingTime), DATE_LABEL: dateLabel,
        COVER: item.cover, COVER_ALT: escapeHtml(content.title), ARTICLE_BODY: articleBody,
        TAGS: item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join(''), VENTURE_URL: escapeHtml(utm.toString()), CTA: escapeHtml(content.cta),
        BACK_TO_UPDATES: vi ? 'Quay lại trang Cập nhật' : 'Back to Updates'
      };
      const output = path.join(outputRoot, lang, 'updates', item.slug, 'index.html');
      await fs.mkdir(path.dirname(output), { recursive: true });
      await fs.writeFile(output, replaceTokens(articleTemplate, values));
    }
  }
}

async function replaceAssetTokens(assets) {
  async function visit(directory) {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.name.endsWith('.html')) {
        const text = await fs.readFile(full, 'utf8');
        await fs.writeFile(full, replaceTokens(text, { SITE_CSS: assets.css, SITE_JS: assets.js }));
      }
    }
  }
  await visit(outputRoot);
}

async function writeSitemaps(updates) {
  const staticUrls = ALL_LANGS.map((lang) => [`/${lang}`, '1.0']).concat([['/cv-online.html', '0.8'], ['/ivs-aitool', '0.7']]);
  const published = updates.filter((item) => item.datePublished);
  const urls = [...staticUrls.map(([url, priority]) => ({ url, priority, lastmod: null }))];
  for (const item of published) for (const lang of ALL_LANGS) urls.push({ url: `/${lang}/updates/${item.slug}/`, priority: '0.8', lastmod: item.dateModified || item.datePublished });
  if (published.length) for (const lang of ALL_LANGS) urls.push({ url: `/${lang}/updates/`, priority: '0.9', lastmod: published.map((item) => item.dateModified || item.datePublished).sort().at(-1) });
  const body = urls.map((entry) => `  <url>\n    <loc>https://minhtriet.online${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}\n    <priority>${entry.priority}</priority>\n  </url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
  await fs.writeFile(path.join(outputRoot, 'sitemap.xml'), xml);
  await fs.writeFile(path.join(outputRoot, 'sitemap-multilingual.xml'), xml);
}

async function writeRedirects() {
  const redirects = [
    '/updates /en/updates/ 301',
    '/updates/ /en/updates/ 301',
    '/updates/:slug /en/updates/:slug/ 301',
    '/updates/:slug/ /en/updates/:slug/ 301',
    ...ALL_LANGS.map((lang) => `/${lang} /${lang}/ 301`)
  ].join('\n') + '\n';
  await fs.writeFile(path.join(outputRoot, '_redirects'), redirects);
}

async function writeManifest() {
  const records = [];
  async function visit(directory) {
    for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(full);
      else if (entry.name !== 'build-manifest.json') {
        const data = await fs.readFile(full);
        records.push({ path: path.relative(outputRoot, full).replaceAll('\\', '/'), bytes: data.length, sha256: sha(data) });
      }
    }
  }
  await visit(outputRoot);
  await fs.writeFile(path.join(outputRoot, 'build-manifest.json'), `${JSON.stringify({ version: 1, files: records }, null, 2)}\n`);
}

await assertSourceAllowlist();
await cleanOutput();
await copyTree(sourceRoot, outputRoot);
await renderHomePages();
await fs.cp(contentRoot, path.join(outputRoot, 'content'), { recursive: true });
const assets = await fingerprintAssets();

const updates = await loadUpdates();
await renderUpdates(assets, updates);
await replaceAssetTokens(assets);
await writeSitemaps(updates);
await writeRedirects();
await writeManifest();

const validation = spawnSync(process.execPath, [path.join(root, 'scripts', 'validate-site.mjs')], { stdio: 'inherit' });
if (validation.status !== 0) process.exit(validation.status || 1);
console.log(`Built ${updates.length} multilingual updates into ${path.relative(root, outputRoot)}.`);
