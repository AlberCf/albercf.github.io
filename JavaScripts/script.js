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
        if (open) navbar.classList.remove('hidden');
    };

    menuToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

    // Navbar compacta, se oculta al bajar y reaparece al subir + barra de progreso
    let lastY = window.scrollY;
    const onScroll = () => {
        const y = window.scrollY;
        navbar.classList.toggle('scrolled', y > 20);
        if (!navLinks.classList.contains('open')) {
            const goingDown = y > lastY + 4;
            const goingUp = y < lastY - 4;
            if (goingDown && y > 600) navbar.classList.add('hidden');
            else if (goingUp || y < 600) navbar.classList.remove('hidden');
        }
        lastY = y;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    };

    // Reloj en hora de Madrid
    const navTime = document.getElementById('nav-time');
    if (navTime) {
        const fmt = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' });
        const tick = () => { navTime.textContent = `Madrid · ${fmt.format(new Date())}`; };
        tick();
        setInterval(tick, 15000);
    }

    // Indicador que se desliza bajo el enlace activo / en hover
    const indicator = document.getElementById('nav-indicator');
    const moveIndicator = (el) => {
        if (!indicator) return;
        if (!el) { indicator.style.opacity = '0'; return; }
        indicator.style.width = `${el.offsetWidth}px`;
        indicator.style.transform = `translateX(${el.offsetLeft}px)`;
        indicator.style.opacity = '1';
    };
    const restIndicator = () => moveIndicator(document.querySelector('.nav-item.active'));
    document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('mouseenter', () => moveIndicator(a)));
    navLinks.addEventListener('mouseleave', restIndicator);
    window.addEventListener('resize', restIndicator);
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

    // Las tarjetas del retrato se iluminan cuando un punto de órbita pasa por delante
    const disc = document.querySelector('.portrait-disc');
    if (disc && !reduceMotion && 'IntersectionObserver' in window) {
        const dots = [...document.querySelectorAll('.orbit i')];
        const cards = [...document.querySelectorAll('.float-card')];
        const center = (r) => [r.left + r.width / 2, r.top + r.height / 2];
        const angleDiff = (a, b) => {
            const d = Math.abs(a - b) % (2 * Math.PI);
            return d > Math.PI ? 2 * Math.PI - d : d;
        };
        let rafId = 0;

        const tickGlow = () => {
            const [cx, cy] = center(disc.getBoundingClientRect());
            const dotAngles = dots
                .filter(d => d.offsetParent)
                .map(d => {
                    const [x, y] = center(d.getBoundingClientRect());
                    return { a: Math.atan2(y - cy, x - cx), alt: d.parentElement.classList.contains('orbit-2') };
                });

            cards.forEach(card => {
                if (!card.offsetParent) return;
                const [x, y] = center(card.getBoundingClientRect());
                const a = Math.atan2(y - cy, x - cx);
                const hit = dotAngles.find(d => angleDiff(d.a, a) < 0.3);
                card.classList.toggle('lit', Boolean(hit));
                card.classList.toggle('lit-alt', Boolean(hit && hit.alt));
            });
            rafId = requestAnimationFrame(tickGlow);
        };

        new IntersectionObserver(([entry]) => {
            cancelAnimationFrame(rafId);
            if (entry.isIntersecting) rafId = requestAnimationFrame(tickGlow);
        }).observe(disc);
    }

    // Enlace activo en la navegación
    const navItems = document.querySelectorAll('.nav-item');
    const sections = [...navItems].map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window) {
        const spy = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
                if (!navLinks.matches(':hover')) restIndicator();
            });
            // Fuera de cualquier sección enlazada (hero, perfil, contacto) no hay activo
            if (!sections.some(sec => {
                const r = sec.getBoundingClientRect();
                return r.top < window.innerHeight * 0.5 && r.bottom > window.innerHeight * 0.5;
            })) {
                navItems.forEach(a => a.classList.remove('active'));
                if (!navLinks.matches(':hover')) restIndicator();
            }
        }, { rootMargin: '-45% 0px -50% 0px' });
        sections.forEach(s => spy.observe(s));
    }

    // Spotlight que sigue al cursor + inclinación 3D de las capturas
    if (finePointer && !reduceMotion) {
        // Foco de luz en la navbar
        const shell = document.getElementById('nav-shell');
        shell.addEventListener('pointermove', (e) => {
            const r = shell.getBoundingClientRect();
            shell.style.setProperty('--nx', `${e.clientX - r.left}px`);
        });

        // Botón "Hablemos" magnético
        const cta = document.getElementById('nav-cta');
        cta.addEventListener('pointermove', (e) => {
            const r = cta.getBoundingClientRect();
            const dx = e.clientX - (r.left + r.width / 2);
            const dy = e.clientY - (r.top + r.height / 2);
            cta.style.transform = `translate(${dx * 0.25}px, ${dy * 0.35}px)`;
        });
        cta.addEventListener('pointerleave', () => { cta.style.transform = ''; });

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
