// Internationalization Manager
// Handles language switching, translation application, and storage

class I18nManager {
  constructor() {
    this.currentLang = this.getStoredLang() || 'vi';
    this.translations = window.translationsData || {};
    this.statusEl = document.getElementById("translation-status");
    this.langSelect = document.getElementById("lang");
    
    // HTML language mapping
    this.HTML_LANG = {
      vi: "vi",
      en: "en",
      de: "de",
      es: "es",
      fr: "fr",
      ja: "ja",
      ko: "ko",
      ru: "ru",
      th: "th",
      zh: "zh-Hans"
    };
    
    this.init();
  }
  
  init() {
    // Set initial language
    this.applyLanguage(this.currentLang);
    
    // Setup language selector
    if (this.langSelect) {
      this.langSelect.value = this.translations[this.currentLang] ? this.currentLang : "en";
      this.langSelect.addEventListener("change", (e) => {
        this.applyLanguage(e.target.value);
      });
    }
    
    // Fill missing keys from English
    this.fillMissingKeys();
  }
  
  getStoredLang() {
    try {
      return window.localStorage.getItem("site_lang");
    } catch {
      return null;
    }
  }
  
  setStoredLang(lang) {
    try {
      window.localStorage.setItem("site_lang", lang);
    } catch {
      // Silent fail
    }
  }
  
  applyLanguage(rawLang) {
    const lang = this.translations[rawLang] ? rawLang : "en";
    const dict = this.translations[lang];
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      const val = dict[key] ?? this.translations.en[key] ?? key;
      if (typeof val === "string") el.textContent = val;
    });
    
    // Update page title and HTML lang attribute
    document.title = dict.page_title || this.translations.en.page_title;
    document.documentElement.lang = this.HTML_LANG[lang] || "en";
    
    // Store preference
    this.setStoredLang(lang);
    this.currentLang = lang;
    
    // Render dynamic content
    this.renderIndustryTags(lang);
    this.renderExperienceDetails(lang);
    this.renderSectionToggles(lang);
    this.renderItemToggles(lang);
    this.syncHeroStatsToggleLabel();
    
    // Update translation status
    this.updateTranslationStatus(lang);
    
    // Log translation audit
    this.logTranslationAudit(lang);
  }
  
  fillMissingKeys() {
    Object.keys(this.translations).forEach((code) => {
      if (code === "en") return;
      this.translations[code] = { ...this.translations.en, ...this.translations[code] };
    });
  }
  
  translationAudit(langCode) {
    const baseKeys = Object.keys(this.translations.en);
    const table = this.translations[langCode] || {};
    const missing = baseKeys.filter((k) => !(k in table));
    return { missing, total: baseKeys.length };
  }
  
  updateTranslationStatus(lang) {
    if (!this.statusEl) return;
    
    const audit = this.translationAudit(lang);
    const dict = this.translations[lang];
    
    if (audit.missing.length === 0) {
      this.statusEl.textContent = `${dict.translation_ok || this.translations.en.translation_ok} (${audit.total}/${audit.total})`;
    } else {
      this.statusEl.textContent = `${dict.translation_missing || this.translations.en.translation_missing}: ${audit.missing.length}/${audit.total}`;
    }
  }
  
  logTranslationAudit(lang) {
    const audit = this.translationAudit(lang);
    console.info(`[i18n] ${lang}: ${audit.total - audit.missing.length}/${audit.total} keys translated`);
    if (audit.missing.length > 0) {
      console.warn(`[i18n] Missing keys for ${lang}:`, audit.missing);
    }
  }
  
  renderIndustryTags(lang) {
    const el = document.getElementById("tagList");
    if (!el) return;
    
    const dict = this.translations[lang] || this.translations.en;
    const tags = Array.isArray(dict.tags) ? dict.tags : this.translations.en.tags || [];
    const label = dict.sectors_label || this.translations.en.sectors_label || "";
    
    el.innerHTML = `<span class="industry-label">${label}</span>${tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}`;
  }
  
  renderExperienceDetails(lang) {
    // Implementation for rendering experience details
    // This would use the experienceDetails object
  }
  
  renderSectionToggles(lang) {
    // Implementation for rendering section toggles
  }
  
  renderItemToggles(lang) {
    // Implementation for rendering item toggles
  }
  
  syncHeroStatsToggleLabel() {
    const panel = document.getElementById("heroStatsPanel");
    const btn = document.getElementById("heroStatsToggle");
    const span = btn?.querySelector(".hero-stats-toggle-text");
    
    if (!panel || !btn || !span) return;
    
    const lang = this.currentLang;
    const dict = this.translations[lang] || this.translations.en;
    const open = !panel.hidden;
    const show = dict.hero_stats_show ?? this.translations.en.hero_stats_show ?? "";
    const hide = dict.hero_stats_hide ?? this.translations.en.hero_stats_hide ?? "";
    
    span.textContent = open ? hide : show;
    btn.setAttribute("aria-expanded", String(open));
    btn.setAttribute("aria-label", span.textContent);
  }
  
  // Public API
  getCurrentLang() {
    return this.currentLang;
  }
  
  getTranslation(key, lang = this.currentLang) {
    const dict = this.translations[lang] || this.translations.en;
    return dict[key] ?? this.translations.en[key] ?? key;
  }
  
  setLanguage(lang) {
    this.applyLanguage(lang);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.i18nManager = new I18nManager();
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18nManager;
}
