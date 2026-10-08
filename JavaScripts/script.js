document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const progress = document.querySelector('.scroll-progress');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // Año del footer
    const year = document.getElementById('year');
    if (year) year.textContent = new Date().getFullYear();

    // Menú móvil
    const setMenu = (open) => {
        navLinks.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
        document.body.style.overflow = open ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    // Navbar compacta + barra de progreso
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 20);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Revelado al hacer scroll (con escalonado entre hermanos)
    const revealEls = document.querySelectorAll('.reveal');
    revealEls.forEach(el => {
        const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
        const i = siblings.indexOf(el);
        if (i > 0) el.style.setProperty('--d', `${Math.min(i * 0.08, 0.4)}s`);
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        revealEls.forEach(el => io.observe(el));
    } else {
        revealEls.forEach(el => el.classList.add('in'));
    }

    // Enlace activo en la navegación
    const navItems = document.querySelectorAll('.nav-item');
    const sections = [...navItems].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
            });
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => spy.observe(s));
    }

    // Spotlight que sigue al cursor + inclinación 3D de las capturas
    if (finePointer && !reduceMotion) {
        document.querySelectorAll('.project, .bento-card').forEach(card => {
            card.addEventListener('pointermove', (e) => {
                const r = card.getBoundingClientRect();
                card.style.setProperty('--mx', `${e.clientX - r.left}px`);
                card.style.setProperty('--my', `${e.clientY - r.top}px`);
            });
        });

        document.querySelectorAll('.project-media').forEach(media => {
            const browser = media.querySelector('.browser');
            media.addEventListener('pointermove', (e) => {
                const r = media.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                browser.style.setProperty('--ry', `${px * 6}deg`);
                browser.style.setProperty('--rx', `${py * -6}deg`);
            });
            media.addEventListener('pointerleave', () => {
                browser.style.setProperty('--ry', '0deg');
                browser.style.setProperty('--rx', '0deg');
            });
        });
    }
});

// Formulario AJAX con Formspree
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnHTML = submitBtn.innerHTML;

        submitBtn.textContent = 'Enviando…';
        submitBtn.disabled = true;
        formStatus.className = 'form-status';
        formStatus.textContent = '';

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                formStatus.textContent = '¡Mensaje enviado! Te responderé muy pronto.';
                formStatus.className = 'form-status success';
                contactForm.reset();
                setTimeout(() => { formStatus.className = 'form-status'; }, 6000);
            } else {
                const data = await response.json().catch(() => ({}));
                formStatus.textContent = Array.isArray(data.errors)
                    ? data.errors.map(err => err.message).join(', ')
                    : 'Hubo un problema al enviar el mensaje.';
                formStatus.className = 'form-status error';
            }
        } catch (error) {
            console.error('Error de envío:', error);
            formStatus.textContent = 'Error de conexión. Inténtalo de nuevo o escríbeme por email.';
            formStatus.className = 'form-status error';
        } finally {
            submitBtn.innerHTML = originalBtnHTML;
            submitBtn.disabled = false;
        }
    });
}
