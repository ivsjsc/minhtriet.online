// Main JavaScript functionality for minhtriet.online
// Performance-optimized and modular structure

// Global variables
window.currentLang = 'vi';
window.typed = window.typed || null;

// Per-language translation objects are stored in /lang/*.js and are loaded on demand.
// Keep an in-memory translations map which will be populated when lang files are loaded.
// Note: window.translations_XX is loaded from lang/*.js files
// translationsMap keeps all loaded language objects by code (e.g. translationsMap.en)
// window.translations will point to the currently active language object (for convenience)
window.translationsMap = {};
window.translations = null;

// Development helper: when running on localhost (Live Server), unregister any service
// workers and clear caches to avoid serving stale content during development.
// This runs only on localhost/127.0.0.1 and is safe to keep — it does nothing in prod.
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    if ('serviceWorker' in navigator) {
        try {
            navigator.serviceWorker.getRegistrations().then(regs => {
                regs.forEach(reg => {
                    console.info('Unregistering service worker (dev):', reg);
                    reg.unregister();
                });
            }).catch(err => console.warn('Error getting SW registrations:', err));
        } catch (e) {
            console.warn('ServiceWorker unregister error', e);
        }
    }

    // Clear caches created by service workers (best-effort)
    if (window.caches && window.caches.keys) {
        try {
            caches.keys().then(keys => {
                keys.forEach(key => {
                    caches.delete(key).then(ok => {
                        if (ok) console.info('Deleted cache (dev):', key);
                    });
                });
            });
        } catch (e) {
            console.warn('Cache clear error (dev):', e);
        }
    }
}

// One-shot cache clear trigger for troubleshooting on any host.
// Usage: open the page with ?clearcache=1 (e.g. https://minhtriet.online/ivs-aitoolbox.html?clearcache=1)
// This will unregister service workers, clear caches, then reload the page once without the query.
if (location.search && location.search.indexOf('clearcache=1') !== -1) {
    console.info('clearcache trigger detected: unregistering service workers and clearing caches...');

    const doReload = () => {
        try {
            // Remove query string from URL without reloading (so subsequent reload is clean)
            const cleanUrl = location.origin + location.pathname + location.hash;
            window.history.replaceState({}, document.title, cleanUrl);
        } catch (e) {
            console.warn('Could not remove query string from URL:', e);
        }

        // Reload the page to fetch fresh resources from the network
        setTimeout(() => {
            console.info('Reloading page to fetch fresh resources...');
            location.reload();
        }, 400);
    };

    // Unregister service workers (if any)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(regs => {
            if (regs.length === 0) {
                console.info('No service workers registered.');
                // Still attempt to clear caches
                if (window.caches && window.caches.keys) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                doReload();
                return;
            }
            Promise.all(regs.map(reg => reg.unregister())).then(results => {
                console.info('Service workers unregistered:', results);
                // Clear caches (best-effort)
                if (window.caches && window.caches.keys) {
                    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).then(() => doReload()).catch(err => {
                        console.warn('Error clearing caches:', err);
                        doReload();
                    });
                } else {
                    doReload();
                }
            }).catch(err => {
                console.warn('Error unregistering service workers:', err);
                // still try clearing caches
                if (window.caches && window.caches.keys) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
                doReload();
            });
        }).catch(err => {
            console.warn('Could not get service worker registrations:', err);
            if (window.caches && window.caches.keys) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
            doReload();
        });
    } else {
        // No service worker support; just clear caches if possible and reload
        if (window.caches && window.caches.keys) caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
        doReload();
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeWebsite();
});

// Website initialization
function initializeWebsite() {
    // Hide loading screen
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.opacity = '0';
            setTimeout(() => loadingOverlay.style.display = 'none', 500);
        }
    }, 1000);

    // Initialize components (deferred to avoid blocking)
    setTimeout(() => {
        initParticles();
        initTypedText();
        initLazyImages(); // Add lazy loading
    }, 100);
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize portfolio filters
    initPortfolioFilters();
    
    // Contact form is handled in utils.js - avoid duplication
    
    // Initialize navigation
    initNavigation();
    
    // Initialize scroll progress
    initScrollProgress();
    
    // Initialize language switcher
    initLanguageSwitcher();

    // Load saved language (default to the page language or 'vi')
    const savedLang = localStorage.getItem('language') || document.documentElement.lang || 'vi';
    // Make sure changeLanguage is applied after init; changeLanguage now returns a Promise
    changeLanguage(savedLang).catch(err => {
        console.warn('changeLanguage failed during init:', err);
    });

    // Update footer year if present
    const fy = document.getElementById('current-year-foot');
    if (fy) fy.textContent = new Date().getFullYear();
}

// Newsletter subscribe validation and subtle CTA animation
document.addEventListener('DOMContentLoaded', () => {
    const subscribeBtn = document.querySelector('.newsletter-btn');
    const emailInput = document.querySelector('.newsletter-input');
    if (subscribeBtn && emailInput) {
        subscribeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const v = (emailInput.value || '').trim();
            const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
            if (!emailRx.test(v)) {
                emailInput.classList.add('ring', 'ring-red-400');
                setTimeout(() => emailInput.classList.remove('ring', 'ring-red-400'), 1500);
                // lightweight feedback
                alert('Please enter a valid email address');
                return;
            }
            // Subtle animation
            subscribeBtn.classList.add('transform', 'scale-95');
            setTimeout(() => subscribeBtn.classList.remove('transform', 'scale-95'), 200);
            // TODO: wire up to a newsletter backend - for now show a success state
            subscribeBtn.textContent = 'Subscribed ✓';
            subscribeBtn.disabled = true;
        });
    }
});

// Lazy-loading for images using data-src / data-srcset
function initLazyImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const img = entry.target;
            // If inside a <picture>, set source srcset attributes
            const picture = img.closest('picture');
            if (picture) {
                picture.querySelectorAll('source').forEach(source => {
                    const ds = source.getAttribute('data-srcset');
                    if (ds) source.setAttribute('srcset', ds);
                });
            }

            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) img.setAttribute('src', dataSrc);

            // Remove placeholder lazy gif if present
            if (img.dataset && img.dataset.src) delete img.dataset.src;

            observer.unobserve(img);
        });
    }, { rootMargin: '100px 0px' });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Particles.js initialization (with error handling)
function initParticles() {
    if (typeof particlesJS !== 'undefined') {
        particlesJS('particles-js', {
            particles: {
                number: { value: 80, density: { enable: true, value_area: 800 }},
                color: { value: "#ffffff" },
                shape: { type: "circle" },
                opacity: { value: 0.5, random: false },
                size: { value: 3, random: true },
                line_linked: { enable: true, distance: 150, color: "#ffffff", opacity: 0.4, width: 1 },
                move: { enable: true, speed: 6, direction: "none", random: false, straight: false, out_mode: "out", bounce: false }
            },
            interactivity: {
                detect_on: "canvas",
                events: { onhover: { enable: true, mode: "repulse" }, onclick: { enable: true, mode: "push" }, resize: true },
                modes: { repulse: { distance: 100, duration: 0.4 }, push: { particles_nb: 4 }}
            },
            retina_detect: true
        });
    }
}

// Typed text animation (with error handling)
function initTypedText() {
    if (typeof Typed !== 'undefined') {
        window.typed = new Typed('#typed-text', {
            strings: [
                'CEO & Technology Leader',
                'AI & EdTech Specialist', 
                'Microservices Architect',
                'Digital Transformation Expert'
            ],
            typeSpeed: 80,
            backSpeed: 60,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }
}

// Language switching with improved UX
function changeLanguage(lang) {
    // Returns a Promise that resolves when language is loaded and applied.
    return new Promise((resolve, reject) => {
        if (!lang) return reject(new Error('No language specified'));

        const langBtn = document.getElementById('lang-button');
        const span = document.getElementById('current-lang-text');

        // If translations for this lang are not loaded yet, load them and then apply.
        if (!window.translationsMap[lang]) {
            if (span) span.textContent = 'Loading...';
            else if (langBtn) langBtn.textContent = 'Loading...';

            const script = document.createElement('script');
            script.src = `./lang/${lang}.js`;
            script.onload = () => {
                const varName = `translations_${lang}`;
                if (window[varName]) {
                    window.translationsMap[lang] = window[varName];
                }
                try {
                    applyLanguage(lang);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };
            script.onerror = (e) => {
                console.warn('Failed to load language file for', lang, e);
                if (span) span.textContent = 'ERR';
                else if (langBtn) langBtn.textContent = 'ERR';
                // fallback to English if available
                if (window.translationsMap['en']) {
                    try { applyLanguage('en'); resolve(); } catch (err) { reject(err); }
                } else {
                    reject(new Error('Failed to load language and no fallback available'));
                }
            };
            document.head.appendChild(script);
            return;
        }

        try {
            applyLanguage(lang);
            resolve();
        } catch (err) {
            reject(err);
        }
    });
}

function applyLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem('language', lang);

    // Set the active translations object for convenience
    if (window.translationsMap && window.translationsMap[lang]) {
        window.translations = window.translationsMap[lang];
    } else {
        window.translations = null;
    }

    // Update all elements with data-lang-key
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.getAttribute('data-lang-key');
        if (window.translations && window.translations[key]) {
            element.textContent = window.translations[key];
        }
    });

    // Update placeholders for inputs that use data-lang-key-placeholder
    document.querySelectorAll('[data-lang-key-placeholder]').forEach(el => {
        const phKey = el.getAttribute('data-lang-key-placeholder');
        if (window.translations && window.translations[phKey]) {
            el.setAttribute('placeholder', window.translations[phKey]);
        }
    });

    // Update select options which use data-lang-key
    document.querySelectorAll('select option[data-lang-key]').forEach(opt => {
        const k = opt.getAttribute('data-lang-key');
        if (window.translations && window.translations[k]) opt.textContent = window.translations[k];
    });

    // Update document title
    if (window.translations && window.translations['page_title']) {
        document.title = window.translations['page_title'];
    }

    // Update language button display (preserve inner span if present)
    const langBtn = document.getElementById('lang-button');
    const currentLangText = document.getElementById('current-lang-text');
    const langNames = {
        'en': 'English',
        'vi': 'Tiếng Việt', 
        'zh': '中文',
        'ko': '한국어',
        'th': 'ไทย',
        'de': 'Deutsch',
        'es': 'Español',
        'fr': 'Français',
        'ja': '日本語'
    };
    const displayName = (langNames[lang] || lang.toUpperCase());
    if (currentLangText) {
        currentLangText.textContent = displayName;
    } else if (langBtn) {
        langBtn.textContent = displayName + ' ▼';
    }

    // Update menu selected state if menu exists
    const menu = document.getElementById('language-menu');
    if (menu) {
        menu.querySelectorAll('li').forEach(li => {
            try {
                if (li.dataset && li.dataset.lang === lang) li.classList.add('selected');
                else li.classList.remove('selected');
            } catch (e) { /* ignore malformed items */ }
        });
    }

    // Update current year dynamically
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Re-render Experience section if function exists
    if (typeof window.renderExperience === 'function') {
        window.renderExperience();
    }

    // Update document language
    document.documentElement.lang = lang;
}

// Language switcher initialization
function initLanguageSwitcher() {
    const btn = document.getElementById('lang-button');
    const menu = document.getElementById('language-menu');
    
    if (btn && menu) {
        // Toggle dropdown and prevent immediate document click from closing it
        btn.addEventListener('click', e => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });

        // Hide on outside click
        document.addEventListener('click', () => {
            menu.classList.remove('active');
        });

        // Use event delegation on the menu for robustness
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
            const li = e.target.closest('li');
            if (!li) return;
            const lang = li.dataset && li.dataset.lang;
            if (!lang) return;

            // changeLanguage returns a Promise; update UI when done
            changeLanguage(lang).then(() => {
                // ensure menu closed and selected state updated
                menu.classList.remove('active');
            }).catch(err => {
                console.warn('Language change failed:', err);
            });
        });
    }
}

// Global function for language switching (called from HTML)
window.changeLanguage = changeLanguage;

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { changeLanguage, applyLanguage, initializeWebsite };
}