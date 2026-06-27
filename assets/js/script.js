/**
 * Eco Conexión Calima - Lógica del Buscador, Catálogo Dinámico y Motor de Reservas (Airbnb Style)
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Cargar base de datos desde MySQL
    await window.BookingData.init();

    // Cargar datos de Colombia y asignarlos globalmente
    try {
        const response = await fetch('assets/js/colombia-data.json');
        window.colombiaData = await response.json();
    } catch (e) {
        console.error("Error al cargar colombia-data.json:", e);
    }

    // --- 1. Header Sticky & Cambio de Color ---
    const header = document.getElementById('main-header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // --- 2. Menú Móvil ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // --- 3. Sistema de Acordeón FAQ ---
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.parentElement;
            const answer = faqItem.querySelector('.faq-answer');
            const isActive = faqItem.classList.contains('active');

            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
                item.querySelector('.faq-answer').style.maxHeight = null;
            });

            if (!isActive) {
                faqItem.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // ==========================================================================
    // LÓGICA DEL MOTOR DE BÚSQUEDA Y RESERVAS
    // ==========================================================================

    // Referencias HTML del Buscador y Grilla
    const searchForm = document.getElementById('airbnb-search-bar');
    const explorerGrid = document.getElementById('explorer-grid-container');
    const categoryTabsContainer = document.getElementById('category-tabs-list');
    const noResultsMsg = document.getElementById('no-results-msg');
    const bookingPageHost = document.getElementById('booking-page-wizard-host');
    const searchDateInput = document.getElementById('search-date');
    const searchCheckinInput = document.getElementById('search-checkin');
    const searchCheckoutInput = document.getElementById('search-checkout');

    // Estado global de filtrado
    const initialCatalogCategory = document.body.dataset.catalogCategory || 'todos';
    const catalogMode = document.body.dataset.catalogMode || 'full';
    let currentCategoryFilter = initialCatalogCategory;
    let searchQuery = '';
    let searchGuestsFilter = 2;
    let searchDateFilter = '';
    let searchCheckinFilter = '';
    let searchCheckoutFilter = '';

    const syncActiveCategoryTab = () => {
        document.querySelectorAll('.category-tab-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.category === currentCategoryFilter);
        });
    };

    const scrollToExplorer = () => {
        const explorerSection = document.getElementById('explorar');
        if (explorerSection) {
            explorerSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const applyCategoryFilter = (categoryKey) => {
        currentCategoryFilter = categoryKey;
        const searchCategorySelect = document.getElementById('search-category');
        if (searchCategorySelect && window.BookingData.CATEGORIES[categoryKey]) {
            searchCategorySelect.value = categoryKey;
        }
        syncActiveCategoryTab();
        renderCatalog();
    };

    // Inicializar catálogo y pestañas de categorías
    const initExplorer = () => {
        const searchCategorySelect = document.getElementById('search-category');

        // 1. Renderizar pestañas
        if (categoryTabsContainer) {
            categoryTabsContainer.innerHTML = '';
            Object.entries(window.BookingData.CATEGORIES).forEach(([key, value]) => {
                const btn = document.createElement('button');
                btn.className = `category-tab-btn ${key === currentCategoryFilter ? 'active' : ''}`;
                btn.dataset.category = key;
                btn.innerHTML = `<span>${value.icon}</span> ${value.label}`;

                btn.addEventListener('click', () => {
                    applyCategoryFilter(key);
                });

                categoryTabsContainer.appendChild(btn);
            });
        }

        if (searchCategorySelect && window.BookingData.CATEGORIES[currentCategoryFilter]) {
            searchCategorySelect.value = currentCategoryFilter;
        }

        // 2. Renderizar grilla inicial
        renderCatalog();

        // 3. Listener del formulario de búsqueda
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const categorySelect = document.getElementById('search-category');
                searchQuery = document.getElementById('search-input').value.trim().toLowerCase();
                currentCategoryFilter = categorySelect ? categorySelect.value : initialCatalogCategory;
                searchGuestsFilter = parseInt(document.getElementById('search-guests').value);
                searchDateFilter = searchDateInput ? searchDateInput.value : '';
                searchCheckinFilter = searchCheckinInput ? searchCheckinInput.value : '';
                searchCheckoutFilter = searchCheckoutInput ? searchCheckoutInput.value : '';

                // Sincronizar estado visual de las pestañas
                syncActiveCategoryTab();
                renderCatalog();
                scrollToExplorer();
            });
        }

        document.querySelectorAll('[data-service-filter]').forEach((link) => {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const categoryKey = link.getAttribute('data-service-filter');
                if (!categoryKey) return;

                applyCategoryFilter(categoryKey);
                scrollToExplorer();
            });
        });
    };

    const buildBookingPageUrl = (productId) => {
        const params = new URLSearchParams({ product: productId });

        if (searchGuestsFilter) {
            params.set('guests', String(searchGuestsFilter));
        }

        if (searchDateFilter) {
            params.set('date', searchDateFilter);
        }

        if (searchCheckinFilter) {
            params.set('checkin', searchCheckinFilter);
        }

        if (searchCheckoutFilter) {
            params.set('checkout', searchCheckoutFilter);
        }

        return `booking.html?${params.toString()}`;
    };

    const getBookingWizardMarkup = (product, today, tomorrow, formatDate) => `
            <div class="booking-engine-wizard">
                ${bookingRenderMode === 'modal' ? `
                <div class="booking-wizard-header">
                    <div>
                        <div class="booking-wizard-kicker">Reserva guiada</div>
                        <h2 class="booking-wizard-title">Reservar <span>${product.title}</span></h2>
                        <p class="booking-wizard-subtitle">Completa tu solicitud en pocos pasos. Ajusta fechas, servicios y datos de contacto antes de confirmar.</p>
                    </div>
                    <div class="booking-wizard-chip">
                        <strong>Capacidad máxima</strong>
                        <span>${product.maxGuests} personas por reserva</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="wizard-steps-header">
                    <div class="wizard-step active" id="w-step-ind-1">
                        <div class="step-num">1</div>
                        <span>Fechas</span>
                    </div>
                    <div class="wizard-step-line"></div>
                    <div class="wizard-step" id="w-step-ind-2">
                        <div class="step-num">2</div>
                        <span>Servicios</span>
                    </div>
                    <div class="wizard-step-line"></div>
                    <div class="wizard-step" id="w-step-ind-3">
                        <div class="step-num">3</div>
                        <span>Contacto</span>
                    </div>
                    <div class="wizard-step-line"></div>
                    <div class="wizard-step" id="w-step-ind-4">
                        <div class="step-num">4</div>
                        <span>Resumen</span>
                    </div>
                </div>
                
                <div class="wizard-step-content active" id="w-step-1">
                    <h3>Selecciona tus fechas y acompañantes</h3>
                    <p class="wizard-step-lead">Define cuándo viajas y cuántas personas asistirán para calcular la disponibilidad y el valor de tu reserva.</p>
                    <div class="wizard-card">
                    <div class="wizard-fields-grid">
                        <div class="wizard-field-card ${product.priceType === 'night' ? '' : 'hidden'}" id="checkin-group" style="display: ${product.priceType === 'night' ? 'flex' : 'none'};">
                            <label>Fecha de Entrada (Check-in)</label>
                            <input type="date" id="w-checkin" value="${checkoutState.checkin}" min="${formatDate(today)}">
                            <span class="wizard-field-note">Selecciona el día en que llegarás al alojamiento.</span>
                        </div>
                        <div class="wizard-field-card ${product.priceType === 'night' ? '' : 'hidden'}" id="checkout-group" style="display: ${product.priceType === 'night' ? 'flex' : 'none'};">
                            <label>Fecha de Salida (Check-out)</label>
                            <input type="date" id="w-checkout" value="${checkoutState.checkout}" min="${formatDate(tomorrow)}">
                            <span class="wizard-field-note">La salida debe ser posterior a la fecha de entrada.</span>
                        </div>
                        <div class="wizard-field-card full ${product.priceType === 'person' ? '' : 'hidden'}" id="singledate-group" style="display: ${product.priceType === 'person' ? 'flex' : 'none'};">
                            <label>Fecha de la Experiencia</label>
                            <input type="date" id="w-singledate" value="${checkoutState.singleDate}" min="${formatDate(today)}">
                            <span class="wizard-field-note">Ideal para pasadías, tours o deportes con fecha única.</span>
                        </div>
                        <div class="wizard-field-card">
                            <div class="wizard-counter-head">
                                <label>Adultos</label>
                                <span class="wizard-counter-badge">Obligatorio</span>
                            </div>
                            <div class="number-picker">
                                <button type="button" class="np-btn" id="btn-adults-dec">-</button>
                                <span class="np-value" id="lbl-adults">${checkoutState.guests}</span>
                                <button type="button" class="np-btn" id="btn-adults-inc">+</button>
                            </div>
                            <span class="wizard-field-note">Debe haber al menos un adulto por reserva.</span>
                        </div>
                        <div class="wizard-field-card">
                            <label>Niños (4-10 años)</label>
                            <div class="number-picker">
                                <button type="button" class="np-btn" id="btn-child-dec">-</button>
                                <span class="np-value" id="lbl-child">${checkoutState.children}</span>
                                <button type="button" class="np-btn" id="btn-child-inc">+</button>
                            </div>
                            <span class="wizard-field-note">Niños de 0 a 3 años ingresan gratis y no cuentan en este selector.</span>
                        </div>
                    </div>
                    </div>
                    <div class="wizard-footer" style="${bookingRenderMode === 'inline' ? 'display: flex; justify-content: space-between;' : ''}">
                        ${bookingRenderMode === 'inline' ? '<button type="button" class="btn btn-outline wizard-btn" id="w-btn-cancel-inline">← Volver a detalles</button>' : ''}
                        <button type="button" class="btn btn-gold wizard-btn w-next-btn" id="w-btn-goto-2" style="${bookingRenderMode === 'inline' ? 'flex-grow: 0;' : ''}">Siguiente paso →</button>
                    </div>
                </div>

                <div class="wizard-step-content" id="w-step-2" style="display: none;">
                    <h3>Personaliza tu experiencia</h3>
                    <p class="wizard-step-lead">Agrega servicios complementarios para mejorar la estancia o la actividad seleccionada.</p>
                    <div class="addons-list-container" id="w-addons-list"></div>
                    <div class="wizard-footer" style="display: flex; justify-content: space-between;">
                        <button class="btn btn-outline wizard-btn w-prev-btn" id="w-btn-back-1">← Atrás</button>
                        <button class="btn btn-gold wizard-btn w-next-btn" id="w-btn-goto-3">Siguiente paso →</button>
                    </div>
                </div>

                <div class="wizard-step-content" id="w-step-3" style="display: none;">
                    <h3>Datos del titular de la reserva</h3>
                    <p class="wizard-step-lead">Completa tus datos personales para confirmar la reserva. Toda la información es segura y confidencial.</p>
                    
                    <div class="personal-data-form">
                        <!-- Sección: Datos de Identidad -->
                        <div class="form-section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            Información Personal
                        </div>
                        <div class="personal-fields-grid">
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-firstname">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </span>
                                    Nombres <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="text" id="w-cust-firstname" required placeholder="Ej: Juan Camilo" autocomplete="given-name">
                            </div>
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-lastname">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                    </span>
                                    Apellidos <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="text" id="w-cust-lastname" required placeholder="Ej: Pérez García" autocomplete="family-name">
                            </div>
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-dob">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                    </span>
                                    Fecha de Nacimiento <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input pf-date" type="date" id="w-cust-dob" required>
                            </div>
                        </div>

                        <!-- Sección: Documento de Identidad -->
                        <div class="form-section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                            Documento de Identidad
                        </div>
                        <div class="personal-fields-grid">
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-doctype">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    </span>
                                    Tipo de Documento <span class="pf-required">*</span>
                                </label>
                                <select class="pf-input pf-select" id="w-cust-doctype" required>
                                    <option value="CC" selected>Cédula de Ciudadanía (CC)</option>
                                    <option value="CE">Cédula de Extranjería (CE)</option>
                                    <option value="Pasaporte">Pasaporte</option>
                                    <option value="TI">Tarjeta de Identidad (TI)</option>
                                    <option value="NIT">NIT (Persona Jurídica)</option>
                                </select>
                            </div>
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-docnum">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h4"/><path d="M7 12h10"/><path d="M7 16h6"/></svg>
                                    </span>
                                    Número de Documento <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="text" id="w-cust-docnum" required placeholder="Ej: 1012345678" inputmode="numeric">
                            </div>
                        </div>

                        <!-- Sección: Contacto -->
                        <div class="form-section-label">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.58 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6.29 6.29l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            Información de Contacto
                        </div>
                        <div class="personal-fields-grid">
                            <div class="personal-field-item">
                                <label class="pf-label" for="w-cust-phone">
                                    <span class="pf-icon pf-icon-green">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M11.95 2C6.448 2 2 6.448 2 11.95c0 1.862.518 3.6 1.421 5.082L2 22l5.104-1.397A9.9 9.9 0 0 0 11.95 22C17.452 22 22 17.552 22 11.95 22 6.448 17.452 2 11.95 2zm0 18.087a8.04 8.04 0 0 1-4.09-1.118l-.294-.174-3.028.828.844-3.003-.192-.31A8.07 8.07 0 0 1 3.913 11.95c0-4.43 3.607-8.037 8.037-8.037 4.43 0 8.037 3.607 8.037 8.037 0 4.43-3.607 8.037-8.037 8.037z"/></svg>
                                    </span>
                                    WhatsApp / Celular <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="tel" id="w-cust-phone" required placeholder="Ej: 312 345 6789" autocomplete="tel" inputmode="tel">
                            </div>
                            <div class="personal-field-item pf-full">
                                <label class="pf-label" for="w-cust-email">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                    </span>
                                    Correo Electrónico <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="email" id="w-cust-email" required placeholder="Ej: juan@correo.com" autocomplete="email" inputmode="email">
                            </div>

                            <!-- Sección: Ubicación de Residencia -->
                            <div class="personal-field-item pf-full" style="grid-column: 1 / -1; margin-top: 10px;">
                                <div class="form-section-label" style="margin-top: 5px; margin-bottom: 12px;">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                    Ubicación de Residencia
                                </div>
                            </div>
                            
                            <div class="personal-field-item pf-full">
                                <label class="pf-label" for="w-cust-country">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                                    </span>
                                    País de Residencia <span class="pf-required">*</span>
                                </label>
                                <select class="pf-input pf-select" id="w-cust-country" required>
                                    <option value="Colombia" selected>Colombia</option>
                                    <option value="" disabled>--- Otros Países ---</option>
                                </select>
                            </div>
                            
                            <div class="personal-field-item" id="w-dept-wrapper">
                                <label class="pf-label" for="w-cust-dept">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 20 10.2M22 22L16 16"/></svg>
                                    </span>
                                    Departamento <span class="pf-required">*</span>
                                </label>
                                <select class="pf-input pf-select" id="w-cust-dept">
                                    <option value="" disabled selected>Selecciona departamento</option>
                                </select>
                            </div>
                            
                            <div class="personal-field-item" id="w-city-wrapper">
                                <label class="pf-label" for="w-cust-city">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M19 21v-8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M14 2h-4L6 6h12z"/></svg>
                                    </span>
                                    Ciudad / Municipio <span class="pf-required">*</span>
                                </label>
                                <select class="pf-input pf-select" id="w-cust-city">
                                    <option value="" disabled selected>Selecciona municipio</option>
                                </select>
                            </div>
                            
                            <div class="personal-field-item pf-full" id="w-foreign-city-wrapper" style="display: none;">
                                <label class="pf-label" for="w-cust-foreign-city">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M19 21v-8a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v8M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4M14 2h-4L6 6h12z"/></svg>
                                    </span>
                                    Ciudad Extranjera <span class="pf-required">*</span>
                                </label>
                                <input class="pf-input" type="text" id="w-cust-foreign-city" placeholder="Ej: Miami, Florida">
                            </div>

                            <div class="personal-field-item pf-full">
                                <label class="pf-label" for="w-cust-notes">
                                    <span class="pf-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                    </span>
                                    Notas adicionales <span class="pf-optional">(Opcional)</span>
                                </label>
                                <textarea class="pf-input pf-textarea" id="w-cust-notes" rows="3" placeholder="Ej: Alergias, llegamos al mediodía, decoración sorpresa, petición especial..."></textarea>
                            </div>
                        </div>

                        <div class="pf-privacy-note">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            Tus datos están protegidos y solo se usan para gestionar tu reserva.
                        </div>
                    </div>

                    <div class="wizard-footer" style="display: flex; justify-content: space-between;">
                        <button class="btn btn-outline wizard-btn w-prev-btn" id="w-btn-back-2">← Atrás</button>
                        <button class="btn btn-gold wizard-btn w-next-btn" id="w-btn-goto-4">
                            Ver resumen →
                        </button>
                    </div>
                </div>

                <div class="wizard-step-content" id="w-step-4" style="display: none;">
                    <p class="wizard-step-lead">Revisa el valor estimado, confirma los datos del viaje y elige cómo quieres continuar con tu reserva.</p>
                    <div class="booking-summary-receipt" id="w-receipt-container"></div>
                    <div class="payment-actions">
                        <button class="btn btn-outline" id="w-btn-whatsapp" style="flex: 1; border-color: #25d366; color: #25d366; display: flex; align-items: center; justify-content: center; gap: 8px;">
                            <svg width="18" height="18" fill="currentColor" viewBox="0 0 448 512"><path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>
                            Reservar por WhatsApp
                        </button>
                        <button class="btn btn-gold wizard-btn" id="w-btn-gateway" style="flex: 1;">
                            Pago seguro en línea
                        </button>
                    </div>
                    <div class="wizard-footer" style="display: flex; justify-content: flex-start;">
                        <button class="btn btn-outline wizard-btn w-prev-btn" id="w-btn-back-3">← Atrás</button>
                    </div>
                </div>
            </div>
        `;

    // Renderizar grilla de tarjetas
    const renderCatalog = () => {
        if (!explorerGrid) return;

        let products = window.BookingData.getProducts();

        // Aplicar filtro de categoría
        if (currentCategoryFilter !== 'todos') {
            products = products.filter(p => p.category === currentCategoryFilter);
        }

        // Aplicar filtro de búsqueda de texto (nombre, subtítulo o comodidades)
        if (searchQuery) {
            products = products.filter(p =>
                p.title.toLowerCase().includes(searchQuery) ||
                p.subtitle.toLowerCase().includes(searchQuery) ||
                p.features.some(f => f.toLowerCase().includes(searchQuery))
            );
        }

        // Aplicar filtro de huéspedes
        products = products.filter(p => p.maxGuests >= searchGuestsFilter);

        if (catalogMode === 'featured') {
            products = products
                .sort((a, b) => {
                    if (b.rating !== a.rating) return b.rating - a.rating;
                    return b.reviewsCount - a.reviewsCount;
                })
                .slice(0, 6);
        }

        // Limpiar grilla
        explorerGrid.innerHTML = '';

        if (products.length === 0) {
            noResultsMsg.classList.remove('hidden');
            return;
        }

        noResultsMsg.classList.add('hidden');

        products.forEach(p => {
            const card = document.createElement('div');
            card.className = 'explorer-card';

            const featuresHtml = p.features.slice(0, 3).map(f => `<span class="card-feature-tag">${f}</span>`).join('');
            const ratingHtml = `⭐ ${p.rating.toFixed(1)} (${p.reviewsCount})`;

            card.innerHTML = `
                <div class="card-img-wrapper">
                    <img src="${p.image}" alt="${p.title}" loading="lazy">
                    <span class="card-category-badge">${p.category}</span>
                    <span class="card-rating-badge">${ratingHtml}</span>
                </div>
                <div class="card-details-wrapper">
                    <h3>${p.title}</h3>
                    <p class="card-subtitle">${p.subtitle}</p>
                    <div class="card-features-row">
                        ${featuresHtml}
                        ${p.features.length > 3 ? `<span class="card-feature-tag">+${p.features.length - 3} m&aacute;s</span>` : ''}
                    </div>
                    <div class="card-price-row">
                        <div class="price">
                            $${p.price.toLocaleString('es-CO')}
                            <span>/ ${p.priceType === 'night' ? 'noche' : 'persona'}</span>
                        </div>
                        <button class="cta-button btn-book-now" data-id="${p.id}" style="padding: 10px 20px; font-size: 0.9rem;">Reservar</button>
                    </div>
                </div>
            `;

            // Agregar evento de click al botón reservar
            card.querySelector('.btn-book-now').addEventListener('click', () => {
                window.location.href = buildBookingPageUrl(p.id);
            });

            explorerGrid.appendChild(card);
        });
    };

    // ==========================================================================
    // MULTI-STEP CHECKOUT WIZARD (PROCESADOR DE RESERVAS)
    // ==========================================================================
    const modalBase = document.getElementById('modal-base');
    const modalBody = document.getElementById('modal-body');
    const closeBtn = modalBase ? modalBase.querySelector('.close-modal') : null;
    let bookingRenderMode = 'modal';

    // Variables de estado del checkout actual
    let checkoutState = {
        product: null,
        guests: 2,
        children: 0,
        checkin: '',
        checkout: '',
        singleDate: '',
        addons: [],
        customer: { name: '', email: '', phone: '', notes: '' }
    };

    // Variables de estado del calendario interactivo
    let currentCalendarMonth = new Date();
    let renderInteractiveCalendar = () => {};

    const renderBookingWizard = (productId, mountNode, mode = 'modal') => {
        const product = window.BookingData.getProductById(productId);
        if (!product || !mountNode) return;

        bookingRenderMode = mode;

        checkoutState.product = product;
        checkoutState.guests = checkoutState.guests || searchGuestsFilter || 2;
        checkoutState.children = checkoutState.children || 0;
        checkoutState.addons = checkoutState.addons || [];

        // Establecer fechas sugeridas basadas en la búsqueda
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (d) => d.toISOString().split('T')[0];

        checkoutState.singleDate = checkoutState.singleDate || searchDateFilter || formatDate(today);
        checkoutState.checkin = checkoutState.checkin || searchCheckinFilter || searchDateFilter || formatDate(today);
        checkoutState.checkout = checkoutState.checkout || searchCheckoutFilter || formatDate(tomorrow);

        mountNode.innerHTML = getBookingWizardMarkup(product, today, tomorrow, formatDate);

        if (mode === 'modal' && modalBase) {
            modalBase.classList.add('booking-modal-open');
            modalBase.style.display = 'block';
            setTimeout(() => modalBase.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        }

        setupWizardListeners();
    };

    const openBookingWizard = (productId) => {
        renderBookingWizard(productId, modalBody, 'modal');
    };

    // Configurar controladores de eventos internos del Wizard
    const setupWizardListeners = () => {
        const product = checkoutState.product;
        if (!product) return;

        // Paises para el selector
        const countriesList = ["Afganistán", "Albania", "Alemania", "Andorra", "Angola", "Antigua y Barbuda", "Arabia Saudita", "Argelia", "Argentina", "Armenia", "Australia", "Austria", "Azerbaiyán", "Bahamas", "Bangladés", "Barbados", "Baréin", "Bélgica", "Belice", "Benín", "Bielorrusia", "Birmania", "Bolivia", "Bosnia y Herzegovina", "Botsuana", "Brasil", "Brunéi", "Bulgaria", "Burkina Faso", "Burundi", "Bután", "Cabo Verde", "Camboya", "Camerún", "Canadá", "Catar", "Chad", "Chile", "China", "Chipre", "Ciudad del Vaticano", "Comoras", "Corea del Norte", "Corea del Sur", "Costa de Marfil", "Costa Rica", "Croacia", "Cuba", "Dinamarca", "Dominica", "Ecuador", "Egipto", "El Salvador", "Emiratos Árabes Unidos", "Eritrea", "Eslovaquia", "Eslovenia", "España", "Estados Unidos", "Estonia", "Etiopía", "Filipinas", "Finlandia", "Fiyi", "Francia", "Gabón", "Gambia", "Georgia", "Ghana", "Granada", "Grecia", "Guatemala", "Guyana", "Guinea", "Guinea ecuatorial", "Guinea-Bisáu", "Haití", "Honduras", "Hungría", "India", "Indonesia", "Irak", "Irán", "Irlanda", "Islandia", "Israel", "Italia", "Jamaica", "Japón", "Jordania", "Kazajistán", "Kenia", "Kirguistán", "Kiribati", "Kuwait", "Laos", "Lesoto", "Letonia", "Líbano", "Liberia", "Libia", "Liechtenstein", "Lituania", "Luxemburgo", "Macedonia del Norte", "Madagascar", "Malasia", "Malaui", "Maldivas", "Malí", "Malta", "Marruecos", "Mauricio", "Mauritania", "México", "Micronesia", "Moldavia", "Mónaco", "Mongolia", "Montenegro", "Mozambique", "Namibia", "Nauru", "Nepal", "Nicaragua", "Níger", "Nigeria", "Noruega", "Nueva Zelanda", "Omán", "Países Bajos", "Pakistán", "Palaos", "Palestina", "Panamá", "Papúa Nueva Guinea", "Paraguay", "Perú", "Polonia", "Portugal", "Reino Unido", "República Centroafricana", "República Checa", "República del Congo", "República Democrática del Congo", "República Dominicana", "Ruanda", "Rumania", "Rusia", "Samoa", "San Cristóbal y Nieves", "San Marino", "San Vicente y las Granadinas", "Santa Lucía", "Santo Tomé y Príncipe", "Senegal", "Serbia", "Seychelles", "Sierra Leona", "Singapur", "Siria", "Somalia", "Sri Lanka", "Suazilandia", "Sudáfrica", "Sudán", "Sudán del Sur", "Suecia", "Suiza", "Surinam", "Tailandia", "Taiwán", "Tanzania", "Tayikistán", "Timor Oriental", "Togo", "Tonga", "Trinidad y Tobago", "Túnez", "Turkmenistán", "Turquía", "Tuvalu", "Ucrania", "Uganda", "Uruguay", "Uzbekistán", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Yibuti", "Zambia", "Zimbabue"];

        // Elementos de Ubicación
        const countrySelect = document.getElementById('w-cust-country');
        const deptSelect = document.getElementById('w-cust-dept');
        const citySelect = document.getElementById('w-cust-city');
        const deptWrapper = document.getElementById('w-dept-wrapper');
        const cityWrapper = document.getElementById('w-city-wrapper');
        const foreignCityWrapper = document.getElementById('w-foreign-city-wrapper');
        const foreignCityInput = document.getElementById('w-cust-foreign-city');

        if (countrySelect) {
            // Limpiar países anteriores si existieran
            while (countrySelect.options.length > 2) {
                countrySelect.remove(2);
            }
            countriesList.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                countrySelect.appendChild(opt);
            });

            // Lógica de cambio de país
            countrySelect.addEventListener('change', () => {
                if (countrySelect.value === 'Colombia') {
                    if (deptWrapper) deptWrapper.style.display = 'block';
                    if (cityWrapper) cityWrapper.style.display = 'block';
                    if (foreignCityWrapper) foreignCityWrapper.style.display = 'none';
                    if (foreignCityInput) foreignCityInput.value = '';
                } else {
                    if (deptWrapper) deptWrapper.style.display = 'none';
                    if (cityWrapper) cityWrapper.style.display = 'none';
                    if (foreignCityWrapper) foreignCityWrapper.style.display = 'block';
                    if (deptSelect) deptSelect.value = '';
                    if (citySelect) citySelect.innerHTML = '<option value="" disabled selected>Selecciona municipio</option>';
                }
            });
        }

        const populateDepts = () => {
            if (!deptSelect || !window.colombiaData) return;
            deptSelect.innerHTML = '<option value="" disabled selected>Selecciona departamento</option>';
            window.colombiaData.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.departamento;
                opt.textContent = d.departamento;
                deptSelect.appendChild(opt);
            });
        };

        if (deptSelect) {
            deptSelect.addEventListener('change', () => {
                const selectedDeptName = deptSelect.value;
                if (!citySelect || !window.colombiaData) return;

                citySelect.innerHTML = '<option value="" disabled selected>Selecciona municipio</option>';
                const deptObj = window.colombiaData.find(d => d.departamento === selectedDeptName);
                if (deptObj && deptObj.ciudades) {
                    deptObj.ciudades.forEach(c => {
                        const opt = document.createElement('option');
                        opt.value = c;
                        opt.textContent = c;
                        citySelect.appendChild(opt);
                    });
                }
            });
        }

        // Cargar departamentos e intentar restaurar estado previo
        populateDepts();

        if (checkoutState.customer) {
            if (checkoutState.customer.country) {
                if (countrySelect) {
                    countrySelect.value = checkoutState.customer.country;
                    countrySelect.dispatchEvent(new Event('change'));
                }
            }
            if (checkoutState.customer.department) {
                if (deptSelect) {
                    deptSelect.value = checkoutState.customer.department;
                    deptSelect.dispatchEvent(new Event('change'));
                }
            }
            if (checkoutState.customer.city) {
                if (checkoutState.customer.country === 'Colombia') {
                    if (citySelect) citySelect.value = checkoutState.customer.city;
                } else {
                    if (foreignCityInput) foreignCityInput.value = checkoutState.customer.city;
                }
            }
        }

        // Elementos interactivos del Paso 1
        const lblAdults = document.getElementById('lbl-adults');
        const lblChild = document.getElementById('lbl-child');

        document.getElementById('btn-adults-inc').addEventListener('click', () => {
            if (checkoutState.guests + checkoutState.children < product.maxGuests) {
                checkoutState.guests++;
                lblAdults.textContent = checkoutState.guests;
            }
        });

        document.getElementById('btn-adults-dec').addEventListener('click', () => {
            if (checkoutState.guests > 1) {
                checkoutState.guests--;
                lblAdults.textContent = checkoutState.guests;
            }
        });

        document.getElementById('btn-child-inc').addEventListener('click', () => {
            if (checkoutState.guests + checkoutState.children < product.maxGuests) {
                checkoutState.children++;
                lblChild.textContent = checkoutState.children;
            }
        });

        document.getElementById('btn-child-dec').addEventListener('click', () => {
            if (checkoutState.children > 0) {
                checkoutState.children--;
                lblChild.textContent = checkoutState.children;
            }
        });

        // Fechas de Alojamiento - Validaciones cruzadas
        if (product.priceType === 'night') {
            const inDate = document.getElementById('w-checkin');
            const outDate = document.getElementById('w-checkout');

            inDate.addEventListener('change', () => {
                const checkinVal = new Date(inDate.value);
                const checkoutVal = new Date(outDate.value);

                // Ajustar check-out mínimo al día siguiente del check-in
                const minCheckout = new Date(checkinVal);
                minCheckout.setDate(minCheckout.getDate() + 1);
                outDate.min = minCheckout.toISOString().split('T')[0];

                if (checkoutVal <= checkinVal) {
                    outDate.value = outDate.min;
                }
            });
        }

        // Navegación entre pasos
        const steps = ['1', '2', '3', '4'];

        const showStep = (stepNumber) => {
            steps.forEach(s => {
                const content = document.getElementById(`w-step-${s}`);
                const indicator = document.getElementById(`w-step-ind-${s}`);

                if (s === stepNumber) {
                    content.style.display = 'block';
                    indicator.classList.add('active');
                } else {
                    content.style.display = 'none';
                    if (parseInt(s) < parseInt(stepNumber)) {
                        indicator.classList.remove('active');
                        indicator.classList.add('completed');
                    } else {
                        indicator.classList.remove('active', 'completed');
                    }
                }
            });
        };

        if (bookingRenderMode === 'inline') {
            const cancelBtn = document.getElementById('w-btn-cancel-inline');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    const inlineContainer = document.getElementById('inline-wizard-container');
                    const detailsContent = document.getElementById('details-content');
                    if (inlineContainer && detailsContent) {
                        inlineContainer.style.opacity = '0';
                        setTimeout(() => {
                            inlineContainer.style.display = 'none';
                            detailsContent.style.display = 'block';

                            // Volver a mostrar barra inferior móvil si existe
                            const mobileBottomBar = document.getElementById('mobile-bottom-bar');
                            if (mobileBottomBar) {
                                mobileBottomBar.style.removeProperty('display');
                            }

                            setTimeout(() => {
                                detailsContent.style.opacity = '1';
                            }, 10);
                        }, 300);
                    }
                });
            }
        }

        // Paso 1 -> Paso 2
        document.getElementById('w-btn-goto-2').addEventListener('click', () => {
            // Guardar fechas
            if (product.priceType === 'night') {
                checkoutState.checkin = document.getElementById('w-checkin').value;
                checkoutState.checkout = document.getElementById('w-checkout').value;
            } else {
                checkoutState.singleDate = document.getElementById('w-singledate').value;
            }

            // Cargar y pintar adicionales
            renderAddonsStep();
            showStep('2');
        });

        // Paso 2 -> Paso 1
        document.getElementById('w-btn-back-1').addEventListener('click', () => {
            showStep('1');
        });

        // Paso 2 -> Paso 3
        document.getElementById('w-btn-goto-3').addEventListener('click', () => {
            showStep('3');
        });

        // Paso 3 -> Paso 2
        document.getElementById('w-btn-back-2').addEventListener('click', () => {
            showStep('2');
        });

        // Paso 3 -> Paso 4
        document.getElementById('w-btn-goto-4').addEventListener('click', () => {
            const firstNameInput = document.getElementById('w-cust-firstname');
            const lastNameInput = document.getElementById('w-cust-lastname');
            const emailInput = document.getElementById('w-cust-email');
            const phoneInput = document.getElementById('w-cust-phone');
            const docNumInput = document.getElementById('w-cust-docnum');
            const dobInput = document.getElementById('w-cust-dob');

            const countrySelect = document.getElementById('w-cust-country');
            const deptSelect = document.getElementById('w-cust-dept');
            const citySelect = document.getElementById('w-cust-city');
            const foreignCityInput = document.getElementById('w-cust-foreign-city');

            let selectedCountry = countrySelect ? countrySelect.value : 'Colombia';
            let selectedDept = '';
            let selectedCity = '';

            if (selectedCountry === 'Colombia') {
                selectedDept = deptSelect ? deptSelect.value : '';
                selectedCity = citySelect ? citySelect.value : '';
            } else {
                selectedCity = foreignCityInput ? foreignCityInput.value.trim() : '';
            }

            let requiredFields = [firstNameInput, lastNameInput, emailInput, phoneInput, docNumInput, dobInput];
            if (selectedCountry === 'Colombia') {
                if (deptSelect) requiredFields.push(deptSelect);
                if (citySelect) requiredFields.push(citySelect);
            } else {
                if (foreignCityInput) requiredFields.push(foreignCityInput);
            }

            let valid = true;
            requiredFields.forEach(input => {
                if (input && !input.value) {
                    valid = false;
                    input.style.borderColor = '#e57373';
                    input.style.boxShadow = '0 0 0 2px rgba(229, 115, 115, 0.25)';
                    const onFix = () => {
                        input.style.borderColor = '';
                        input.style.boxShadow = '';
                        input.removeEventListener('change', onFix);
                        input.removeEventListener('input', onFix);
                    };
                    input.addEventListener('change', onFix);
                    input.addEventListener('input', onFix);
                }
            });

            if (!valid) {
                alert('Por favor completa todos los campos obligatorios (*) antes de continuar.');
                return;
            }

            const docTypeEl = document.getElementById('w-cust-doctype');

            // Guardar todos los datos personales del titular
            checkoutState.customer = {
                firstName: firstNameInput.value.trim(),
                lastName: lastNameInput.value.trim(),
                name: `${firstNameInput.value.trim()} ${lastNameInput.value.trim()}`,
                docType: docTypeEl ? docTypeEl.value : 'CC',
                docNum: docNumInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                dob: dobInput.value,
                notes: document.getElementById('w-cust-notes').value.trim(),
                country: selectedCountry,
                department: selectedDept,
                city: selectedCity
            };

            // Renderizar resumen/recibo final
            renderReceiptStep();
            showStep('4');
        });

        // Paso 4 -> Paso 3
        document.getElementById('w-btn-back-3').addEventListener('click', () => {
            showStep('3');
        });
    };

    // Cargar adicionales dinámicos para el Paso 2
    const renderAddonsStep = () => {
        const addonsList = document.getElementById('w-addons-list');
        if (!addonsList) return;

        const product = checkoutState.product;
        addonsList.innerHTML = '';

        if (!product.addons || product.addons.length === 0) {
            addonsList.innerHTML = '<p style="color: var(--text-light); text-align: center; font-style: italic; padding: 20px;">No hay servicios adicionales para este plan.</p>';
            return;
        }

        product.addons.forEach(addonId => {
            const addon = window.BookingData.getAddonDetails(addonId);
            if (!addon) return;

            const isSelected = checkoutState.addons.includes(addonId);
            const addonCard = document.createElement('div');
            addonCard.className = `addon-card ${isSelected ? 'selected' : ''}`;
            addonCard.dataset.id = addonId;

            addonCard.innerHTML = `
                <div class="addon-left">
                    <input type="checkbox" class="addon-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="addon-details">
                        <h4>${addon.name}</h4>
                        <p>${addon.description}</p>
                    </div>
                </div>
                <div class="addon-right">
                    <div class="addon-price">+$${addon.price.toLocaleString('es-CO')}</div>
                    <div class="addon-type">${addon.type === 'person' ? 'por persona' : 'por reserva'}</div>
                </div>
            `;

            // Toggle select addon
            const toggleSelect = () => {
                const checkbox = addonCard.querySelector('.addon-checkbox');
                const index = checkoutState.addons.indexOf(addonId);

                if (index > -1) {
                    checkoutState.addons.splice(index, 1);
                    addonCard.classList.remove('selected');
                    checkbox.checked = false;
                } else {
                    checkoutState.addons.push(addonId);
                    addonCard.classList.add('selected');
                    checkbox.checked = true;
                }
            };

            addonCard.addEventListener('click', toggleSelect);
            addonCard.querySelector('.addon-checkbox').addEventListener('click', (e) => {
                e.stopPropagation(); // Evitar doble evento
                toggleSelect();
            });

            addonsList.appendChild(addonCard);
        });
    };

    const CATEGORY_GALLERY_FALLBACKS = {
        alojamiento: [
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop"
        ],
        pasadia: [
            "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1200&auto=format&fit=crop"
        ],
        deportes: [
            "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1517176118179-c5544777d0ca?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"
        ],
        paquetes: [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1486916856992-e4db22c8df33?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?q=80&w=1200&auto=format&fit=crop"
        ]
    };

    const updateStickyCalculator = () => {
        const product = checkoutState.product;
        if (!product) return;

        const guestsCount = parseInt(document.getElementById('w-card-guests').value, 10) || 2;
        checkoutState.guests = guestsCount;
        checkoutState.children = 0; // Se refina en el checkout modal

        let nights = 1;
        let baseTotal = 0;

        if (product.priceType === 'night') {
            const checkinVal = document.getElementById('w-card-checkin').value;
            const checkoutVal = document.getElementById('w-card-checkout').value;
            checkoutState.checkin = checkinVal;
            checkoutState.checkout = checkoutVal;

            if (checkinVal && checkoutVal) {
                const date1 = new Date(checkinVal);
                const date2 = new Date(checkoutVal);
                const diffTime = Math.abs(date2 - date1);
                nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
            }
            baseTotal = product.price * nights;
        } else {
            const singleDateVal = document.getElementById('w-card-singledate').value;
            checkoutState.singleDate = singleDateVal;
            baseTotal = product.price * guestsCount;
        }

        // Actualizar UI del cotizador en la tarjeta sticky
        const calcLabel = document.getElementById('breakdown-calc-label');
        const calcVal = document.getElementById('breakdown-calc-val');
        const totalVal = document.getElementById('breakdown-total-val');

        if (calcLabel) {
            if (product.priceType === 'night') {
                calcLabel.textContent = `$${product.price.toLocaleString('es-CO')} COP x ${nights} ${nights === 1 ? 'noche' : 'noches'}`;
            } else {
                calcLabel.textContent = `$${product.price.toLocaleString('es-CO')} COP x ${guestsCount} ${guestsCount === 1 ? 'persona' : 'personas'}`;
            }
        }
        if (calcVal) {
            calcVal.textContent = `$${baseTotal.toLocaleString('es-CO')} COP`;
        }
        if (totalVal) {
            totalVal.textContent = `$${baseTotal.toLocaleString('es-CO')} COP`;
        }

        // Sincronizar también con la barra móvil
        const mBarPriceAmount = document.getElementById('m-bar-price-amount');
        if (mBarPriceAmount) {
            mBarPriceAmount.textContent = `$${baseTotal.toLocaleString('es-CO')} COP`;
        }

        // Re-renderizar el calendario interactivo para reflejar cambios
        renderInteractiveCalendar();
    };

    const initBookingPage = () => {
        // Verificar si estamos en la página de reservas
        if (!document.body.classList.contains('booking-page')) return;

        const params = new URLSearchParams(window.location.search);
        const productId = params.get('product');
        const product = productId ? window.BookingData.getProductById(productId) : null;

        if (!product) {
            const container = document.querySelector('.airbnb-detail-container');
            if (container) {
                container.innerHTML = '<div class="booking-page-empty" style="text-align: center; padding: 100px 20px;"><h2>Servicio no encontrado</h2><p style="color: var(--text-light); margin-bottom: 25px;">No pudimos cargar la reserva solicitada. Regresa al catálogo y elige una experiencia disponible.</p><a href="index.html#explorar" class="btn btn-gold" style="padding: 12px 24px; border-radius: 8px;">Volver al catálogo</a></div>';
            }
            return;
        }

        // Cargar filtros del buscador a la reserva
        const guestsParam = parseInt(params.get('guests') || '2', 10);
        searchGuestsFilter = Number.isNaN(guestsParam) ? 2 : Math.max(1, guestsParam);
        searchDateFilter = params.get('date') || '';
        searchCheckinFilter = params.get('checkin') || '';
        searchCheckoutFilter = params.get('checkout') || '';

        // Copiar producto a estado global
        checkoutState.product = product;
        checkoutState.guests = searchGuestsFilter;

        // Formateador de fecha
        const formatDate = (d) => d.toISOString().split('T')[0];
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        checkoutState.singleDate = searchDateFilter || formatDate(today);
        checkoutState.checkin = searchCheckinFilter || searchDateFilter || formatDate(today);
        checkoutState.checkout = searchCheckoutFilter || formatDate(tomorrow);

        // Inicializar mes de vista del calendario
        currentCalendarMonth = new Date();
        if (product.priceType === 'night' && checkoutState.checkin) {
            currentCalendarMonth = new Date(checkoutState.checkin + 'T12:00:00');
        } else if (product.priceType !== 'night' && checkoutState.singleDate) {
            currentCalendarMonth = new Date(checkoutState.singleDate + 'T12:00:00');
        }
        currentCalendarMonth.setDate(1); // Ir al inicio del mes

        // Actualizar título, subtítulo, metadata
        const pageTitle = document.getElementById('booking-page-product-name');
        const pageSubtitle = document.getElementById('booking-page-product-subtitle');
        const pageRating = document.getElementById('booking-page-rating');
        const pageReviewsCount = document.getElementById('booking-page-reviews-count');
        const pageReviewsSummary = document.getElementById('booking-page-reviews-summary');
        const pageMetaGuests = document.getElementById('booking-page-meta-guests');
        const pageSubtitleCopies = document.querySelectorAll('.booking-page-product-subtitle-copy');
        const pageMetaGuestsCopies = document.querySelectorAll('.booking-page-meta-guests-copy');

        const cardPriceAmount = document.getElementById('card-price-amount');
        const cardOldPrice = document.getElementById('card-old-price');
        const cardPriceUnit = document.getElementById('card-price-unit');
        const cardRatingText = document.getElementById('card-rating-text');

        const mBarPriceAmount = document.getElementById('m-bar-price-amount');
        const mBarPriceUnit = document.getElementById('m-bar-price-unit');
        const mBarRatingVal = document.getElementById('m-bar-rating-val');

        const categoryMap = {
            alojamiento: 'Alojamiento',
            pasadia: 'Pasadía',
            deportes: 'Aventura',
            paquetes: 'Paquete'
        };

        if (pageTitle) pageTitle.textContent = product.title;
        if (pageSubtitle) pageSubtitle.textContent = product.subtitle;
        pageSubtitleCopies.forEach((node) => {
            node.textContent = product.subtitle;
        });

        // Mostrar centro turístico aliado
        if (product.partnerName) {
            const partnerBadge = `
                <div style="display: inline-flex; align-items: center; gap: 8px; margin-top: 6px;">
                    <span style="font-size: 0.85rem; color: var(--text-soft);">Operado por</span>
                    ${product.partnerLogo ? `<img src="${product.partnerLogo}" alt="${product.partnerName}" style="width: 20px; height: 20px; border-radius: 4px; object-fit: cover;">` : ''}
                    <strong style="color: var(--mint-300); font-size: 0.9rem;">${product.partnerName}</strong>
                </div>`;
            if (pageSubtitle && pageSubtitle.parentElement) {
                const existingBadge = document.getElementById('partner-badge-container');
                if (existingBadge) existingBadge.remove();
                const container = document.createElement('div');
                container.id = 'partner-badge-container';
                container.innerHTML = partnerBadge;
                pageSubtitle.parentElement.appendChild(container);
            }
        }

        // Renderizar descripción detallada del servicio
        const descriptionContainer = document.getElementById('booking-page-description');
        if (descriptionContainer) {
            const defaultDescription = "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.";
            const descriptionText = product.description || defaultDescription;
            descriptionContainer.innerHTML = descriptionText
                .split(/\n+/)
                .map(para => {
                    const cleanPara = para.trim();
                    if (!cleanPara) return '';
                    return `<p class="description-body" style="color: var(--text-dark); font-size: 0.95rem; margin-bottom: 15px; line-height: 1.6;">${cleanPara}</p>`;
                })
                .join('');
            
            const lastPara = descriptionContainer.querySelector('p:last-child');
            if (lastPara) {
                lastPara.style.marginBottom = '0';
            }
        }

        if (pageRating) pageRating.textContent = product.rating.toFixed(1);
        if (pageReviewsCount) pageReviewsCount.textContent = `${product.reviewsCount} reseñas`;
        if (pageReviewsSummary) pageReviewsSummary.textContent = `${product.rating.toFixed(1)} · ${product.reviewsCount} reseñas`;

        const guestText = `${product.maxGuests} huéspedes max · ${categoryMap[product.category] || product.category}`;
        if (pageMetaGuests) pageMetaGuests.textContent = guestText;
        pageMetaGuestsCopies.forEach((node) => {
            node.textContent = guestText;
        });


        // Precios sticky card
        if (cardPriceAmount) cardPriceAmount.textContent = `$${product.price.toLocaleString('es-CO')} COP`;
        if (cardOldPrice) {
            cardOldPrice.textContent = `$${Math.round(product.price * 1.25).toLocaleString('es-CO')} COP`;
            cardOldPrice.style.display = 'inline';
        }
        const unitText = product.priceType === 'night' ? '/ noche' : '/ persona';
        if (cardPriceUnit) cardPriceUnit.textContent = unitText;
        if (cardRatingText) cardRatingText.textContent = `${product.rating.toFixed(1)} (${product.reviewsCount})`;

        // Mobile bar
        if (mBarPriceAmount) mBarPriceAmount.textContent = `$${product.price.toLocaleString('es-CO')} COP`;
        if (mBarPriceUnit) mBarPriceUnit.textContent = unitText;
        if (mBarRatingVal) mBarRatingVal.textContent = product.rating.toFixed(1);

        document.title = `Reservar ${product.title} | Eco Conexión Calima`;

        // Renderizar fotos del grid
        const photoGrid = document.getElementById('booking-photo-grid');
        if (photoGrid) {
            let images = [];
            if (product.gallery && Array.isArray(product.gallery)) {
                images = [...product.gallery];
            }
            if (images.length === 0) {
                images.push(product.image);
            }
            
            // Si el servicio es personalizado, no agregamos imágenes de relleno del sistema
            const isCustom = product.id && product.id.startsWith('custom-');
            if (!isCustom) {
                const fallbacks = CATEGORY_GALLERY_FALLBACKS[product.category] || CATEGORY_GALLERY_FALLBACKS.alojamiento;
                let fbIndex = 0;
                while (images.length < 5) {
                    const nextFb = fallbacks[fbIndex % fallbacks.length];
                    if (!images.includes(nextFb)) {
                        images.push(nextFb);
                    } else {
                        images.push(fallbacks[(fbIndex + 1) % fallbacks.length]);
                    }
                    fbIndex++;
                }
            }

            if (images.length === 1) {
                // Diseño con una sola imagen (para servicios personalizados)
                photoGrid.innerHTML = `
                    <div class="photo-item-main" style="grid-column: 1 / -1; grid-row: 1 / -1; border-radius: 12px; height: 100%;">
                        <img src="${images[0]}" alt="${product.title} - Principal" style="border-radius: 12px; cursor: default;">
                    </div>
                `;
            } else {
                // Diseño de grilla de 5 fotos (Airbnb style) para servicios del sistema
                photoGrid.innerHTML = `
                    <div class="photo-item-main" style="border-top-left-radius: 12px; border-bottom-left-radius: 12px;">
                        <img src="${images[0]}" alt="${product.title} - Principal">
                    </div>
                    <div class="photo-item-sub">
                        <img src="${images[1]}" alt="${product.title} - 1">
                    </div>
                    <div class="photo-item-sub" style="border-top-right-radius: 12px;">
                        <img src="${images[2]}" alt="${product.title} - 2">
                    </div>
                    <div class="photo-item-sub">
                        <img src="${images[3]}" alt="${product.title} - 3">
                    </div>
                    <div class="photo-item-sub" style="border-bottom-right-radius: 12px;">
                        <img src="${images[4]}" alt="${product.title} - 4">
                    </div>
                    <button type="button" class="btn-show-all-photos" id="btn-show-photos-lightbox" style="position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); border: 1px solid rgba(255,255,255,0.25); color: white; border-radius: 8px; padding: 8px 14px; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; z-index: 5;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                        Mostrar todas las fotos
                    </button>
                `;

                // Slideshow auto-rotation for mobile (scroll-snap native swipeable)
                let autoScrollInterval = null;
                let interactionTimeout = null;

                const startAutoScroll = () => {
                    if (autoScrollInterval) clearInterval(autoScrollInterval);
                    autoScrollInterval = setInterval(() => {
                        if (window.innerWidth <= 900) {
                            const scrollWidth = photoGrid.offsetWidth;
                            const maxScroll = photoGrid.scrollWidth - scrollWidth;
                            let nextScroll = photoGrid.scrollLeft + scrollWidth;

                            if (nextScroll > maxScroll + 5) {
                                nextScroll = 0;
                            }

                            photoGrid.scrollTo({
                                left: nextScroll,
                                behavior: 'smooth'
                            });
                        }
                    }, 2000);
                };

                // Floating Image Counter Indicator
                const badge = document.createElement('div');
                badge.className = 'gallery-counter-badge';
                badge.textContent = `1 / ${images.length}`;
                photoGrid.appendChild(badge);

                const updateBadge = () => {
                    if (photoGrid.offsetWidth > 0) {
                        const scrollIndex = Math.round(photoGrid.scrollLeft / photoGrid.offsetWidth);
                        badge.textContent = `${scrollIndex + 1} / ${images.length}`;
                    }
                };

                photoGrid.addEventListener('scroll', updateBadge);

                // Pause auto scroll on touch/interaction
                const pauseAutoScroll = () => {
                    if (autoScrollInterval) {
                        clearInterval(autoScrollInterval);
                        autoScrollInterval = null;
                    }
                    if (interactionTimeout) clearTimeout(interactionTimeout);
                    // Restart auto-scroll after 5 seconds of no user interaction
                    interactionTimeout = setTimeout(startAutoScroll, 5000);
                };

                photoGrid.addEventListener('touchstart', pauseAutoScroll, { passive: true });
                photoGrid.addEventListener('mousedown', pauseAutoScroll);

                // Initial start of scroll loop
                startAutoScroll();

                // Setup Gallery Lightbox Modal
                const setupGalleryLightbox = () => {
                    const btnShowAll = document.getElementById('btn-show-photos-lightbox');
                    const lightbox = document.getElementById('modal-gallery-lightbox');
                    const lightboxImg = document.getElementById('lightbox-img');
                    const lightboxCaption = document.getElementById('lightbox-caption');
                    const closeBtn = document.getElementById('close-gallery-lightbox');
                    const prevBtn = document.getElementById('lightbox-prev');
                    const nextBtn = document.getElementById('lightbox-next');
                    const thumbsContainer = document.getElementById('lightbox-thumbs');

                    if (!lightbox || !lightboxImg || !btnShowAll) return;

                    let currentIdx = 0;

                    // Dynamically populate thumbnails
                    if (thumbsContainer) {
                        thumbsContainer.innerHTML = '';
                        images.forEach((src, idx) => {
                            const thumbItem = document.createElement('div');
                            thumbItem.className = 'lightbox-thumb-item';
                            thumbItem.dataset.index = idx;
                            thumbItem.innerHTML = `<img src="${src}" alt="Thumbnail ${idx + 1}">`;
                            thumbItem.addEventListener('click', (e) => {
                                e.stopPropagation();
                                updateLightboxImage(idx);
                            });
                            thumbsContainer.appendChild(thumbItem);
                        });
                    }

                    const updateLightboxImage = (index) => {
                        currentIdx = index;
                        lightboxImg.style.transform = 'scale(0.97)';
                        lightboxImg.style.opacity = '0.4';

                        setTimeout(() => {
                            lightboxImg.src = images[currentIdx];

                            // Update Header Text & Counter
                            const titleEl = document.getElementById('lightbox-header-title');
                            const counterEl = document.getElementById('lightbox-header-counter');
                            if (titleEl) titleEl.textContent = product.title;
                            if (counterEl) counterEl.textContent = `${currentIdx + 1} / ${images.length}`;

                            // Update active thumbnail
                            if (thumbsContainer) {
                                const thumbs = thumbsContainer.querySelectorAll('.lightbox-thumb-item');
                                thumbs.forEach((thumb, tIdx) => {
                                    if (tIdx === currentIdx) {
                                        thumb.classList.add('active');
                                        thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                                    } else {
                                        thumb.classList.remove('active');
                                    }
                                });
                            }

                            lightboxImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
                            lightboxImg.style.opacity = '1';
                        }, 150);
                    };

                    const openLightbox = (index) => {
                        lightbox.style.display = 'flex';
                        setTimeout(() => {
                            lightbox.classList.add('show');
                        }, 10);
                        updateLightboxImage(index);
                        document.body.style.overflow = 'hidden';
                    };

                    const closeLightbox = () => {
                        lightbox.classList.remove('show');
                        setTimeout(() => {
                            lightbox.style.display = 'none';
                            document.body.style.overflow = '';
                        }, 350);
                    };

                    const showPrev = (e) => {
                        if (e) e.stopPropagation();
                        const newIdx = (currentIdx - 1 + images.length) % images.length;
                        updateLightboxImage(newIdx);
                    };

                    const showNext = (e) => {
                        if (e) e.stopPropagation();
                        const newIdx = (currentIdx + 1) % images.length;
                        updateLightboxImage(newIdx);
                    };

                    // Drag/Swipe Logic inside Lightbox
                    const imgContainer = lightbox.querySelector('.lightbox-image-container');
                    let swipeStartX = 0;
                    let swipeStartY = 0;
                    let swipeThreshold = 60;
                    let isSwiping = false;

                    // Touch support (mobile)
                    imgContainer.addEventListener('touchstart', (e) => {
                        swipeStartX = e.touches[0].clientX;
                        swipeStartY = e.touches[0].clientY;
                        isSwiping = true;
                        lightboxImg.style.transition = 'none';
                    }, { passive: true });

                    imgContainer.addEventListener('touchmove', (e) => {
                        if (!isSwiping) return;
                        const currentX = e.touches[0].clientX;
                        const currentY = e.touches[0].clientY;
                        const diffX = currentX - swipeStartX;
                        const diffY = currentY - swipeStartY;

                        if (Math.abs(diffX) > Math.abs(diffY)) {
                            lightboxImg.style.transform = `translate3d(${diffX}px, 0, 0) scale(0.98)`;
                        }
                    }, { passive: true });

                    imgContainer.addEventListener('touchend', (e) => {
                        if (!isSwiping) return;
                        isSwiping = false;
                        const endX = e.changedTouches[0].clientX;
                        const diffX = endX - swipeStartX;

                        lightboxImg.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

                        if (Math.abs(diffX) > swipeThreshold) {
                            if (diffX > 0) {
                                showPrev();
                            } else {
                                showNext();
                            }
                        } else {
                            lightboxImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
                            lightboxImg.style.opacity = '1';
                        }
                    });

                    // Mouse support (desktop drag)
                    let isDraggingMouse = false;
                    let mouseStartX = 0;

                    imgContainer.addEventListener('mousedown', (e) => {
                        e.preventDefault();
                        isDraggingMouse = true;
                        mouseStartX = e.clientX;
                        lightboxImg.style.transition = 'none';
                    });

                    imgContainer.addEventListener('mousemove', (e) => {
                        if (!isDraggingMouse) return;
                        const diffX = e.clientX - mouseStartX;
                        lightboxImg.style.transform = `translate3d(${diffX}px, 0, 0) scale(0.98)`;
                    });

                    const handleMouseUp = (e) => {
                        if (!isDraggingMouse) return;
                        isDraggingMouse = false;
                        const diffX = e.clientX - mouseStartX;
                        lightboxImg.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

                        if (Math.abs(diffX) > swipeThreshold) {
                            if (diffX > 0) {
                                showPrev();
                            } else {
                                showNext();
                            }
                        } else {
                            lightboxImg.style.transform = 'translate3d(0, 0, 0) scale(1)';
                            lightboxImg.style.opacity = '1';
                        }
                    };

                    imgContainer.addEventListener('mouseup', handleMouseUp);
                    imgContainer.addEventListener('mouseleave', handleMouseUp);

                    // Bind click to the "Show all photos" button
                    btnShowAll.addEventListener('click', () => openLightbox(0));

                    // Bind click to each image in the grid
                    const gridImages = photoGrid.querySelectorAll('img');
                    gridImages.forEach((img, idx) => {
                        let isDraggingGrid = false;
                        let startX = 0;
                        img.addEventListener('touchstart', (e) => {
                            startX = e.touches[0].clientX;
                            isDraggingGrid = false;
                        }, { passive: true });
                        img.addEventListener('touchmove', (e) => {
                            if (Math.abs(e.touches[0].clientX - startX) > 10) {
                                isDraggingGrid = true;
                            }
                        }, { passive: true });
                        img.addEventListener('touchend', (e) => {
                            if (!isDraggingGrid) {
                                openLightbox(idx);
                            }
                        });
                        img.addEventListener('click', () => {
                            if (window.innerWidth > 900) {
                                openLightbox(idx);
                            }
                        });
                    });

                    // Navigation and close events
                    closeBtn.addEventListener('click', closeLightbox);
                    prevBtn.addEventListener('click', showPrev);
                    nextBtn.addEventListener('click', showNext);
                    lightbox.addEventListener('click', closeLightbox);
                    imgContainer.addEventListener('click', (e) => e.stopPropagation());

                    // Keyboard navigation
                    document.addEventListener('keydown', (e) => {
                        if (lightbox.classList.contains('show')) {
                            if (e.key === 'Escape') closeLightbox();
                            if (e.key === 'ArrowLeft') showPrev(e);
                            if (e.key === 'ArrowRight') showNext(e);
                        }
                    });
                };

                setupGalleryLightbox();
            }
        }

        // Renderizar comodidades
        const amenitiesGrid = document.getElementById('booking-page-amenities-grid');
        if (amenitiesGrid) {
            const amenityIconMap = {
                "Vista al Lago": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
                "Jacuzzi Privado": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v6"/><path d="M21 16v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/></svg>`,
                "Malla Catamarán": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
                "Desayuno Incluido": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
                "Wifi Premium": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.94 0"/><circle cx="12" cy="20" r="1"/></svg>`,
                "Fogata": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
                "Piscina Climatizada": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h20"/><path d="M22 6c0 4.418-4 8-10 8S2 10.418 2 6"/><path d="M2 18h20"/><path d="M22 18c0 2.209-4 4-10 4s-10-1.791-10-4"/></svg>`,
                "Zonas Verdes": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 22h20L12 2z"/></svg>`,
                "Restaurante": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
                "Parqueadero": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>`,
                "Sendero Ecológico": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 22H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2z"/></svg>`,
                "Cocina Equipada": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
                "Asador BBQ": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
                "Piscina Privada": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 6h20"/><path d="M22 6c0 4.418-4 8-10 8S2 10.418 2 6"/></svg>`,
                "Admite Mascotas": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`,
                "default": `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
            };

            let amenitiesHtml = '';
            if (product.features && Array.isArray(product.features)) {
                product.features.forEach(f => {
                    const icon = amenityIconMap[f] || amenityIconMap.default;
                    amenitiesHtml += `
                        <div class="amenity-item" style="display: flex; align-items: center; gap: 12px; color: var(--text-dark); font-size: 0.95rem; padding: 6px 0;">
                            <span class="amenity-icon" style="color: var(--accent-gold); display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px;">${icon}</span>
                            <span>${f}</span>
                        </div>
                    `;
                });
            } else {
                amenitiesHtml = '<p style="color: var(--text-light); font-style: italic;">No se especificaron comodidades.</p>';
            }
            amenitiesGrid.innerHTML = amenitiesHtml;
        }

        // Renderizar comentarios desde la base de datos
        const reviewsCommentsContainer = document.getElementById('booking-page-reviews-comments');
        const renderReviews = async () => {
            if (!reviewsCommentsContainer) return;
            const reviews = await window.BookingData.getReviews(product.id, 'approved');
            
            if (reviews.length === 0) {
                reviewsCommentsContainer.innerHTML = `
                    <div class="reviews-empty-state" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px; background: rgba(255, 255, 255, 0.01); border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 20px; gap: 15px; margin-bottom: 25px; width: 100%;">
                        <div class="empty-state-icon" style="color: var(--accent-gold); opacity: 0.8; width: 48px; height: 48px;">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.177 48.177 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                            </svg>
                        </div>
                        <div class="empty-state-text">
                            <h5 style="color: var(--white); font-size: 1.05rem; font-weight: 700; margin-bottom: 4px;">Sin opiniones todavía</h5>
                            <p style="color: var(--text-soft); font-size: 0.9rem; max-width: 420px; margin: 0; line-height: 1.5; opacity: 0.8;">Nadie ha escrito una reseña para este servicio. ¡Sé la primera persona en compartir tu experiencia!</p>
                        </div>
                    </div>
                `;
                return;
            }

            reviewsCommentsContainer.innerHTML = reviews.map(r => {
                const dateObj = new Date(r.date);
                const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
                const dateStr = `${monthNames[dateObj.getMonth()]} de ${dateObj.getFullYear()}`;
                const avatarUrl = r.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop';
                const stars = '★'.repeat(Math.round(r.rating)) + '☆'.repeat(5 - Math.round(r.rating));
                
                return `
                    <div class="review-comment-card" style="display: flex; flex-direction: column; gap: 12px; padding: 20px; border-radius: 16px;">
                        <div class="reviewer-header" style="display: flex; align-items: center; gap: 12px;">
                            <img src="${avatarUrl}" alt="${r.author}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);">
                            <div>
                                <strong style="display: block; color: var(--white); font-size: 0.95rem;">${r.author}</strong>
                                <span style="font-size: 0.78rem; color: var(--accent-gold);">${stars}</span>
                                <span style="font-size: 0.78rem; color: var(--text-soft); margin-left: 6px; opacity: 0.8;">${dateStr}</span>
                            </div>
                        </div>
                        <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; line-height: 1.6; margin: 0; font-style: italic;">"${r.comment}"</p>
                    </div>
                `;
            }).join('');
        };
        renderReviews();

        // Función para actualizar el contador de reseñas localmente tras enviar una
        const actualizarContadorResenas = () => {
            const newCount = (product.reviewsCount || 0) + 1;
            product.reviewsCount = newCount;
            if (pageReviewsCount) pageReviewsCount.textContent = `${newCount} reseñas`;
            if (pageReviewsSummary) pageReviewsSummary.textContent = `${product.rating.toFixed(1)} · ${newCount} reseñas`;
            if (cardRatingText) cardRatingText.textContent = `${product.rating.toFixed(1)} (${newCount})`;
        };

        // Configurar estrella de calificación interactiva
        const starInput = document.getElementById('star-rating-input');
        const ratingInput = document.getElementById('review-rating');
        if (starInput && ratingInput) {
            const stars = starInput.querySelectorAll('[data-star]');
            const updateStars = (val) => {
                stars.forEach(s => {
                    const starVal = parseInt(s.dataset.star);
                    s.style.color = starVal <= val ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)';
                });
            };
            stars.forEach(s => {
                const val = parseInt(s.dataset.star);
                s.addEventListener('click', () => {
                    ratingInput.value = val;
                    updateStars(val);
                });
                s.addEventListener('mouseenter', () => updateStars(val));
                s.addEventListener('mouseleave', () => updateStars(parseInt(ratingInput.value)));
            });
            updateStars(5);
        }

        // Enviar reseña
        const reviewForm = document.getElementById('review-form');
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const author = document.getElementById('review-author').value.trim();
                const email = document.getElementById('review-email').value.trim();
                const comment = document.getElementById('review-comment').value.trim();
                const rating = parseInt(document.getElementById('review-rating').value);
                const feedback = document.getElementById('review-form-feedback');

                if (!author || !comment) return;

                const submitBtn = reviewForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Enviando...';
                if (feedback) {
                    feedback.style.display = 'block';
                    feedback.textContent = 'Enviando tu reseña...';
                    feedback.style.color = 'var(--text-light)';
                }

                const result = await window.BookingData.saveReview({
                    productId: product.id,
                    author,
                    email,
                    comment,
                    rating,
                    avatar: ''
                });

                if (result.status === 'success') {
                    if (feedback) {
                        feedback.textContent = '¡Reseña enviada con éxito! Gracias por compartir tu experiencia.';
                        feedback.style.color = 'var(--mint-300)';
                    }
                    reviewForm.reset();
                    if (ratingInput) ratingInput.value = 5;
                    if (starInput) {
                        const defaultStars = starInput.querySelectorAll('[data-star]');
                        defaultStars.forEach(s => {
                            const val = parseInt(s.dataset.star);
                            s.style.color = val <= 5 ? 'var(--accent-gold)' : 'rgba(255,255,255,0.15)';
                        });
                    }
                    renderReviews();
                    actualizarContadorResenas();
                } else {
                    if (feedback) {
                        feedback.textContent = 'Error al enviar la reseña. Intenta de nuevo.';
                        feedback.style.color = '#e57373';
                    }
                }
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar reseña';
            });
        }

        // Configurar campos del cotizador sticky card
        const cardCheckin = document.getElementById('w-card-checkin');
        const cardCheckout = document.getElementById('w-card-checkout');
        const cardSingleDate = document.getElementById('w-card-singledate');
        const cardGuests = document.getElementById('w-card-guests');

        const checkinWrapper = document.getElementById('card-checkin-wrapper');
        const checkoutWrapper = document.getElementById('card-checkout-wrapper');
        const singleDateWrapper = document.getElementById('card-single-date-wrapper');

        // Mostrar u ocultar campos según tipo de tarifa
        if (product.priceType === 'night') {
            if (checkinWrapper) checkinWrapper.style.display = 'flex';
            if (checkoutWrapper) checkoutWrapper.style.display = 'flex';
            if (singleDateWrapper) singleDateWrapper.style.display = 'none';

            if (cardCheckin) {
                cardCheckin.min = formatDate(today);
                cardCheckin.value = checkoutState.checkin;
            }
            if (cardCheckout) {
                cardCheckout.min = formatDate(tomorrow);
                cardCheckout.value = checkoutState.checkout;
            }
        } else {
            if (checkinWrapper) checkinWrapper.style.display = 'none';
            if (checkoutWrapper) checkoutWrapper.style.display = 'none';
            if (singleDateWrapper) singleDateWrapper.style.display = 'flex';

            if (cardSingleDate) {
                cardSingleDate.min = formatDate(today);
                cardSingleDate.value = checkoutState.singleDate;
            }
        }

        // Llenar selector de huéspedes dinámicamente hasta la capacidad máxima
        if (cardGuests) {
            cardGuests.innerHTML = '';
            for (let i = 1; i <= product.maxGuests; i++) {
                const opt = document.createElement('option');
                opt.value = i;
                opt.textContent = `${i} ${i === 1 ? 'huésped' : 'huéspedes'}`;
                if (i === checkoutState.guests) {
                    opt.selected = true;
                }
                opt.style.backgroundColor = '#12351d';
                opt.style.color = 'white';
                cardGuests.appendChild(opt);
            }
        }

        // ----------------- CALENDARIO INTERACTIVO DE DETALLES -----------------
        renderInteractiveCalendar = () => {
            const calGrids = document.getElementById('interactive-calendar-grids');
            if (!calGrids) return;

            const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
            
            // Mes 1 (Izquierdo)
            const m1 = new Date(currentCalendarMonth);
            // Mes 2 (Derecho)
            const m2 = new Date(currentCalendarMonth);
            m2.setMonth(m2.getMonth() + 1);

            // Actualizar títulos de meses
            const monthTitle1 = document.getElementById('mock-cal-month-1');
            const monthTitle2 = document.getElementById('mock-cal-month-2');
            if (monthTitle1) monthTitle1.textContent = `${monthNames[m1.getMonth()]} de ${m1.getFullYear()}`;
            if (monthTitle2) monthTitle2.textContent = `${monthNames[m2.getMonth()]} de ${m2.getFullYear()}`;

            // Control del botón de retroceso (impedir ir al pasado)
            const btnPrev = document.getElementById('btn-cal-prev');
            if (btnPrev) {
                const now = new Date();
                const currentLimit = new Date(now.getFullYear(), now.getMonth(), 1);
                if (m1 <= currentLimit) {
                    btnPrev.disabled = true;
                } else {
                    btnPrev.disabled = false;
                }
            }

            // Generar cuadrícula de un mes
            const generateMonthHtml = (dateObj, isSecondMonthOnMobile) => {
                const year = dateObj.getFullYear();
                const month = dateObj.getMonth();
                
                const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes, etc.
                const totalDays = new Date(year, month + 1, 0).getDate();

                const todayStr = formatDate(new Date());

                let html = `<div class="mock-cal-grid ${isSecondMonthOnMobile ? 'mobile-hide' : ''}" style="flex: 1; display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; gap: 8px; font-size: 0.85rem;">`;
                
                // Cabeceras de días de la semana
                const dayHeaders = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"];
                dayHeaders.forEach(day => {
                    html += `<div class="cal-day-name" style="font-weight: 700; color: var(--text-light);">${day}</div>`;
                });

                // Celdas vacías al inicio
                for (let i = 0; i < firstDayIndex; i++) {
                    html += `<div class="cal-day empty"></div>`;
                }

                // Días del mes
                for (let day = 1; day <= totalDays; day++) {
                    const dayDate = new Date(year, month, day);
                    const dayStr = formatDate(dayDate);

                    let classes = ["cal-day"];
                    
                    // Comprobar si está deshabilitado (en el pasado)
                    if (dayStr < todayStr) {
                        classes.push("disabled");
                    }

                    // Comprobar estados de selección
                    if (product.priceType === 'night') {
                        if (checkoutState.checkin === dayStr) {
                            classes.push("selected-range-start");
                        } else if (checkoutState.checkout === dayStr) {
                            classes.push("selected-range-end");
                        } else if (checkoutState.checkin && checkoutState.checkout && dayStr > checkoutState.checkin && dayStr < checkoutState.checkout) {
                            classes.push("selected-range");
                        }
                    } else {
                        if (checkoutState.singleDate === dayStr) {
                            classes.push("selected-single");
                        }
                    }

                    html += `<div class="${classes.join(' ')}" data-date="${dayStr}">${day}</div>`;
                }

                html += `</div>`;
                return html;
            };

            // Inyectar grids
            calGrids.innerHTML = generateMonthHtml(m1, false) + generateMonthHtml(m2, true);

            // Bind click events on days
            const dayEls = calGrids.querySelectorAll('.cal-day:not(.empty):not(.disabled)');
            dayEls.forEach(dayEl => {
                const dateStr = dayEl.dataset.date;

                dayEl.addEventListener('click', () => {
                    if (product.priceType === 'night') {
                        // Selección de rango
                        if (!checkoutState.checkin || (checkoutState.checkin && checkoutState.checkout)) {
                            // Primer click: establecer checkin, limpiar checkout
                            checkoutState.checkin = dateStr;
                            checkoutState.checkout = '';
                        } else {
                            // Segundo click: establecer checkout
                            if (dateStr > checkoutState.checkin) {
                                checkoutState.checkout = dateStr;
                            } else if (dateStr < checkoutState.checkin) {
                                // Resetear checkin si hace click en fecha anterior
                                checkoutState.checkin = dateStr;
                            } else {
                                // Click en el mismo día: limpiar selección
                                checkoutState.checkin = '';
                                checkoutState.checkout = '';
                            }
                        }

                        // Sincronizar con los inputs de la tarjeta
                        const cardCheckin = document.getElementById('w-card-checkin');
                        const cardCheckout = document.getElementById('w-card-checkout');
                        if (cardCheckin) cardCheckin.value = checkoutState.checkin || '';
                        if (cardCheckout) cardCheckout.value = checkoutState.checkout || '';
                    } else {
                        // Selección única
                        checkoutState.singleDate = dateStr;
                        const cardSingleDate = document.getElementById('w-card-singledate');
                        if (cardSingleDate) cardSingleDate.value = dateStr;
                    }

                    // Recalcular precios e internamente se re-renderizará el calendario para actualizar las marcas visuales
                    updateStickyCalculator();
                });

                // Efecto hover para dibujar previsualización de rango
                dayEl.addEventListener('mouseenter', () => {
                    if (product.priceType === 'night' && checkoutState.checkin && !checkoutState.checkout) {
                        // Limpiar clases de hover previas
                        dayEls.forEach(el => el.classList.remove('hover-range'));

                        // Resaltar días entre el check-in y la fecha actual en hover
                        if (dateStr > checkoutState.checkin) {
                            dayEls.forEach(el => {
                                const d = el.dataset.date;
                                if (d > checkoutState.checkin && d <= dateStr) {
                                    el.classList.add('hover-range');
                                }
                            });
                        }
                    }
                });
            });

            // Limpiar hover al salir de las cuadrículas
            calGrids.addEventListener('mouseleave', () => {
                dayEls.forEach(el => el.classList.remove('hover-range'));
            });
        };

        // Vincular navegación de meses
        const btnCalPrev = document.getElementById('btn-cal-prev');
        const btnCalNext = document.getElementById('btn-cal-next');

        if (btnCalPrev) {
            btnCalPrev.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
                renderInteractiveCalendar();
            });
        }

        if (btnCalNext) {
            btnCalNext.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
                renderInteractiveCalendar();
            });
        }

        // Vincular eventos de cambio del cotizador
        const updateEvents = ['change', 'input'];
        updateEvents.forEach(evt => {
            if (cardCheckin) cardCheckin.addEventListener(evt, () => {
                // Ajustar check-out mínimo al día siguiente
                const inVal = new Date(cardCheckin.value);
                const minOut = new Date(inVal);
                minOut.setDate(minOut.getDate() + 1);
                if (cardCheckout) {
                    cardCheckout.min = formatDate(minOut);
                    if (new Date(cardCheckout.value) <= inVal) {
                        cardCheckout.value = cardCheckout.min;
                    }
                }
                updateStickyCalculator();
            });
            if (cardCheckout) cardCheckout.addEventListener(evt, updateStickyCalculator);
            if (cardSingleDate) cardSingleDate.addEventListener(evt, updateStickyCalculator);
            if (cardGuests) cardGuests.addEventListener(evt, updateStickyCalculator);
        });

        // Inicializar cotización
        updateStickyCalculator();

        // Controlar envío de reservas (Sticky Card y Mobile Bottom Bar)
        const triggerCheckoutModal = () => {
            // Validate dates from the inline card (which is now visible on both desktop & mobile)
            if (product.priceType === 'night') {
                const cin = document.getElementById('w-card-checkin').value;
                const cout = document.getElementById('w-card-checkout').value;
                if (!cin || !cout) {
                    const bookingCardEl = document.getElementById('sticky-booking-card');
                    if (bookingCardEl) {
                        bookingCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        bookingCardEl.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                        bookingCardEl.style.transform = 'scale(1.02)';
                        bookingCardEl.style.boxShadow = '0 0 25px rgba(223, 161, 53, 0.6)';
                        setTimeout(() => {
                            bookingCardEl.style.transform = '';
                            bookingCardEl.style.boxShadow = '';
                        }, 1000);
                    }
                    return;
                }
                checkoutState.checkin = cin;
                checkoutState.checkout = cout;
            } else {
                const sdate = document.getElementById('w-card-singledate').value;
                if (!sdate) {
                    const bookingCardEl = document.getElementById('sticky-booking-card');
                    if (bookingCardEl) {
                        bookingCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        bookingCardEl.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
                        bookingCardEl.style.transform = 'scale(1.02)';
                        bookingCardEl.style.boxShadow = '0 0 25px rgba(223, 161, 53, 0.6)';
                        setTimeout(() => {
                            bookingCardEl.style.transform = '';
                            bookingCardEl.style.boxShadow = '';
                        }, 1000);
                    }
                    return;
                }
                checkoutState.singleDate = sdate;
            }
            checkoutState.guests = parseInt(document.getElementById('w-card-guests').value, 10);
            checkoutState.children = checkoutState.children || 0;

            // Mostrar wizard en la vista (inline)
            const detailsContent = document.getElementById('details-content');
            const inlineContainer = document.getElementById('inline-wizard-container');

            if (detailsContent && inlineContainer) {
                // Fade out del contenido de detalles
                detailsContent.style.opacity = '0';

                // Ocultar barra inferior móvil si existe para liberar espacio
                const mobileBottomBar = document.getElementById('mobile-bottom-bar');
                if (mobileBottomBar) {
                    mobileBottomBar.style.setProperty('display', 'none', 'important');
                }

                setTimeout(() => {
                    detailsContent.style.display = 'none';
                    inlineContainer.style.display = 'block';

                    // Renderizar wizard directamente en el contenedor inline
                    renderBookingWizard(product.id, inlineContainer, 'inline');

                    // Renderizar los adicionales del Paso 2 (preparados por si avanza)
                    renderAddonsStep();

                    setTimeout(() => {
                        inlineContainer.style.opacity = '1';
                        // Desplazar la pantalla al inicio del contenedor
                        inlineContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 10);
                }, 300);
            }
        };

        const btnSticky = document.getElementById('btn-submit-reserva-sticky');
        const btnMobile = document.getElementById('btn-submit-reserva-mobile');
        if (btnSticky) btnSticky.addEventListener('click', triggerCheckoutModal);
        if (btnMobile) btnMobile.addEventListener('click', triggerCheckoutModal);

        // Controlar cerrar modal de checkout
        const closeCheckoutModal = document.querySelector('.close-checkout-modal');
        const checkoutModal = document.getElementById('modal-checkout-flow');
        if (closeCheckoutModal && checkoutModal) {
            closeCheckoutModal.addEventListener('click', () => {
                checkoutModal.classList.remove('show');
                setTimeout(() => {
                    checkoutModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }, 300);
            });
        }
    };

    // Calcular valores y renderizar recibo final del Paso 4
    const calculateTotals = () => {
        const product = checkoutState.product;
        let baseTotal = 0;
        let nights = 1;
        let childTotal = 0;
        let adultTotal = 0;

        if (product.priceType === 'night') {
            // Alojamiento: Calcular diferencia de días
            const date1 = new Date(checkoutState.checkin);
            const date2 = new Date(checkoutState.checkout);
            const diffTime = Math.abs(date2 - date1);
            nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

            // Habitación se cobra plana por noche
            baseTotal = product.price * nights;
        } else {
            // Pasadía / Deporte: Cobro unitario por persona
            // Adultos
            adultTotal = product.price * checkoutState.guests;

            // Niños (con descuento)
            const discount = product.childDiscountRate || 0;
            childTotal = (product.price * (1 - discount)) * checkoutState.children;

            baseTotal = adultTotal + childTotal;
        }

        // Adicionales
        let addonsTotal = 0;
        const addonsDetails = [];

        checkoutState.addons.forEach(addonId => {
            const addon = window.BookingData.getAddonDetails(addonId);
            if (!addon) return;

            let cost = 0;
            if (addon.type === 'person') {
                cost = addon.price * (checkoutState.guests + checkoutState.children);
            } else {
                cost = addon.price;
            }

            addonsTotal += cost;
            addonsDetails.push({
                name: addon.name,
                price: cost
            });
        });

        const finalTotal = baseTotal + addonsTotal;

        return {
            nights,
            baseTotal,
            adultTotal,
            childTotal,
            addonsTotal,
            addonsDetails,
            finalTotal
        };
    };

    // Renderizar HTML del recibo
    const renderReceiptStep = () => {
        const receiptContainer = document.getElementById('w-receipt-container');
        if (!receiptContainer) return;

        const product = checkoutState.product;
        const totals = calculateTotals();

        let datesHtml = '';
        if (product.priceType === 'night') {
            datesHtml = `
                <div class="receipt-line">
                    <span>Estadía (${totals.nights} ${totals.nights === 1 ? 'noche' : 'noches'}):</span>
                    <span>${checkoutState.checkin} al ${checkoutState.checkout}</span>
                </div>
            `;
        } else {
            datesHtml = `
                <div class="receipt-line">
                    <span>Fecha de la experiencia:</span>
                    <span>${checkoutState.singleDate}</span>
                </div>
            `;
        }

        let basePriceBreakdown = '';
        if (product.priceType === 'night') {
            basePriceBreakdown = `
                <div class="receipt-line">
                    <span>Tarifa Base Hotel:</span>
                    <span>$${product.price.toLocaleString('es-CO')} COP x Noche</span>
                </div>
            `;
        } else {
            basePriceBreakdown = `
                <div class="receipt-line">
                    <span>Adultos (${checkoutState.guests}):</span>
                    <span>$${totals.adultTotal.toLocaleString('es-CO')} COP</span>
                </div>
            `;
            if (checkoutState.children > 0) {
                const discountPct = (product.childDiscountRate * 100).toFixed(0);
                basePriceBreakdown += `
                    <div class="receipt-line">
                        <span>Niños (${checkoutState.children}) [Desc. ${discountPct}%]:</span>
                        <span>$${totals.childTotal.toLocaleString('es-CO')} COP</span>
                    </div>
                `;
            }
        }

        // Addons
        let addonsHtml = '';
        if (totals.addonsDetails.length > 0) {
            addonsHtml = `<div class="receipt-divider"></div>`;
            totals.addonsDetails.forEach(addon => {
                addonsHtml += `
                    <div class="receipt-line">
                        <span>+ ${addon.name}:</span>
                        <span>$${addon.price.toLocaleString('es-CO')} COP</span>
                    </div>
                `;
            });
        }

        receiptContainer.innerHTML = `
            <div class="receipt-title">${product.title}</div>
            
            <div class="receipt-line">
                <span>Categoría:</span>
                <span style="text-transform: capitalize;">${product.category}</span>
            </div>
            
            ${datesHtml}
            
            <div class="receipt-line">
                <span>Viajeros:</span>
                <span>${checkoutState.guests} ${checkoutState.guests === 1 ? 'Adulto' : 'Adultos'} ${checkoutState.children > 0 ? `, ${checkoutState.children} ${checkoutState.children === 1 ? 'Niño' : 'Niños'}` : ''}</span>
            </div>

            <div class="receipt-divider"></div>
            
            ${basePriceBreakdown}
            
            <div class="receipt-line accent">
                <span>Subtotal Experiencia:</span>
                <span>$${totals.baseTotal.toLocaleString('es-CO')} COP</span>
            </div>

            ${addonsHtml}

            <div class="receipt-divider"></div>

            <div class="receipt-total">
                <span>Total Cotizado:</span>
                <span>$${totals.finalTotal.toLocaleString('es-CO')} COP</span>
            </div>
        `;

        // Registrar eventos para checkout
        setupCheckoutFinalButtons(totals.finalTotal);
    };

    // Configurar botones finales (WhatsApp / Pasarela de Pago)
    const setupCheckoutFinalButtons = (finalTotal) => {
        const product = checkoutState.product;
        const totals = calculateTotals();

        // 1. Confirmación vía WhatsApp
        document.getElementById('w-btn-whatsapp').addEventListener('click', () => {
            const companyNumber = "573168251303"; // Número del main-header/footer

            let message = `¡Hola *Eco Conexión Calima*! Deseo realizar una reserva:\n\n`;
            message += `*Servicio:* ${product.title}\n`;
            message += `*Categoría:* ${product.category.toUpperCase()}\n`;

            if (product.priceType === 'night') {
                message += `*Estadía:* ${checkoutState.checkin} al ${checkoutState.checkout} (${totals.nights} noches)\n`;
            } else {
                message += `*Fecha:* ${checkoutState.singleDate}\n`;
            }

            message += `*Personas:* ${checkoutState.guests} Adultos${checkoutState.children > 0 ? `, ${checkoutState.children} Niños` : ''}\n`;

            if (checkoutState.addons.length > 0) {
                message += `\n*Servicios Adicionales:* \n`;
                checkoutState.addons.forEach(addonId => {
                    const addon = window.BookingData.getAddonDetails(addonId);
                    message += `- ${addon.name}\n`;
                });
            }

            message += `\n*Datos del Titular:* \n`;
            message += `- Nombre: ${checkoutState.customer.name}\n`;
            if (checkoutState.customer.docType && checkoutState.customer.docNum) {
                message += `- Documento: ${checkoutState.customer.docType} ${checkoutState.customer.docNum}\n`;
            }
            if (checkoutState.customer.dob) {
                message += `- Fecha de Nacimiento: ${checkoutState.customer.dob}\n`;
            }
            message += `- Email: ${checkoutState.customer.email}\n`;
            message += `- WhatsApp: ${checkoutState.customer.phone}\n`;
            message += `- País: ${checkoutState.customer.country}\n`;
            if (checkoutState.customer.country === 'Colombia') {
                message += `- Departamento: ${checkoutState.customer.department}\n`;
                message += `- Ciudad: ${checkoutState.customer.city}\n`;
            } else {
                message += `- Ciudad Extranjera: ${checkoutState.customer.city}\n`;
            }
            if (checkoutState.customer.notes) {
                message += `- Notas: ${checkoutState.customer.notes}\n`;
            }

            message += `\n*TOTAL COTIZADO:* $${totals.finalTotal.toLocaleString('es-CO')} COP`;

            const waLink = `https://api.whatsapp.com/send?phone=${companyNumber}&text=${encodeURIComponent(message)}`;
            window.open(waLink, '_blank');
        });

        // 2. Pasarela de Pago Simulada
        const gatewayModal = document.getElementById('modal-gateway');
        const gatewayTotalLbl = document.getElementById('gateway-total-amount');

        document.getElementById('w-btn-gateway').addEventListener('click', () => {
            if (bookingRenderMode === 'modal') {
                closeModal();
            }

            gatewayTotalLbl.textContent = `$${finalTotal.toLocaleString('es-CO')} COP`;
            gatewayModal.style.display = 'block';
            setTimeout(() => gatewayModal.classList.add('show'), 10);
            document.body.style.overflow = 'hidden';
        });
    };

    // --- 4. Pasarela de Pago Simulada (Pseudocódigo e Interacciones) ---
    const gatewayModal = document.getElementById('modal-gateway');
    const closeGatewayBtn = document.querySelector('.close-gateway-modal');
    const paymentTabs = document.querySelectorAll('.pm-tab');
    const cardForm = document.getElementById('gateway-card-form');
    const pseForm = document.getElementById('gateway-pse-form');
    const gatewayLoader = document.getElementById('gateway-loading');

    if (closeGatewayBtn) {
        closeGatewayBtn.addEventListener('click', () => {
            gatewayModal.classList.remove('show');
            setTimeout(() => {
                gatewayModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        });
    }

    // Toggle pestañas de métodos de pago
    paymentTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            paymentTabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = 'var(--text-light)';
            });
            tab.classList.add('active');
            tab.style.color = 'var(--white)';

            const method = tab.getAttribute('data-method');
            if (method === 'card') {
                cardForm.style.display = 'flex';
                pseForm.style.display = 'none';
            } else {
                cardForm.style.display = 'none';
                pseForm.style.display = 'flex';
            }
        });
    });

    // Envío del pago Tarjeta
    if (cardForm) {
        cardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processPaymentSimulation();
        });
    }

    // Envío del pago PSE
    if (pseForm) {
        pseForm.addEventListener('submit', (e) => {
            e.preventDefault();
            processPaymentSimulation();
        });
    }

    // Simulación del procesamiento de la transacción
    const processPaymentSimulation = () => {
        cardForm.style.display = 'none';
        pseForm.style.display = 'none';
        gatewayLoader.style.display = 'flex';
        gatewayLoader.classList.remove('hidden');

        setTimeout(() => {
            // Pago Exitoso! Ocultar loader y pasarela
            gatewayLoader.classList.add('hidden');
            gatewayLoader.style.display = 'none';
            gatewayModal.classList.remove('show');

            // Registrar reserva en la base de datos MySQL
            const product = checkoutState.product;
            const totals = calculateTotals();
            const bookingPayload = {
                productId: product.id,
                checkIn: product.priceType === 'night' ? checkoutState.checkin : checkoutState.singleDate,
                checkOut: product.priceType === 'night' ? checkoutState.checkout : checkoutState.singleDate,
                guests: checkoutState.guests,
                children: checkoutState.children,
                totalPrice: totals.finalTotal,
                customerName: checkoutState.customer ? checkoutState.customer.name : '',
                customerDocType: checkoutState.customer ? checkoutState.customer.docType : '',
                customerDocNum: checkoutState.customer ? checkoutState.customer.docNum : '',
                customerEmail: checkoutState.customer ? checkoutState.customer.email : '',
                customerPhone: checkoutState.customer ? checkoutState.customer.phone : '',
                customerDob: checkoutState.customer ? checkoutState.customer.dob : '',
                customerNotes: checkoutState.customer ? checkoutState.customer.notes : '',
                customerCountry: checkoutState.customer ? checkoutState.customer.country : 'Colombia',
                customerDepartment: checkoutState.customer ? checkoutState.customer.department : '',
                customerCity: checkoutState.customer ? checkoutState.customer.city : ''
            };
            window.BookingData.saveBooking(bookingPayload).then(response => {
                console.log("Reserva registrada con éxito:", response);
            }).catch(error => {
                console.error("No se pudo registrar la reserva en la base de datos:", error);
            });

            setTimeout(() => {
                gatewayModal.style.display = 'none';

                // Mostrar Voucher de Reserva
                showReservationTicket();
            }, 300);

        }, 2200); // 2.2 segundos de simulación de procesamiento bancario
    };

    // --- 5. Voucher de Reserva Digital y QR ---
    const voucherModal = document.getElementById('modal-voucher');
    const closeVoucherBtn = document.querySelector('.close-voucher-modal');
    const btnPrintTicket = document.getElementById('btn-print-ticket');

    if (closeVoucherBtn) {
        closeVoucherBtn.addEventListener('click', () => {
            voucherModal.classList.remove('show');
            setTimeout(() => {
                voucherModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        });
    }

    const showReservationTicket = () => {
        const product = checkoutState.product;
        const totals = calculateTotals();

        // Generar ID de Reserva Aleatorio
        const ticketId = 'EC-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('ticket-id').textContent = ticketId;

        // Inyectar datos
        document.getElementById('t-title').textContent = product.title;
        document.getElementById('t-category').textContent = product.category;

        if (product.priceType === 'night') {
            document.getElementById('t-date').textContent = `${checkoutState.checkin} al ${checkoutState.checkout} (${totals.nights} n)`;
        } else {
            document.getElementById('t-date').textContent = checkoutState.singleDate;
        }

        document.getElementById('t-guests').textContent = `${checkoutState.guests} Adulto(s) ${checkoutState.children > 0 ? `, ${checkoutState.children} Niños` : ''}`;
        document.getElementById('t-client').textContent = checkoutState.customer.name;
        document.getElementById('t-contact').textContent = checkoutState.customer.phone;

        // Addons list
        const addonsLbl = document.getElementById('t-addons');
        const addonsRow = document.getElementById('t-addons-row');
        if (checkoutState.addons.length > 0) {
            addonsRow.style.display = 'flex';
            const addonNames = checkoutState.addons.map(id => window.BookingData.getAddonDetails(id).name);
            addonsLbl.textContent = addonNames.join(', ');
        } else {
            addonsRow.style.display = 'none';
        }

        document.getElementById('t-price').textContent = `$${totals.finalTotal.toLocaleString('es-CO')} COP`;

        // Generar QR Dinámico de QRServer
        const qrImg = document.getElementById('t-qr');
        const qrDataString = `Eco Conexion Calima\nTicket: ${ticketId}\nCliente: ${checkoutState.customer.name}\nPlan: ${product.title}\nTotal: $${totals.finalTotal.toLocaleString('es-CO')} COP`;
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrDataString)}`;

        // Mostrar Voucher Modal
        voucherModal.style.display = 'block';
        setTimeout(() => voucherModal.classList.add('show'), 10);
        document.body.style.overflow = 'hidden';
    };

    // Imprimir Voucher
    if (btnPrintTicket) {
        btnPrintTicket.addEventListener('click', () => {
            window.print();
        });
    }

    // --- 6. Función para Cerrar Modal Base ---
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    window.addEventListener('click', (event) => {
        if (event.target === modalBase) {
            closeModal();
        }
    });

    function closeModal() {
        if (!modalBase) return;

        modalBase.classList.remove('show');
        setTimeout(() => {
            modalBase.classList.remove('booking-modal-open');
            modalBase.style.display = 'none';
            // Solo restaurar scroll si los otros modales no están abiertos
            if (gatewayModal.style.display !== 'block' && voucherModal.style.display !== 'block') {
                document.body.style.overflow = 'auto';
            }
        }, 300);
    }

    // Inicializar explorer al cargar
    initExplorer();
    initBookingPage();
});

