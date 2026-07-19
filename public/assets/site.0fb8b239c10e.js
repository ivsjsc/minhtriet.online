(() => {
  const supported = ['en', 'vi', 'de', 'es', 'fr', 'ja', 'ko', 'ru', 'th', 'zh'];
  const htmlLangMap = { zh: 'zh-Hans' };
  const languageSelect = document.querySelector('[data-language-select]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');

  const firstSegment = () => location.pathname.split('/').filter(Boolean)[0] || 'en';
  const currentLang = supported.includes(firstSegment())
    ? firstSegment()
    : (supported.includes(document.body.dataset.pageLang) ? document.body.dataset.pageLang : 'en');

  const targetForLanguage = (lang) => {
    const type = document.body.dataset.pageType;
    const slug = document.body.dataset.pageSlug;
    if (type === 'update-article') {
      if (lang === 'vi') return `/vi/updates/${slug}/`;
      return `/en/updates/${slug}/`;
    }
    if (type === 'updates-index') return `/${lang === 'vi' ? 'vi' : 'en'}/updates/`;
    return `/${lang}/`;
  };

  const loadDictionary = (lang) => {
    if (window[`translations_${lang}`]) return Promise.resolve(window[`translations_${lang}`]);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `/lang/${lang}.js`;
      script.onload = () => resolve(window[`translations_${lang}`] || {});
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  const applyHomeLanguage = async (lang) => {
    if (document.body.dataset.pageType !== 'home') return;
    const english = await loadDictionary('en');
    const selected = lang === 'en' ? english : await loadDictionary(lang).catch(() => ({}));
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      const value = selected[key] ?? english[key];
      if (typeof value === 'string') element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
      const key = element.dataset.i18nAlt;
      const value = selected[key] ?? english[key];
      if (typeof value === 'string') element.setAttribute('alt', value);
    });
    const title = selected.page_title ?? english.page_title;
    const description = selected.meta_description ?? english.meta_description;
    if (title) document.title = title;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    }
    const localizedUrl = `https://minhtriet.online/${lang}`;
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', localizedUrl);
    document.querySelector('meta[property="og:url"]')?.setAttribute('content', localizedUrl);
    const articleLang = lang === 'vi' ? 'vi' : 'en';
    document.querySelectorAll('[data-localized-update]').forEach((link) => {
      link.href = `/${articleLang}/updates/${link.dataset.localizedUpdate}/`;
    });
    document.querySelectorAll('[data-localized-updates-index]').forEach((link) => {
      link.href = `/${articleLang}/updates/`;
    });
  };

  if (languageSelect) {
    languageSelect.value = currentLang;
    languageSelect.addEventListener('change', (event) => {
      const next = event.target.value;
      try { localStorage.setItem('site_lang', next); } catch (_) {}
      location.assign(targetForLanguage(next));
    });
  }

  if (menuButton && mobileNav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('is-open', !open);
      document.body.classList.toggle('menu-open', !open);
    });
    mobileNav.addEventListener('click', (event) => {
      if (!event.target.closest('a')) return;
      menuButton.setAttribute('aria-expanded', 'false');
      mobileNav.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    });
  }

  document.documentElement.lang = htmlLangMap[currentLang] || currentLang;
  applyHomeLanguage(currentLang).catch(() => {});

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();
