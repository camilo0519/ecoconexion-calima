/**
 * Eco Conexión - Lógica de UI
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Header Sticky & Cambio de Color ---
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // --- 2. Menú Móvil ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    mobileBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Cerrar menú al hacer click en un enlace
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // --- 3. Sistema de Modales (Itinerarios) ---
    const modalBase = document.getElementById('modal-base');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = document.querySelector('.close-modal');

    // Data de los itinerarios (simulando una base de datos)
    const itinerariesData = {
        'modal-calima': `
            <div class="modal-body-content">
                <h2>Itinerario: PAQUETE CALIMA (3 Días)</h2>
                <div class="modal-day">
                    <h4>Día 1: Cultura y paisaje</h4>
                    <p>1:00 PM - 2:00 PM: Check In en alojamiento.</p>
                    <p>2:00 PM - 3:00 PM: Recorrido por Pueblo Mágico.</p>
                    <p>3:00 PM - 4:00 PM: Visita al Museo Arqueológico.</p>
                    <p>4:00 PM - 6:00 PM: Atardecer en Mirador Guadualito.</p>
                </div>
                <div class="modal-day">
                    <h4>Día 2: Agua y naturaleza</h4>
                    <p>7:30 AM: Desayuno local.</p>
                    <p>9:00 AM: Práctica de Paddle en el Lago Calima.</p>
                    <p>10:30 AM: Visita al Muro de la Represa.</p>
                    <p>11:00 AM: Aventura en Cascada Rio Bravo.</p>
                    <p>1:00 PM: Almuerzo tradicional.</p>
                    <p>3:15 PM: Paseo relajante en Pontón.</p>
                </div>
                <div class="modal-day">
                    <h4>Día 3: Senderismo y bienestar</h4>
                    <p>9:15 AM: Caminata hacia Mirador el Castillo.</p>
                    <p>10:30 AM: Caminata consciente y Baño de Bosque.</p>
                    <p>11:00 AM: Visita a Cascada el Caimo y Encanto.</p>
                    <p>1:30 PM: Almuerzo de despedida.</p>
                </div>
            </div>
        `,
        'modal-lago-rio': `
            <div class="modal-body-content">
                <h2>Itinerario: LAGO Y RIO BRAVO (2 Días)</h2>
                <div class="modal-day">
                    <h4>Día 1: Cultura y Agua</h4>
                    <p>Check In y recorrido Pueblo Mágico.</p>
                    <p>Museo Arqueológico y Mirador Guadualito.</p>
                    <p>Paddle (1h) y Paseo en Pontón (40 Min).</p>
                </div>
                <div class="modal-day">
                    <h4>Día 2: Naturaleza Profunda</h4>
                    <p>Visita Muro Represa.</p>
                    <p>Cascada Rio Bravo.</p>
                    <p>Práctica de Shinrin-Yoku (Baño de Bosque).</p>
                </div>
            </div>
        `,
        'modal-cascadas': `
            <div class="modal-body-content">
                <h2>Itinerario: LAS 12 CASCADAS DEL DUENDE (2 Días)</h2>
                <div class="modal-day">
                    <h4>Día 1: Inmersión y Wellness</h4>
                    <p>Caminata Ecológica Consciente.</p>
                    <p>Baño de Bosque inicial.</p>
                    <p>Inicio del circuito de cascadas (Primeras 5).</p>
                </div>
                <div class="modal-day">
                    <h4>Día 2: Aventura Oculta</h4>
                    <p>Mirador el Castillo y Río Calima.</p>
                    <p>Continuación del circuito (Resto de cascadas).</p>
                    <p>Visita estelar: Cascadas el Caimo y el Encanto.</p>
                </div>
            </div>
        `
    };

    // Función global para abrir modal (se llama desde el HTML onClick)
    window.openModal = function(modalId) {
        // Inyectar el HTML correspondiente
        if(itinerariesData[modalId]) {
            modalBody.innerHTML = itinerariesData[modalId];
            modalBase.style.display = 'block';
            // Pequeño delay para que la transición CSS funcione (opacity)
            setTimeout(() => {
                modalBase.classList.add('show');
            }, 10);
            // Bloquear scroll de la página
            document.body.style.overflow = 'hidden';
        }
    };

    // Cerrar modal al hacer click en la "X"
    closeBtn.addEventListener('click', closeModal);

    // Cerrar modal al hacer click fuera del contenido (background oscuro)
    window.addEventListener('click', (event) => {
        if (event.target === modalBase) {
            closeModal();
        }
    });

    // Función para cerrar modal y limpiar
    function closeModal() {
        modalBase.classList.remove('show');
        // Esperar a que termine la transición de opacidad para ocultar
        setTimeout(() => {
            modalBase.style.display = 'none';
            document.body.style.overflow = 'auto'; // Restaurar scroll
        }, 300);
    }
});
