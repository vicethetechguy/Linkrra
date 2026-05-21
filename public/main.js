document.addEventListener('DOMContentLoaded', () => {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const animateOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Apply animation classes
    const elementsToAnimate = [
        '.step-card',
        '.why-us-content h2',
        '.benefits-list li',
        '.glass-card',
        '.testimonial-card',
        '.template-card'
    ];

    elementsToAnimate.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = `all 0.6s ease-out ${index % 3 * 0.1}s`;
            animateOnScroll.observe(el);
        });
    });

    // Add CSS for fade-in dynamically
    const style = document.createElement('style');
    style.innerHTML = `
        .fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Dynamic rotation effect for abstract cards in Why Us section
    const abstractCards = document.querySelector('.why-us-visual');
    if (abstractCards) {
        abstractCards.addEventListener('mousemove', (e) => {
            const cards = document.querySelectorAll('.glass-card');
            const rect = abstractCards.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            cards.forEach((card, index) => {
                const speed = (index + 1) * 0.05;
                const activeTransform = card.getAttribute('data-initial-transform') || getComputedStyle(card).transform;
                if (!card.getAttribute('data-initial-transform')) {
                    card.setAttribute('data-initial-transform', activeTransform);
                }
                const baseTransform = window.getComputedStyle(card).getPropertyValue('transform');
                
                // Only applying subtle movement based on mouse
                card.style.transform = `${card.getAttribute('data-initial-transform')} translate(${x * speed}px, ${y * speed}px)`;
            });
        });
        
        abstractCards.addEventListener('mouseleave', () => {
            const cards = document.querySelectorAll('.glass-card');
            cards.forEach(card => {
                if (card.getAttribute('data-initial-transform')) {
                    card.style.transform = card.getAttribute('data-initial-transform');
                }
            });
        });
    }

    // Video error handling fallback
    const video = document.querySelector('.hero-video');
    if (video) {
        video.addEventListener('error', () => {
            video.style.display = 'none';
            const mockup = document.querySelector('.mockup-container');
            if (mockup) {
                mockup.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)';
            }
        });
    }
});

// Mobile Hamburger Menu
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
const mobileNavClose = document.getElementById('mobile-nav-close');

if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', () => {
        mobileNavOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    });
}

if (mobileNavClose) {
    mobileNavClose.addEventListener('click', closeMobileNav);
}

if (mobileNavOverlay) {
    mobileNavOverlay.addEventListener('click', (e) => {
        if (e.target === mobileNavOverlay) closeMobileNav();
    });
}

function closeMobileNav() {
    const overlay = document.getElementById('mobile-nav-overlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}
