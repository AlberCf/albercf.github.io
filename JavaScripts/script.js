document.addEventListener('DOMContentLoaded', () => {
    
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');
    const navItems = document.querySelectorAll('.nav-item, .btn-primary');

    // Menú móvil
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Cerrar al clickar
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if(window.innerWidth <= 768) { // Solo en móvil
                navLinks.classList.remove('active');
                const icon = menuToggle.querySelector('i');
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    });

    // Reveal on Scroll
    const revealElements = document.querySelectorAll('.section, .project-card, .skill-card');
    
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 100;

        revealElements.forEach((el) => {
            const elementTop = el.getBoundingClientRect().top;
            if (elementTop < windowHeight - elementVisible) {
                el.style.opacity = "1";
                el.style.transform = "translateY(0)";
            }
        });
    };

    // Init styles for reveal
    revealElements.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(30px)";
        el.style.transition = "all 0.6s ease-out";
    });

    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll();
});

// --- 4. FORMULARIO AJAX (Versión FormData - Más estable) ---
const contactForm = document.getElementById('contact-form');
const formStatus = document.getElementById('form-status');

if (contactForm) {
    contactForm.addEventListener('submit', async function(event) {
        event.preventDefault(); // Evita redirección

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        
        // 1. Feedback visual inmediato
        submitBtn.innerText = 'Enviando...';
        submitBtn.disabled = true;
        formStatus.style.display = 'none'; // Ocultar mensajes previos
        formStatus.className = 'form-status'; // Resetear clases

        // 2. Preparar los datos (FormData es más seguro que JSON)
        const formData = new FormData(contactForm);

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: formData,
                headers: { 
                    'Accept': 'application/json' 
                    // NO ponemos Content-Type, el navegador lo pone automático con FormData
                }
            });

            if (response.ok) {
                // ÉXITO
                formStatus.innerText = "¡Mensaje enviado! Gracias por contactar.";
                formStatus.className = "form-status success"; 
                formStatus.style.display = 'block';
                contactForm.reset(); // Limpia los campos
            } else {
                // ERROR DE FORMSPREE
                const data = await response.json();
                if (Object.hasOwn(data, 'errors')) {
                    formStatus.innerText = data["errors"].map(error => error["message"]).join(", ");
                } else {
                    formStatus.innerText = "Hubo un problema al enviar el mensaje.";
                }
                formStatus.className = "form-status error";
                formStatus.style.display = 'block';
            }
        } catch (error) {
            // ERROR DE RED
            console.error("Error de envío:", error);
            formStatus.innerText = "Error de conexión. Revisa tu internet.";
            formStatus.className = "form-status error";
            formStatus.style.display = 'block';
        } finally {
            // Restaurar botón
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            
            // Ocultar mensaje de éxito a los 5 seg
            if (formStatus.classList.contains('success')) {
                setTimeout(() => {
                    formStatus.style.display = 'none';
                }, 5000);
            }
        }
    });
}