(() => {
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
})();