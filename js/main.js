// Main JavaScript functionality for minhtriet.online
// Performance-optimized and modular structure

// Global variables
window.currentLang = 'vi';
window.typed = window.typed || null;

// Per-language translation objects are stored in /lang/*.js and are loaded on demand.
// Keep an in-memory translations map which will be populated when lang files are loaded.
// Note: window.translations_XX is loaded from lang/*.js files
window.translations = {};

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
    }, 100);
    
    // Initialize scroll animations
    initScrollAnimations();
    
    // Initialize portfolio filters
    initPortfolioFilters();
    
    // Initialize contact form
    function initContactForm() {
        // Centralized contact form handler moved from index.html inline script.
        try {
            const form = document.getElementById('contactForm');
            if (!form) return;

            // Avoid attaching multiple listeners
            if (form.__contactHandlerAttached) return;
            form.__contactHandlerAttached = true;

            form.addEventListener('submit', function(e) {
                e.preventDefault();
                const formData = new FormData(form);
                const formStatus = document.getElementById('formStatus');
                const successMsg = formStatus ? formStatus.querySelector('.success-message') : null;
                const errorMsg = formStatus ? formStatus.querySelector('.error-message') : null;
                const submitBtn = form.querySelector('button[type="submit"]');

                // Hide previous messages
                if (successMsg) successMsg.classList.add('hidden');
                if (errorMsg) errorMsg.classList.add('hidden');
                if (formStatus) formStatus.classList.add('hidden');

                // Disable button and set localized sending text
                if (submitBtn) {
                    submitBtn.disabled = true;
                    const sendingText = (window.translations && (window.translations['form_sending'] || window.translations['form_sending'])) || 'Đang gửi...';
                    submitBtn.textContent = sendingText;
                }

                fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                })
                .then(async response => {
                    // Try to parse JSON response (Formspree returns JSON on success/failure)
                    let body = null;
                    try {
                        const contentType = response.headers.get('content-type') || '';
                        if (contentType.includes('application/json')) {
                            body = await response.json();
                        } else {
                            body = await response.text();
                        }
                    } catch (err) {
                        console.warn('Could not parse response body', err);
                    }

                    console.log('Formspree response status:', response.status, 'body:', body);

                    if (response.ok) {
                        if (successMsg) successMsg.classList.remove('hidden');
                        if (formStatus) formStatus.classList.remove('hidden');
                        form.reset();
                    } else {
                        // If Formspree returned a helpful message include it in the console
                        console.error('Form submission error', { status: response.status, body });
                        throw new Error((body && body.error) ? body.error : 'Form submission failed');
                    }
                })
                .catch(error => {
                    if (errorMsg) errorMsg.classList.remove('hidden');
                    if (formStatus) formStatus.classList.remove('hidden');
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        const submitText = (window.translations && (window.translations['form_submit'] || window.translations['form_submit'])) || 'Gửi Tin Nhắn';
                        submitBtn.textContent = submitText;
                    }
                });
            });
        } catch (err) {
            console.error('initContactForm error', err);
        }
    }
    initContactForm();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize scroll progress
    initScrollProgress();
    
    // Initialize language switcher
    initLanguageSwitcher();
    
    // Load saved language
    const savedLang = localStorage.getItem('language') || 'en';
    changeLanguage(savedLang);

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
    // If translations are not loaded in-memory, try to load external lang file
    if (!window.translations[lang]) {
        const langBtn = document.getElementById('lang-button');
        if (langBtn) {
            const prev = langBtn.textContent;
            langBtn.textContent = 'Loading...';
        }
        const script = document.createElement('script');
        script.src = `./lang/${lang}.js`;
        script.onload = () => {
            // map loaded window.translations_<code> to translations[code]
            const varName = `translations_${lang}`;
            if (window[varName]) {
                window.translations[lang] = window[varName];
            }
            if (langBtn) langBtn.textContent = lang.toUpperCase();
            applyLanguage(lang);
        };
        script.onerror = () => {
            console.warn('Failed to load language file for', lang);
            if (langBtn) langBtn.textContent = 'ERR';
            // fallback to English if available
            if (window.translations['en']) applyLanguage('en');
        };
        document.head.appendChild(script);
        return;
    }
    applyLanguage(lang);
}

function applyLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem('language', lang);

    // Always point window.translations to the current language object
    if (window.translations[lang]) {
        window.translations = window.translations[lang];
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

    // Update language button text with proper language name
    const langBtn = document.getElementById('lang-button');
    if (langBtn) {
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
        langBtn.textContent = (langNames[lang] || lang.toUpperCase()) + ' ▼';
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
        // Toggle dropdown
        btn.addEventListener('click', e => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });
        
        // Hide on outside click
        document.addEventListener('click', () => {
            menu.classList.remove('active');
        });
        
        // Handle language selection
        menu.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                const lang = item.dataset.lang;
                changeLanguage(lang);
                menu.classList.remove('active');
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