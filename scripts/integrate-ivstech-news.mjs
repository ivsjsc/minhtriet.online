import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outputRoot = path.join(root, 'public');
const sourceOrigin = 'https://ivstech.store';
const maxPosts = 8;

const fallbackPosts = [
  {
    slug: 'ivs-jsc-gioi-thieu-tiktok-commerce-2027-xay-tiktok-shop-thanh-he-thong-kinh-doanh-co-the-van-hanh-va-mo-rong',
    date: '2026-08-07',
    image: `${sourceOrigin}/images/pages/tiktok-commerce-2027.png`,
    category: {
      vi: 'TikTok Commerce & Thương mại điện tử',
      en: 'TikTok Commerce & E-commerce'
    },
    readTime: { vi: '8 phút đọc', en: '8 min read' },
    title: {
      vi: 'IVS JSC giới thiệu TikTok Commerce 2027: Xây TikTok Shop thành hệ thống kinh doanh có thể vận hành và mở rộng',
      en: 'IVS JSC Introduces TikTok Commerce 2027: Building TikTok Shop into an Operable & Scalable Business System'
    },
    excerpt: {
      vi: 'Xây TikTok Shop không chỉ là đăng video và chạy quảng cáo. Doanh nghiệp cần kiến trúc sở hữu rõ ràng, P&L theo SKU, bảo mật tài khoản, nội dung, Affiliate và lộ trình kiểm chứng trước khi mở rộng.',
      en: 'Building a TikTok Shop is not just about posting videos and running ads. Businesses need clear asset ownership, SKU-level P&L, account security, content, affiliate operations and a validated roadmap before scaling.'
    }
  },
  {
    slug: 'hoc-it-khong-chi-de-biet-cong-nghe-hay-hoc-de-lam-duoc-viec-thuc-te',
    date: '2026-08-02',
    image: `${sourceOrigin}/images/pages/it-learners.png`,
    category: { vi: 'Đào tạo IT / IVS Academy', en: 'Technology Training' },
    readTime: { vi: '3 phút đọc', en: '3 min read' },
    title: {
      vi: 'Học IT không chỉ để biết công nghệ – Hãy học để làm được việc thực tế',
      en: 'Learning IT is Not Just About Knowing Tech – Learn to Do Real-World Work'
    },
    excerpt: {
      vi: 'IVS Academy triển khai chương trình đào tạo IT thực chiến với lộ trình từ nền tảng đến chuyên sâu, học qua dự án và định hướng rõ đầu ra nghề nghiệp.',
      en: 'IVS Academy delivers practical IT training with a roadmap from foundations to advanced skills, project-based learning and clear career outcomes.'
    }
  },
  {
    slug: 'website-khong-tu-van-hanh-tot-mai-mai-dich-vu-cham-soc-website',
    date: '2026-08-02',
    image: `${sourceOrigin}/images/pages/website-care.png`,
    category: { vi: 'Website & Chuyển đổi số', en: 'Website & Digital Transformation' },
    readTime: { vi: '7 phút đọc', en: '7 min read' },
    title: {
      vi: 'Website không tự vận hành tốt mãi mãi: Vì sao doanh nghiệp cần dịch vụ chăm sóc website chuyên nghiệp?',
      en: 'Websites Do Not Stay Healthy on Their Own: Why Businesses Need Professional Website Care'
    },
    excerpt: {
      vi: 'Website chậm, lỗi hiển thị, nội dung cũ, bảo mật yếu và không được sao lưu có thể làm doanh nghiệp mất khách hàng mỗi ngày.',
      en: 'Slow performance, broken layouts, outdated content, weak security and missing backups can cost businesses customers every day.'
    }
  }
];

function withTimeout(ms = 9000) {
  return AbortSignal.timeout(ms);
}

async function fetchText(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: withTimeout(),
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'Mozilla/5.0 (compatible; minhtriet.online build sync; +https://minhtriet.online/)'
    }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

function htmlDecode(value = '') {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function localized(value, lang) {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value[lang] || value.en || value.vi || '';
}

function absoluteImage(value) {
  if (!value) return '';
  try { return new URL(value, sourceOrigin).toString(); } catch { return ''; }
}

function decodeFirestoreValue(value) {
  if (!value || typeof value !== 'object') return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, child]) => [key, decodeFirestoreValue(child)])
    );
  }
  return null;
}

function normalizePost(raw) {
  const slug = String(raw.slug || '').trim();
  if (!slug) return null;
  const date = String(raw.date || '').trim();
  const image = absoluteImage(raw.image);
  return {
    slug,
    date,
    image,
    category: raw.category || { vi: 'IVS TECH', en: 'IVS TECH' },
    readTime: raw.readTime || { vi: '', en: '' },
    title: raw.title || { vi: '', en: '' },
    excerpt: raw.excerpt || { vi: '', en: '' }
  };
}

async function discoverFirebaseConfig() {
  const html = await fetchText(`${sourceOrigin}/tin-tuc/`);
  const scriptUrls = [];
  for (const match of html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)) {
    try {
      const url = new URL(match[1], sourceOrigin).toString();
      if (url.startsWith(sourceOrigin)) scriptUrls.push(url);
    } catch {}
  }

  for (const scriptUrl of [...new Set(scriptUrls)]) {
    let js;
    try { js = await fetchText(scriptUrl); } catch { continue; }
    const apiKey = js.match(/AIza[0-9A-Za-z_-]{20,}/)?.[0] || '';
    let projectId = js.match(/projectId\s*:\s*["']([^"']+)["']/)?.[1] || '';
    if (!projectId) projectId = js.match(/([a-z0-9-]+)\.firebaseapp\.com/i)?.[1] || '';
    if (apiKey && projectId) return { apiKey, projectId };
  }
  throw new Error('Firebase public configuration was not discoverable from the IVS TECH production bundle.');
}

async function fetchPublishedPostsFromFirestore() {
  const { apiKey, projectId } = await discoverFirebaseConfig();
  const endpoint = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    signal: withTimeout(),
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'blogPosts' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'status' },
            op: 'EQUAL',
            value: { stringValue: 'published' }
          }
        },
        limit: 100
      }
    })
  });
  if (!response.ok) throw new Error(`Firestore feed returned ${response.status}.`);
  const payload = await response.json();
  const posts = payload
    .map((row) => row.document?.fields)
    .filter(Boolean)
    .map((fields) => Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, decodeFirestoreValue(value)])))
    .filter((post) => post.status === 'published')
    .map(normalizePost)
    .filter(Boolean)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, maxPosts);
  if (!posts.length) throw new Error('Firestore returned no published posts.');
  return posts;
}

function parseMetaTags(html) {
  const result = {};
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = {};
    for (const attr of tag[0].matchAll(/([:\w-]+)\s*=\s*["']([^"']*)["']/g)) attrs[attr[1].toLowerCase()] = htmlDecode(attr[2]);
    const key = attrs.property || attrs.name;
    if (key && attrs.content) result[key.toLowerCase()] = attrs.content;
  }
  return result;
}

async function fetchPublishedPostsFromHtml() {
  const indexHtml = await fetchText(`${sourceOrigin}/tin-tuc/`);
  const slugs = [];
  for (const match of indexHtml.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    let url;
    try { url = new URL(match[1], sourceOrigin); } catch { continue; }
    const slugMatch = url.pathname.match(/^\/(?:tin-tuc|news)\/([^/]+)\/?$/);
    if (slugMatch && !slugs.includes(slugMatch[1])) slugs.push(slugMatch[1]);
    if (slugs.length >= maxPosts) break;
  }
  if (!slugs.length) throw new Error('No article links were found in the IVS TECH news index.');

  const posts = [];
  for (const slug of slugs) {
    try {
      const [viHtml, enHtml] = await Promise.all([
        fetchText(`${sourceOrigin}/tin-tuc/${slug}`),
        fetchText(`${sourceOrigin}/news/${slug}`).catch(() => '')
      ]);
      const viMeta = parseMetaTags(viHtml);
      const enMeta = enHtml ? parseMetaTags(enHtml) : {};
      const viTitle = (viMeta['og:title'] || '').replace(/\s*[-|]\s*IVS TECH\s*$/i, '').trim();
      const enTitle = (enMeta['og:title'] || viTitle).replace(/\s*[-|]\s*IVS TECH\s*$/i, '').trim();
      if (!viTitle) continue;
      posts.push(normalizePost({
        slug,
        date: '',
        image: viMeta['og:image'] || enMeta['og:image'] || '',
        category: { vi: 'IVS TECH', en: 'IVS TECH' },
        readTime: { vi: '', en: '' },
        title: { vi: viTitle, en: enTitle },
        excerpt: {
          vi: viMeta.description || viMeta['og:description'] || '',
          en: enMeta.description || enMeta['og:description'] || viMeta.description || viMeta['og:description'] || ''
        }
      }));
    } catch {}
  }
  if (!posts.length) throw new Error('Article metadata could not be extracted from IVS TECH.');
  return posts;
}

function toFeedData(posts, sourceMode) {
  const make = (lang) => posts.map((post) => ({
    slug: post.slug,
    title: localized(post.title, lang),
    excerpt: localized(post.excerpt, lang),
    category: localized(post.category, lang) || 'IVS TECH',
    date: post.date || '',
    readTime: localized(post.readTime, lang),
    image: post.image || '',
    url: `${sourceOrigin}/${lang === 'vi' ? 'tin-tuc' : 'news'}/${encodeURIComponent(post.slug)}`
  }));
  return {
    source: sourceOrigin,
    sourceMode,
    generatedAt: new Date().toISOString(),
    vi: make('vi'),
    en: make('en')
  };
}

const feedCss = `
.ivs-tech-feed-section{position:relative;overflow:hidden;background:linear-gradient(180deg,rgba(14,116,144,.045),rgba(255,255,255,0));border-block:1px solid var(--line)}
.ivs-tech-feed-section::before{content:"";position:absolute;inset:0 auto auto 0;width:100%;height:3px;background:linear-gradient(90deg,var(--accent),transparent 72%);opacity:.8}
.ivs-feed-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px}
.ivs-feed-card{display:flex;min-width:0;flex-direction:column;overflow:hidden;border:1px solid var(--line);border-radius:var(--radius);background:#fff;color:inherit;text-decoration:none;box-shadow:0 12px 34px rgba(15,23,42,.055);transition:transform .2s ease,border-color .2s ease,box-shadow .2s ease}
.ivs-feed-card:hover{transform:translateY(-3px);border-color:rgba(14,116,144,.32);box-shadow:0 18px 42px rgba(15,23,42,.09)}
.ivs-feed-media{aspect-ratio:16/9;overflow:hidden;background:linear-gradient(135deg,#0f172a,#164e63)}
.ivs-feed-media img{width:100%;height:100%;object-fit:cover;transition:transform .35s ease}
.ivs-feed-card:hover .ivs-feed-media img{transform:scale(1.025)}
.ivs-feed-media-fallback{display:grid;height:100%;place-items:center;color:#fff;font-size:.8rem;font-weight:800;letter-spacing:.12em}
.ivs-feed-body{display:flex;flex:1;flex-direction:column;padding:20px}
.ivs-feed-meta{display:flex;flex-wrap:wrap;align-items:center;gap:7px;color:var(--soft);font-size:.72rem;font-weight:700}
.ivs-feed-source{color:var(--accent);font-weight:850;letter-spacing:.06em;text-transform:uppercase}
.ivs-feed-title{margin:12px 0 0;font-family:Manrope,system-ui,sans-serif;font-size:1.06rem;line-height:1.35;letter-spacing:-.02em}
.ivs-feed-excerpt{display:-webkit-box;margin-top:10px;overflow:hidden;color:var(--muted);font-size:.88rem;line-height:1.6;-webkit-box-orient:vertical;-webkit-line-clamp:3}
.ivs-feed-read{margin-top:auto;padding-top:16px;color:var(--accent);font-size:.82rem;font-weight:800}
.ivs-feed-actions{display:flex;justify-content:flex-end;margin-top:24px}
.ivs-feed-loading,.ivs-feed-empty{grid-column:1/-1;padding:28px;border:1px dashed var(--line);border-radius:var(--radius);color:var(--muted);text-align:center;background:rgba(255,255,255,.68)}
.portfolio-notes{background:var(--ivory)}
.portfolio-notes .draft-label{display:none}
.portfolio-notes .section-heading{margin-bottom:30px}
body[data-page-type="updates-index"] .page-hero{padding-bottom:clamp(30px,4vw,48px)}
body[data-page-type="updates-index"] .ivs-tech-feed-section{padding-top:clamp(44px,6vw,72px);padding-bottom:clamp(48px,6vw,76px)}
body[data-page-type="updates-index"] .portfolio-notes{padding-top:clamp(48px,6vw,76px)}
@media(max-width:900px){.ivs-feed-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.ivs-feed-grid{grid-template-columns:1fr}.ivs-feed-body{padding:18px}.ivs-feed-actions{justify-content:stretch}.ivs-feed-actions .btn{width:100%}}
`;

const feedJs = `(() => {
  const copy = {
    en: {
      kicker: 'IVS TECH Insights', title: 'Latest technology & operating insights.',
      intro: 'Selected articles from IVS TECH on digital systems, AI, SaaS, infrastructure, and practical business operations.',
      loading: 'Loading latest IVS TECH articles…', empty: 'Latest articles are available directly on IVS TECH.',
      viewAll: 'View all IVS TECH news →', read: 'Read on IVS TECH →'
    },
    vi: {
      kicker: 'Góc nhìn IVS TECH', title: 'Bài viết công nghệ & vận hành mới nhất.',
      intro: 'Các bài viết mới từ IVS TECH về hệ thống số, AI, SaaS, hạ tầng và vận hành doanh nghiệp thực tế.',
      loading: 'Đang tải bài viết mới từ IVS TECH…', empty: 'Các bài viết mới nhất hiện có trên IVS TECH.',
      viewAll: 'Xem tất cả tin IVS TECH →', read: 'Đọc trên IVS TECH →'
    }
  };
  let data = null;
  const lang = () => document.documentElement.lang.toLowerCase().startsWith('vi') ? 'vi' : 'en';
  const safe = (value) => String(value || '');
  const allowedUrl = (value) => { try { const u = new URL(value); return u.origin === 'https://ivstech.store' ? u.toString() : ''; } catch { return ''; } };
  const updateCopy = () => {
    const dict = copy[lang()];
    document.querySelectorAll('[data-ivs-copy]').forEach((node) => { const key = node.getAttribute('data-ivs-copy'); if (dict[key]) node.textContent = dict[key]; });
    document.querySelectorAll('[data-ivs-view-all]').forEach((link) => { link.href = lang() === 'vi' ? 'https://ivstech.store/tin-tuc/' : 'https://ivstech.store/news/'; });
  };
  const render = () => {
    updateCopy();
    if (!data) return;
    const current = lang();
    const posts = Array.isArray(data[current]) && data[current].length ? data[current] : (data.en || []);
    document.querySelectorAll('[data-ivs-tech-feed]').forEach((container) => {
      const limit = Math.max(1, Math.min(8, Number(container.dataset.limit || 3)));
      container.textContent = '';
      if (!posts.length) {
        const empty = document.createElement('div'); empty.className = 'ivs-feed-empty'; empty.textContent = copy[current].empty; container.append(empty); return;
      }
      posts.slice(0, limit).forEach((post) => {
        const href = allowedUrl(post.url); if (!href) return;
        const card = document.createElement('a'); card.className = 'ivs-feed-card'; card.href = href; card.target = '_blank'; card.rel = 'noopener noreferrer';
        const media = document.createElement('div'); media.className = 'ivs-feed-media';
        const imageUrl = allowedUrl(post.image);
        if (imageUrl) { const img = document.createElement('img'); img.src = imageUrl; img.alt = safe(post.title); img.loading = 'lazy'; img.decoding = 'async'; media.append(img); }
        else { const fallback = document.createElement('div'); fallback.className = 'ivs-feed-media-fallback'; fallback.textContent = 'IVS TECH'; media.append(fallback); }
        const body = document.createElement('div'); body.className = 'ivs-feed-body';
        const meta = document.createElement('div'); meta.className = 'ivs-feed-meta';
        const source = document.createElement('span'); source.className = 'ivs-feed-source'; source.textContent = safe(post.category || 'IVS TECH'); meta.append(source);
        [post.date, post.readTime].filter(Boolean).forEach((value) => { const sep = document.createElement('span'); sep.textContent = '•'; const item = document.createElement('span'); item.textContent = safe(value); meta.append(sep, item); });
        const title = document.createElement('h3'); title.className = 'ivs-feed-title'; title.textContent = safe(post.title);
        const excerpt = document.createElement('p'); excerpt.className = 'ivs-feed-excerpt'; excerpt.textContent = safe(post.excerpt);
        const read = document.createElement('span'); read.className = 'ivs-feed-read'; read.textContent = copy[current].read;
        body.append(meta, title); if (post.excerpt) body.append(excerpt); body.append(read); card.append(media, body); container.append(card);
      });
    });
  };
  fetch('/data/ivstech-news.json', { cache: 'no-cache' }).then((response) => response.ok ? response.json() : Promise.reject(new Error('feed unavailable'))).then((payload) => { data = payload; render(); }).catch(() => { data = { en: [], vi: [] }; render(); });
  const observer = new MutationObserver(() => render()); observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  updateCopy();
})();`;

function homeFeedSection() {
  return `<section class="section ivs-tech-feed-section" id="updates" aria-labelledby="updates-title">
      <div class="wrap">
        <div class="section-heading ivs-feed-heading"><div><p class="kicker" data-ivs-copy="kicker">IVS TECH Insights</p><h2 id="updates-title" data-ivs-copy="title">Latest technology &amp; operating insights.</h2></div><p class="section-intro" data-ivs-copy="intro">Selected articles from IVS TECH on digital systems, AI, SaaS, infrastructure, and practical business operations.</p></div>
        <div class="ivs-feed-grid" data-ivs-tech-feed data-limit="3" aria-live="polite"><div class="ivs-feed-loading" data-ivs-copy="loading">Loading latest IVS TECH articles…</div></div>
        <div class="ivs-feed-actions"><a class="btn btn-secondary" href="https://ivstech.store/news/" target="_blank" rel="noopener noreferrer" data-ivs-view-all data-ivs-copy="viewAll">View all IVS TECH news →</a></div>
      </div>
    </section>`;
}

function pageFeedSection(lang) {
  const vi = lang === 'vi';
  return `<section class="section ivs-tech-feed-section" aria-labelledby="ivs-tech-latest-title">
      <div class="wrap">
        <div class="section-heading"><div><p class="kicker">${vi ? 'Mới nhất từ IVS TECH' : 'Latest from IVS TECH'}</p><h2 id="ivs-tech-latest-title">${vi ? 'Công nghệ, sản phẩm và vận hành thực tế.' : 'Technology, products, and real-world operations.'}</h2></div><p class="section-intro">${vi ? 'Nguồn bài viết được đồng bộ từ IVS TECH để portfolio luôn phản ánh các chủ đề công nghệ đang được triển khai trong hệ sinh thái.' : 'Articles are synchronized from IVS TECH so the portfolio stays connected to the technology work being published across the ecosystem.'}</p></div>
        <div class="ivs-feed-grid" data-ivs-tech-feed data-limit="6" aria-live="polite"><div class="ivs-feed-loading" data-ivs-copy="loading">${vi ? 'Đang tải bài viết mới từ IVS TECH…' : 'Loading latest IVS TECH articles…'}</div></div>
        <div class="ivs-feed-actions"><a class="btn btn-secondary" href="${vi ? 'https://ivstech.store/tin-tuc/' : 'https://ivstech.store/news/'}" target="_blank" rel="noopener noreferrer" data-ivs-view-all data-ivs-copy="viewAll">${vi ? 'Xem tất cả tin IVS TECH →' : 'View all IVS TECH news →'}</a></div>
      </div>
    </section>`;
}

function injectAssets(html) {
  if (!html.includes('/integrations/ivs-tech-feed.css')) html = html.replace('</head>', '  <link rel="stylesheet" href="/integrations/ivs-tech-feed.css">\n</head>');
  if (!html.includes('/integrations/ivs-tech-feed.js')) html = html.replace('</body>', '  <script src="/integrations/ivs-tech-feed.js" defer></script>\n</body>');
  return html;
}

async function enhanceHome() {
  const file = path.join(outputRoot, 'index.html');
  let html = await fs.readFile(file, 'utf8');
  const updateSection = /<section class="section" id="updates"[\s\S]*?<\/section>/;
  if (!updateSection.test(html)) throw new Error('Home Updates section signature changed; integration aborted instead of applying an unsafe replacement.');
  html = html.replace(updateSection, homeFeedSection());
  html = injectAssets(html);
  await fs.writeFile(file, html);
}

async function enhanceUpdatesIndex(lang) {
  const file = path.join(outputRoot, lang, 'updates', 'index.html');
  let html = await fs.readFile(file, 'utf8');
  const hero = /(<section class="page-hero">[\s\S]*?<\/section>)/;
  if (!hero.test(html)) throw new Error(`${lang} updates hero signature changed.`);
  html = html.replace(hero, `$1\n    ${pageFeedSection(lang)}`);
  html = html.replace('<section class="section section-plain" aria-labelledby="updates-list-title">', '<section class="section section-plain portfolio-notes" aria-labelledby="updates-list-title">');
  const heading = lang === 'vi'
    ? '<div class="section-heading"><div><p class="kicker">Ghi chép portfolio</p><h2 id="updates-list-title">Case notes chọn lọc</h2></div><p class="section-intro">Các ghi chép dài hơn về bối cảnh, quyết định kiến trúc và cách tiếp cận phía sau một số sản phẩm và dự án.</p></div>'
    : '<div class="section-heading"><div><p class="kicker">Portfolio Notes</p><h2 id="updates-list-title">Selected case notes</h2></div><p class="section-intro">Longer notes on context, architecture decisions, and the approaches behind selected products and ventures.</p></div>';
  html = html.replace(/<h2 class="sr-only" id="updates-list-title">[^<]*<\/h2>/, heading);
  if (lang === 'vi') {
    html = html
      .replace('Ghi chép từ công việc đang thực hiện', 'Góc nhìn công nghệ &amp; hệ sinh thái')
      .replace('<h1>Cập nhật</h1>', '<h1>Cập nhật &amp; Góc nhìn</h1>')
      .replace('Các bài viết ghi lại bối cảnh, quyết định và cách tiếp cận phía sau sản phẩm và dự án.', 'Bài viết mới từ IVS TECH cùng các ghi chép chọn lọc về sản phẩm, dự án và hệ thống vận hành tôi đang tham gia xây dựng.');
  } else {
    html = html
      .replace('Notes from work in progress', 'Technology &amp; venture insights')
      .replace('<h1>Updates</h1>', '<h1>Updates &amp; Insights</h1>')
      .replace('Long-form notes documenting the context, decisions, and approaches behind products and ventures.', 'Latest IVS TECH articles, alongside selected notes on the products, ventures, and operating systems I help shape.');
  }
  html = html.replace('content="noindex,follow,max-image-preview:large"', 'content="index,follow,max-image-preview:large"');
  html = injectAssets(html);
  await fs.writeFile(file, html);
}

async function writeIntegrationAssets() {
  const dir = path.join(outputRoot, 'integrations');
  await fs.mkdir(dir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(dir, 'ivs-tech-feed.css'), feedCss.trimStart()),
    fs.writeFile(path.join(dir, 'ivs-tech-feed.js'), feedJs)
  ]);
}

async function main() {
  let posts = fallbackPosts.map(normalizePost).filter(Boolean);
  let sourceMode = 'fallback';
  try {
    posts = await fetchPublishedPostsFromFirestore();
    sourceMode = 'firestore-public-read';
    console.log(`IVS TECH feed: synchronized ${posts.length} published CMS articles from Firestore.`);
  } catch (firestoreError) {
    console.warn(`IVS TECH Firestore sync unavailable: ${firestoreError.message}`);
    try {
      posts = await fetchPublishedPostsFromHtml();
      sourceMode = 'public-html';
      console.log(`IVS TECH feed: synchronized ${posts.length} articles from public HTML metadata.`);
    } catch (htmlError) {
      console.warn(`IVS TECH HTML sync unavailable: ${htmlError.message}`);
      console.warn('IVS TECH feed: using verified repository fallback articles so the portfolio build remains deterministic.');
    }
  }

  const dataDir = path.join(outputRoot, 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(path.join(dataDir, 'ivstech-news.json'), JSON.stringify(toFeedData(posts, sourceMode), null, 2));
  await writeIntegrationAssets();
  await enhanceHome();
  await enhanceUpdatesIndex('en');
  await enhanceUpdatesIndex('vi');
}

await main();
