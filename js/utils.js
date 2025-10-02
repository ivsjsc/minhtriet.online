// Utility functions for minhtriet.online
// Scroll animations, portfolio filters, form handling, navigation

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-section').forEach(section => {
        observer.observe(section);
    });
}

// Portfolio filters
function initPortfolioFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.getAttribute('data-filter');
            
            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Filter items
            portfolioItems.forEach(item => {
                if (filter === 'all' || item.classList.contains(filter)) {
                    item.style.display = 'block';
                    setTimeout(() => item.style.opacity = '1', 50);
                } else {
                    item.style.opacity = '0';
                    setTimeout(() => item.style.display = 'none', 300);
                }
            });
        });
    });
}

// Contact form handling with validation and error handling
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) {
        console.warn('Contact form not found');
        return;
    }

    // Avoid attaching multiple listeners
    if (form.__contactHandlerAttached) {
        console.warn('Contact form handler already attached');
        return;
    }
    form.__contactHandlerAttached = true;

    // Form elements
    const nameInput = form.querySelector('#name');
    const emailInput = form.querySelector('#email');
    const subjectSelect = form.querySelector('#subject');
    const messageInput = form.querySelector('#message');
    const submitBtn = form.querySelector('button[type="submit"]');
    const formStatus = document.getElementById('formStatus');
    const successMessage = formStatus.querySelector('.success-message');
    const errorMessage = formStatus.querySelector('.error-message');

    // Validation functions
    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validateForm = () => {
        let isValid = true;
        
        // Reset previous error states
        [nameInput, emailInput, subjectSelect, messageInput].forEach(input => {
            input.classList.remove('border-red-500');
            input.parentElement.querySelector('.pointer-events-none')?.classList.add('hidden');
        });

        // Name validation
        if (!nameInput.value.trim()) {
            nameInput.classList.add('border-red-500');
            nameInput.parentElement.querySelector('.pointer-events-none')?.classList.remove('hidden');
            isValid = false;
        }

        // Email validation
        if (!validateEmail(emailInput.value)) {
            emailInput.classList.add('border-red-500');
            emailInput.parentElement.querySelector('.pointer-events-none')?.classList.remove('hidden');
            isValid = false;
        }

        // Subject validation
        if (!subjectSelect.value) {
            subjectSelect.classList.add('border-red-500');
            isValid = false;
        }

        // Message validation
        if (!messageInput.value.trim()) {
            messageInput.classList.add('border-red-500');
            messageInput.parentElement.querySelector('.pointer-events-none')?.classList.remove('hidden');
            isValid = false;
        }

        return isValid;
    };

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) return;

        // Update button state
            submitBtn.disabled = true;
            const sendingText = (window.translations && window.translations.form_sending) || 'Sending...';
            submitBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>' + sendingText;

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'Accept': 'application/json'
                }
            });

            // Show success message
            if (response.ok) {
                form.reset();
                formStatus.classList.remove('hidden');
                successMessage.classList.remove('hidden');
                errorMessage.classList.add('hidden');
                
                // Hide success message after 5 seconds
                setTimeout(() => {
                    formStatus.classList.add('hidden');
                    successMessage.classList.add('hidden');
                }, 5000);
            } else {
                throw new Error('Network response was not ok');
            }
        } catch (error) {
            console.error('Error:', error);
            formStatus.classList.remove('hidden');
            errorMessage.classList.remove('hidden');
            successMessage.classList.add('hidden');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            const submitText = (window.translations && window.translations.form_submit) || 'Send Message';
            submitBtn.innerHTML = '<span data-lang-key="form_submit">' + submitText + '</span>' +
                '<svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>';
        }
    });

    // Real-time validation
    [nameInput, emailInput, messageInput].forEach(input => {
        input.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('border-red-500');
                this.parentElement.querySelector('.pointer-events-none')?.classList.remove('hidden');
            } else if (this.type === 'email' && !validateEmail(this.value)) {
                this.classList.add('border-red-500');
                this.parentElement.querySelector('.pointer-events-none')?.classList.remove('hidden');
            } else {
                this.classList.remove('border-red-500');
                this.parentElement.querySelector('.pointer-events-none')?.classList.add('hidden');
            }
        });
    });
}

// Navigation handling
function initNavigation() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Smooth scroll for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                if (mobileMenu) {
                    mobileMenu.classList.add('hidden');
                }
            }
        });
    });

    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        let lastScrollY = window.scrollY;
        
        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;
            
            if (currentScrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            
            lastScrollY = currentScrollY;
        });
    }

    // Back to top button
    const backToTopBtn = document.getElementById('toTopBtn');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopBtn.style.display = 'block';
            } else {
                backToTopBtn.style.display = 'none';
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Scroll progress indicator
function initScrollProgress() {
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrollPercent = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = scrollPercent + '%';
        });
    }
}

// Performance optimization: Lazy load images
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    imageObserver.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// Export functions for main.js
if (typeof window !== 'undefined') {
    window.initScrollAnimations = initScrollAnimations;
    window.initPortfolioFilters = initPortfolioFilters;
    window.initContactForm = initContactForm;
    window.initNavigation = initNavigation;
    window.initScrollProgress = initScrollProgress;
    window.initLazyLoading = initLazyLoading;
}