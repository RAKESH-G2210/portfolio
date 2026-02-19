/* ==========================================
   Modern Portfolio - JavaScript
   ========================================== */

/**
 * Smooth scroll behavior for navigation links
 */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        // Skip if href is just '#'
        if (href === '#') return;
        
        e.preventDefault();
        const element = document.querySelector(href);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            try { history.pushState(null, '', href); } catch (err) { /* ignore */ }
        }
    });
});

/**
 * Active navigation link highlighting based on scroll position
 */
window.addEventListener('scroll', () => {
    let current = '';
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

/**
 * Lazy loading animation for elements on scroll
 */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // add visible class for CSS-driven reveal
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('section, .project-card, .reveal').forEach(el => {
    // ensure reveal class exists so CSS handles initial state
    if (!el.classList.contains('reveal')) el.classList.add('reveal');
    observer.observe(el);
});

/**
 * Mobile menu toggle (for future implementation)
 */
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const expanded = navToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
            navToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        });
    }
}

/**
 * Scroll to top button functionality
 */
function initScrollToTop() {
    const scrollBtn = document.querySelector('.scroll-to-top');
    
    if (scrollBtn) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 300) {
                scrollBtn.style.display = 'block';
            } else {
                scrollBtn.style.display = 'none';
            }
        });

        scrollBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/**
 * Form validation (for contact forms)
 */
function validateForm(formElement) {
    const inputs = formElement.querySelectorAll('input, textarea');
    let isValid = true;

    inputs.forEach(input => {
        if (input.value.trim() === '') {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

/**
 * Initialize all functions on DOM load
 */
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initScrollToTop();
    
    // Close mobile nav when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.addEventListener('click', () => {
            const navToggle = document.querySelector('.nav-toggle');
            const navLinks = document.querySelector('.nav-links');
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                navToggle.classList.remove('active');
                navToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Observe any remaining reveal elements
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // wire up internal link transitions for smooth page fades
    document.querySelectorAll('a[data-link], a[href$=".html"]').forEach(a => {
        a.addEventListener('click', (e) => {
            const href = a.getAttribute('href');
            // only intercept same-origin html links
            if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('#')) return;
            e.preventDefault();
            document.body.style.transition = 'opacity 300ms ease';
            document.body.style.opacity = '0';
            setTimeout(() => { window.location.href = href; }, 320);
        });
    });

    // If on projects page, attempt to fetch repos
    if (document.getElementById('projects-root')) {
        if (typeof GITHUB_USERNAME === 'undefined' || GITHUB_USERNAME === 'YOUR_GITHUB_USERNAME') {
            const root = document.getElementById('projects-root');
            root.innerHTML = '<div class="muted">Replace GITHUB_USERNAME in projects.html with your GitHub username.</div>';
        } else {
            fetchAndRenderRepos(GITHUB_USERNAME);
        }
    }

    // Contact form handling
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (ev) => {
            ev.preventDefault();
            if (!validateForm(contactForm)) return;
            const form = new FormData(contactForm);
            const name = form.get('name');
            const email = form.get('email');
            const message = form.get('message');
            const subject = encodeURIComponent(`Website contact from ${name}`);
            const body = encodeURIComponent(`Name: ${name}%0AEmail: ${email}%0A%0A${message}`);
            window.location.href = `mailto:your.email@example.com?subject=${subject}&body=${body}`;
        });
    }

    // Fade body in on load
    document.body.style.opacity = '0';
    requestAnimationFrame(() => { document.body.style.transition = 'opacity 320ms ease'; document.body.style.opacity = '1'; });

    // Log initialization
    console.log('Portfolio initialized successfully!');
});

// Fix for back/forward cache and browser back behavior: ensure page becomes visible
window.addEventListener('pageshow', (event) => {
    // If page was restored from bfcache (persisted=true) it may keep old inline styles
    if (event.persisted) {
        // Temporarily disable transition, force visible, then re-enable transition
        document.body.style.transition = 'none';
        document.body.style.opacity = '1';
        setTimeout(() => { document.body.style.transition = 'opacity 320ms ease'; }, 50);
    } else {
        // Normal navigation - ensure visible
        document.body.style.opacity = '1';
    }
});

/**
 * Fetch GitHub repos and render up to 6 most recently updated
 */
async function fetchAndRenderRepos(username) {
    const root = document.getElementById('projects-root');
    const grid = document.getElementById('projects-grid');
    const loading = root.querySelector('.loading');
    try {
        const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        const sorted = data.sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at));
        const top = sorted.slice(0,6);
        grid.innerHTML = '';
        top.forEach(repo => {
            const el = document.createElement('article');
            el.className = 'project-card reveal visible';
            el.innerHTML = `
                <h3>${escapeHtml(repo.name)}</h3>
                <p class="muted">${escapeHtml(repo.description || '')}</p>
                <div class="card-actions"><a class="btn small" href="${repo.html_url}" target="_blank" rel="noopener noreferrer">View on GitHub</a></div>
            `;
            grid.appendChild(el);
        });
        if (loading) loading.style.display = 'none';
        grid.style.display = '';
    } catch (err) {
        if (loading) loading.textContent = 'Unable to load repositories.';
        console.error(err);
    }
}

function escapeHtml(str){
    return str.replace(/[&<>"]+/g, function(match){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[match];
    });
}

/**
 * Utility function: Smooth fade in animation
 */
function fadeInElement(element, duration = 600) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    
    setTimeout(() => {
        element.style.opacity = '1';
    }, 10);
}

/**
 * Utility function: Add class with delay
 */
function addClassWithDelay(element, className, delay) {
    setTimeout(() => {
        element.classList.add(className);
    }, delay);
}

/**
 * Example: Animate counter numbers
 */
function animateCounter(element, target, duration = 2000) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

/* Export functions for external use if needed */
window.portfolioUtils = {
    validateForm,
    fadeInElement,
    addClassWithDelay,
    animateCounter
};
