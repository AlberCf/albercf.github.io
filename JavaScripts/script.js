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

        // El carnet se inclina siguiendo al cursor
        const badgeEl = document.getElementById('badge');
        if (badgeEl) {
            badgeEl.addEventListener('pointermove', (e) => {
                const r = badgeEl.getBoundingClientRect();
                const px = (e.clientX - r.left) / r.width - 0.5;
                const py = (e.clientY - r.top) / r.height - 0.5;
                badgeEl.style.setProperty('--ry', `${px * 14}deg`);
                badgeEl.style.setProperty('--rx', `${py * -10}deg`);
            });
            badgeEl.addEventListener('pointerleave', () => {
                badgeEl.style.setProperty('--ry', '0deg');
                badgeEl.style.setProperty('--rx', '0deg');
            });
        }
    }

    // Nombre gigante del hero con un poco de parallax
    const outline = document.getElementById('hero-outline');
    if (outline && !reduceMotion) {
        window.addEventListener('scroll', () => {
            if (window.scrollY < window.innerHeight * 1.2) {
                outline.style.setProperty('--py', `${window.scrollY * 0.25}px`);
            }
        }, { passive: true });
    }

    // Carnet: se gira al tocarlo o con Enter/Espacio (en escritorio también al pasar el ratón)
    const badge = document.getElementById('badge');
    if (badge) {
        badge.addEventListener('click', () => {
            const flipped = badge.classList.toggle('flipped');
            badge.setAttribute('aria-pressed', String(flipped));
        });
    }

    // Tabla periódica del stack
    const FAMILIES = {
        lang: { name: 'Lenguajes', c: '100, 255, 218' },
        front: { name: 'Frontend', c: '124, 140, 255' },
        back: { name: 'Backend', c: '79, 209, 255' },
        ai: { name: 'IA y agentes', c: '197, 140, 255' },
        data: { name: 'Datos', c: '255, 196, 107' },
        sec: { name: 'Seguridad', c: '255, 138, 138' },
        tools: { name: 'Herramientas', c: '163, 168, 182' }
    };
    const ELEMENTS = [
        ['Py', 'Python', 'lang', 'Mi lenguaje principal, a nivel avanzado: backend, datos y automatización.', ['SmartBits · backend y herramientas internas', 'Icon Group · ETL con Pandas', 'Curso de Python avanzado y Django']],
        ['Js', 'JavaScript', 'lang', 'La base de todo el frontend interactivo que construyo.', ['TraineX, Nucleus y SponsorD', 'SmartBits · interfaces web']],
        ['Ts', 'TypeScript', 'lang', 'Tipado estricto para frontends grandes y mantenibles.', ['TraineX · Next.js', 'Nucleus · Angular']],
        ['Sq', 'SQL', 'lang', 'Consultas para estructurar y analizar datos en MySQL y PostgreSQL.', ['Icon Group · análisis de datos empresariales', 'APIs con FastAPI y Django']],
        ['Ht', 'HTML5', 'lang', 'Maquetación semántica y accesible.', ['Todos mis proyectos web', 'Este portfolio']],
        ['Cs', 'CSS3', 'lang', 'Interfaces fieles a Figma, animaciones y diseño responsive.', ['Este portfolio', 'SmartBits · componentes reutilizables']],

        ['Re', 'React', 'front', 'Componentes reutilizables y aplicaciones rápidas.', ['SmartBits · nuevas funcionalidades', 'SponsorD', 'TraineX']],
        ['Nx', 'Next.js', 'front', 'React con renderizado en servidor, listo para producción.', ['TraineX', 'SmartBits']],
        ['Ng', 'Angular', 'front', 'Aplicaciones empresariales bien estructuradas con TypeScript.', ['Nucleus', 'Icon Group · interfaces dinámicas', 'SmartBits']],
        ['Fg', 'Figma', 'front', 'Del prototipo al código, manteniendo la fidelidad al diseño.', ['SmartBits · prototipos convertidos en componentes']],

        ['Fa', 'FastAPI', 'back', 'APIs en Python rápidas, tipadas y documentadas.', ['SmartBits · backend', 'Icon Group · APIs']],
        ['Dj', 'Django REST', 'back', 'APIs robustas con Django REST Framework.', ['SmartBits · backend', 'Curso de Python avanzado y Django']],
        ['No', 'Node.js', 'back', 'JavaScript en el servidor para servicios y tooling.', ['Bootcamp Full Stack · Upgrade Hub']],
        ['Ns', 'Nest.js', 'back', 'Backend en Node con arquitectura modular.', ['Bootcamp Full Stack · Upgrade Hub']],
        ['Ap', 'APIs REST', 'back', 'Diseño e integración de APIs REST con terceros.', ['Icon Group · Salesforce y ServiceNow', 'SmartBits · APIs de LLMs']],

        ['Oa', 'OpenAI API', 'ai', 'Integración de modelos GPT en productos reales.', ['SmartBits · automatización de procesos internos']],
        ['Cl', 'Claude', 'ai', 'API de Anthropic y Claude Code en el trabajo diario.', ['SmartBits · integración y desarrollo asistido', 'Cursos de Santiago Hernández']],
        ['Lc', 'LangChain', 'ai', 'Orquestación de LLMs con herramientas y memoria.', ['Curso de agentes de IA con Python']],
        ['Lg', 'LangGraph', 'ai', 'Agentes con flujos de estado modelados como grafos.', ['Curso de agentes de IA con Python']],
        ['Cr', 'CrewAI', 'ai', 'Equipos de agentes que colaboran en una misma tarea.', ['Curso de agentes de IA con Python']],
        ['Rg', 'RAG', 'ai', 'Respuestas basadas en información recuperada de tus propios datos.', ['Proyectos de agentes de IA']],
        ['Pe', 'Prompt Engineering', 'ai', 'Instrucciones claras y evaluables para los modelos.', ['SponsorD · emails generados con LLMs', 'SmartBits']],
        ['Sa', 'Subagentes', 'ai', 'Herramientas autónomas propias: plugins, hooks y skills.', ['SmartBits · escaneo de vulnerabilidades']],

        ['Pd', 'Pandas', 'data', 'Limpieza y transformación de datos en Python.', ['Icon Group · ETL de Excel y CSV']],
        ['Et', 'ETL', 'data', 'Pipelines de extracción, transformación y carga, cuidando la calidad del dato.', ['Icon Group']],
        ['Pg', 'PostgreSQL', 'data', 'Base de datos relacional para productos en producción.', ['Proyectos full stack']],
        ['My', 'MySQL', 'data', 'Modelado relacional y consultas.', ['API REST de gestión de usuarios · FastAPI + MySQL']],
        ['Mg', 'MongoDB', 'data', 'Base de datos documental para datos flexibles.', ['Bootcamp Full Stack · Upgrade Hub']],
        ['Sf', 'Salesforce', 'data', 'Sincronización de activos de datos críticos vía API REST.', ['Icon Group · Healthcare Solutions']],
        ['Sn', 'ServiceNow', 'data', 'Integración de procesos vía API REST.', ['Icon Group · Healthcare Solutions']],

        ['Au', 'Auditoría de código', 'sec', 'Revisión y securización de aplicaciones que ya están en producción.', ['SmartBits']],
        ['Vs', 'Escaneo de vulnerabilidades', 'sec', 'Escaneos automatizados y mitigación de riesgos.', ['SmartBits · herramientas propias']],
        ['Jw', 'JWT', 'sec', 'Autenticación con tokens firmados.', ['APIs con FastAPI y Django']],
        ['O2', 'OAuth2', 'sec', 'Autorización delegada y control de accesos.', ['APIs y productos web']],
        ['Lx', 'Linux', 'sec', 'Sistemas, terminal y hacking ético.', ['Curso de Linux y Hacking Ético · S4vitar']],

        ['Gt', 'Git', 'tools', 'Control de versiones en todos mis proyectos.', ['Todos mis proyectos']],
        ['Gh', 'GitHub', 'tools', 'Repositorios, revisión de código y publicación.', ['github.com/AlberCf', 'Este portfolio · GitHub Pages']],
        ['Dk', 'Docker', 'tools', 'Entornos reproducibles para desarrollar y desplegar.', ['Proyectos backend']],
        ['Ci', 'CI/CD', 'tools', 'Integración y despliegue continuos.', ['Despliegues en Vercel y GitHub Pages']],
        ['Cc', 'Claude Code', 'tools', 'Desarrollo asistido por IA y Spec-Driven Development.', ['SmartBits', 'Cursos de Santiago Hernández']],
        ['Cu', 'Cursor', 'tools', 'Editor con IA para refactorizar más rápido.', ['SmartBits · refactorización de aplicaciones legadas']],
        ['Ws', 'Windsurf', 'tools', 'Editor con IA para el trabajo diario.', ['SmartBits']],
        ['Cp', 'GitHub Copilot', 'tools', 'Autocompletado inteligente mientras programo.', ['Desarrollo diario']],
        ['Ag', 'Antigravity', 'tools', 'Entorno de desarrollo agéntico.', ['Desarrollo con IA']]
    ];

    const ptGrid = document.getElementById('pt-grid');
    const ptFilters = document.getElementById('pt-filters');
    if (ptGrid && ptFilters) {
        const pad = (n) => String(n).padStart(2, '0');
        const detail = {
            box: document.getElementById('pt-detail'),
            num: document.getElementById('ptd-num'),
            symSm: document.getElementById('ptd-sym-sm'),
            sym: document.getElementById('ptd-sym'),
            name: document.getElementById('ptd-name'),
            fam: document.getElementById('ptd-fam'),
            desc: document.getElementById('ptd-desc'),
            used: document.getElementById('ptd-used')
        };
        let pinned = 0;

        const show = (i) => {
            const [sym, name, fam, desc, used] = ELEMENTS[i];
            detail.box.style.setProperty('--c', FAMILIES[fam].c);
            detail.num.textContent = `Nº ${pad(i + 1)}`;
            detail.symSm.textContent = sym;
            detail.sym.textContent = sym;
            detail.name.textContent = name;
            detail.fam.textContent = FAMILIES[fam].name;
            detail.desc.textContent = desc;
            detail.used.replaceChildren(...used.map((u, k) => {
                const li = document.createElement('li');
                const n = document.createElement('span');
                n.textContent = pad(k + 1);
                li.append(n, document.createTextNode(u));
                return li;
            }));
        };

        const tiles = ELEMENTS.map(([sym, name, fam], i) => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'pt-el';
            b.setAttribute('role', 'listitem');
            b.dataset.fam = fam;
            b.style.setProperty('--c', FAMILIES[fam].c);
            b.setAttribute('aria-label', `${name}, ${FAMILIES[fam].name}`);
            b.innerHTML = `<span class="n">${pad(i + 1)}</span><span class="s">${sym}</span><span class="nm">${name}</span><span class="f">${FAMILIES[fam].name}</span>`;
            b.addEventListener('mouseenter', () => show(i));
            b.addEventListener('focus', () => show(i));
            b.addEventListener('click', () => {
                tiles[pinned].classList.remove('current');
                pinned = i;
                b.classList.add('current');
                show(i);
            });
            ptGrid.appendChild(b);
            return b;
        });
        ptGrid.addEventListener('mouseleave', () => show(pinned));
        tiles[0].classList.add('current');
        show(0);

        const total = document.getElementById('pt-total');
        if (total) total.textContent = ELEMENTS.length;

        const counts = ELEMENTS.reduce((acc, [, , f]) => ({ ...acc, [f]: (acc[f] || 0) + 1 }), {});
        const filters = [['all', 'Todos', ELEMENTS.length], ...Object.entries(FAMILIES).map(([k, v]) => [k, v.name, counts[k]])];
        filters.forEach(([key, label, count], idx) => {
            const chip = document.createElement('button');
            chip.type = 'button';
            chip.className = 'pt-chip' + (idx === 0 ? ' active' : '');
            chip.setAttribute('aria-pressed', String(idx === 0));
            chip.innerHTML = `${label} <small>${count}</small>`;
            chip.addEventListener('click', () => {
                ptFilters.querySelectorAll('.pt-chip').forEach(c => {
                    c.classList.toggle('active', c === chip);
                    c.setAttribute('aria-pressed', String(c === chip));
                });
                tiles.forEach(t => t.classList.toggle('dim', key !== 'all' && t.dataset.fam !== key));
                if (key !== 'all') {
                    const first = ELEMENTS.findIndex(([, , f]) => f === key);
                    tiles[pinned].classList.remove('current');
                    pinned = first;
                    tiles[first].classList.add('current');
                    show(first);
                }
            });
            ptFilters.appendChild(chip);
        });
    }

    // Acordeón de proyectos
    const accItems = [...document.querySelectorAll('.acc-item')];
    accItems.forEach(item => {
        item.querySelector('.acc-tab').addEventListener('click', () => {
            const isOpen = item.classList.contains('open');
            const vertical = window.matchMedia('(max-width: 980px)').matches;
            if (isOpen && !vertical) return;
            accItems.forEach(other => {
                const open = other === item ? !isOpen : false;
                other.classList.toggle('open', open);
                other.querySelector('.acc-tab').setAttribute('aria-expanded', String(open));
            });
        });
    });

    // Línea de tiempo que se dibuja al hacer scroll
    const timeline = document.getElementById('timeline');
    const tlFill = document.getElementById('tl-fill');
    if (timeline && tlFill) {
        const tlItems = [...timeline.querySelectorAll('.tl-item')];
        const drawTimeline = () => {
            const r = timeline.getBoundingClientRect();
            const trigger = window.innerHeight * 0.62;
            const p = Math.min(Math.max((trigger - r.top) / r.height, 0), 1);
            tlFill.style.transform = `scaleY(${p})`;
            tlItems.forEach(it => {
                const dot = it.querySelector('.tl-dot').getBoundingClientRect();
                it.classList.toggle('on', dot.top < trigger);
            });
        };
        window.addEventListener('scroll', drawTimeline, { passive: true });
        window.addEventListener('resize', drawTimeline);
        drawTimeline();
    }

    // Copiar email
    const copyBtn = document.getElementById('copy-mail');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(copyBtn.dataset.mail);
                copyBtn.textContent = 'Copiado';
            } catch {
                copyBtn.textContent = 'Selecciona y copia';
            }
            copyBtn.classList.add('done');
            setTimeout(() => {
                copyBtn.textContent = 'Copiar';
                copyBtn.classList.remove('done');
            }, 2000);
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
