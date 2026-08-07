(() => {
  const supported = ['en', 'vi', 'de', 'es', 'fr', 'ja', 'ko', 'ru', 'th', 'zh'];
  const htmlLangMap = { zh: 'zh-Hans' };
  const languageSelect = document.querySelector('[data-language-select]');
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileNav = document.querySelector('[data-mobile-nav]');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const contactFab = document.getElementById('contactFab');
  const fabActions = contactFab?.closest('.fab-actions');
  if (contactFab && fabActions) {
    contactFab.addEventListener('click', () => {
      const open = fabActions.classList.toggle('is-open');
      contactFab.setAttribute('aria-expanded', String(open));
      contactFab.setAttribute('aria-label', open ? 'Close social links' : 'Open social links');
      contactFab.setAttribute('title', open ? 'Close social links' : 'Open social links');
    });
    fabActions.querySelectorAll('.fab-social-link').forEach((link) => link.addEventListener('click', () => {
      fabActions.classList.remove('is-open');
      contactFab.setAttribute('aria-expanded', 'false');
    }));
  }
  if (scrollTopBtn) {
    const updateScrollTop = () => scrollTopBtn.classList.toggle('is-visible', window.scrollY > 300);
    window.addEventListener('scroll', updateScrollTop, { passive: true });
    updateScrollTop();
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const firstSegment = () => location.pathname.split('/').filter(Boolean)[0] || 'en';
  const currentLang = supported.includes(firstSegment())
    ? firstSegment()
    : (supported.includes(document.body.dataset.pageLang) ? document.body.dataset.pageLang : 'en');

  const targetForLanguage = (lang) => {
    const type = document.body.dataset.pageType;
    const slug = document.body.dataset.pageSlug;
    if (type === 'update-article') {
      return `/${lang}/updates/${slug}/`;
    }
    if (type === 'updates-index') return `/${lang}/updates/`;
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
      const englishOnly = lang !== 'en' && lang !== 'vi' && element.closest('[data-en-vi-content]');
      const value = englishOnly ? english[key] : (selected[key] ?? english[key]);
      if (typeof value === 'string') element.textContent = value;
    });
    document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
      const key = element.dataset.i18nAlt;
      const englishOnly = lang !== 'en' && lang !== 'vi' && element.closest('[data-en-vi-content]');
      const value = englishOnly ? english[key] : (selected[key] ?? english[key]);
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
    document.querySelectorAll('[data-localized-update]').forEach((link) => {
      link.href = `/${lang}/updates/${link.dataset.localizedUpdate}/`;
    });
    document.querySelectorAll('[data-localized-updates-index]').forEach((link) => {
      link.href = `/${lang}/updates/`;
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

  // CV Dropdown Interactive Logic
  document.querySelectorAll('.cv-dropdown').forEach((dropdown) => {
    const btn = dropdown.querySelector('.btn-cv-dropdown');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('is-open');
      document.querySelectorAll('.cv-dropdown.is-open').forEach((other) => {
        if (other !== dropdown) {
          other.classList.remove('is-open');
          other.querySelector('.btn-cv-dropdown')?.setAttribute('aria-expanded', 'false');
        }
      });
      dropdown.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.cv-dropdown')) {
      document.querySelectorAll('.cv-dropdown.is-open').forEach((dropdown) => {
        dropdown.classList.remove('is-open');
        dropdown.querySelector('.btn-cv-dropdown')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.cv-dropdown.is-open').forEach((dropdown) => {
        dropdown.classList.remove('is-open');
        dropdown.querySelector('.btn-cv-dropdown')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  // Experience timeline accordion logic
  const initTimelineAccordion = () => {
    const cards = document.querySelectorAll('[data-exp-card]');
    const toggleAllBtn = document.getElementById('toggleAllExpBtn');

    if (!cards.length) return;

    const getLang = () => document.documentElement.lang || currentLang || 'vi';

    const updateLabel = (element, key) => {
      if (!element) return;
      element.setAttribute('data-i18n', key);
      const lang = getLang() === 'vi' ? 'vi' : 'en';
      const dict = (lang === 'vi' ? window.translations_vi : window.translations_en) || window[`translations_${currentLang}`] || {};
      const fallbackText = {
        exp_expand: lang === 'vi' ? 'Mở rộng' : 'Expand',
        exp_collapse: lang === 'vi' ? 'Thu gọn' : 'Collapse',
        exp_expand_all: lang === 'vi' ? 'Mở rộng tất cả' : 'Expand all',
        exp_collapse_all: lang === 'vi' ? 'Thu gọn tất cả' : 'Collapse all'
      };
      element.textContent = dict[key] || fallbackText[key] || '';
    };

    const toggleCard = (card, forceState) => {
      const header = card.querySelector('.timeline-card-header');
      const toggleBtn = card.querySelector('.btn-exp-toggle');
      const details = card.querySelector('.timeline-details');
      const labelSpan = card.querySelector('.exp-toggle-label');
      
      const isExpanded = forceState !== undefined ? forceState : !card.classList.contains('is-expanded');
      
      card.classList.toggle('is-expanded', isExpanded);
      if (header) header.setAttribute('aria-expanded', String(isExpanded));
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', String(isExpanded));
      if (details) details.setAttribute('aria-hidden', String(!isExpanded));

      updateLabel(labelSpan, isExpanded ? 'exp_collapse' : 'exp_expand');
      updateToggleAllState();
    };

    const updateToggleAllState = () => {
      if (!toggleAllBtn) return;
      const allExpanded = Array.from(cards).every(c => c.classList.contains('is-expanded'));
      toggleAllBtn.setAttribute('aria-expanded', String(allExpanded));
      const labelSpan = toggleAllBtn.querySelector('.toggle-all-text');
      updateLabel(labelSpan, allExpanded ? 'exp_collapse_all' : 'exp_expand_all');
    };

    cards.forEach(card => {
      const header = card.querySelector('.timeline-card-header');
      if (header) {
        header.addEventListener('click', (e) => {
          toggleCard(card);
        });
        header.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleCard(card);
          }
        });
      }
    });

    if (toggleAllBtn) {
      toggleAllBtn.addEventListener('click', () => {
        const allExpanded = Array.from(cards).every(c => c.classList.contains('is-expanded'));
        cards.forEach(card => toggleCard(card, !allExpanded));
      });
    }
  };

  initTimelineAccordion();


  // Master Portfolio dynamic rendering & tab filtering logic
  const initMasterPortfolio = async () => {
    const container = document.getElementById('portfolioContainer');
    const tabButtons = document.querySelectorAll('[data-portfolio-tab]');
    const categoryFilter = document.getElementById('portfolioCategoryFilter');
    const categoryBtns = document.querySelectorAll('[data-category]');

    if (!container) return;

    let masterData = [];
    try {
      const response = await fetch('/content/PROJECT_PORTFOLIO_MASTER.json');
      if (response.ok) {
        masterData = await response.json();
      }
    } catch (e) {
      console.warn('Could not load portfolio master JSON:', e);
    }

    if (!masterData.length) return;

    let currentTier = 'featured';
    let currentCategory = 'all';

    const getLang = () => (document.documentElement.lang === 'vi' || currentLang === 'vi') ? 'vi' : 'en';

    const renderCard = (item, index) => {
      const lang = getLang();
      const title = lang === 'vi' ? item.title_vi : item.title_en;
      const desc = lang === 'vi' ? item.desc_vi : item.desc_en;
      const role = lang === 'vi' ? item.role_vi : item.role_en;
      const contributions = lang === 'vi' ? item.contributions_vi : item.contributions_en;

      let statusBadgeClass = 'badge-status-active';
      if (item.tier === 'business') statusBadgeClass = 'badge-status-business';
      if (item.tier === 'labs') statusBadgeClass = 'badge-status-prototype';

      const tagsHtml = (item.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      const metricHtml = item.highlight_metric ? `<div class="portfolio-highlight-metric"><i class="fa-solid fa-chart-line"></i> ${item.highlight_metric}</div>` : '';
      const githubLink = item.github_repo ? `<a class="portfolio-link-btn" href="https://github.com/${item.github_repo}" target="_blank" rel="noopener noreferrer"><i class="fa-brands fa-github"></i> Code</a>` : '';
      const liveLink = item.live_url ? `<a class="portfolio-link-btn" href="${item.live_url}" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live</a>` : '';

      return `
        <article class="portfolio-item-card">
          <div class="portfolio-card-header">
            <span class="card-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="portfolio-badge-status ${statusBadgeClass}">${item.status || 'Active'}</span>
          </div>
          <h3>${title}</h3>
          <p class="eyebrow" style="margin-top: 4px; margin-bottom: 8px;">${item.category} · ${item.subcategory}</p>
          <p style="font-size: 0.92rem; color: var(--muted); line-height: 1.5; margin-bottom: 12px;">${desc}</p>
          <div class="role-block" style="margin-top: auto; padding-top: 12px;">
            <strong>${lang === 'vi' ? 'Vai trò & Đóng góp:' : 'Role & Contribution:'}</strong>
            <span style="color: var(--muted); font-size: 0.85rem;">${role} — ${contributions}</span>
          </div>
          ${metricHtml}
          <div class="tag-list">${tagsHtml}</div>
          <div class="portfolio-footer-meta">
            <span><i class="fa-regular fa-calendar-check"></i> ${item.period || '2024'}</span>
            <div class="portfolio-links">
              ${githubLink}
              ${liveLink}
            </div>
          </div>
        </article>
      `;
    };

    const updatePortfolioView = () => {
      let filtered = masterData.filter(item => item.tier === currentTier);

      if (currentTier === 'full' && currentCategory !== 'all') {
        filtered = masterData.filter(item => item.category === currentCategory || item.tier === 'full');
      }

      if (currentTier === 'full') {
        categoryFilter?.classList.remove('hidden');
      } else {
        categoryFilter?.classList.add('hidden');
      }

      if (currentTier === 'full' || currentTier === 'labs') {
        container.classList.add('portfolio-grid-full');
      } else {
        container.classList.remove('portfolio-grid-full');
      }

      if (!filtered.length) {
        container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--muted); padding: 30px;">${getLang() === 'vi' ? 'Không có dự án nào phù hợp.' : 'No projects found matching criteria.'}</p>`;
        return;
      }

      container.innerHTML = filtered.map((item, idx) => renderCard(item, idx)).join('');
    };

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        currentTier = btn.dataset.portfolioTab;
        updatePortfolioView();
      });
    });

    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        updatePortfolioView();
      });
    });

    updatePortfolioView();
  };

  initMasterPortfolio();

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
})();


