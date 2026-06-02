/**
 * Eco Conexión Calima - Lógica del Buscador, Catálogo Dinámico y Motor de Reservas (Airbnb Style)
 */

document.addEventListener('DOMContentLoaded', () => {
    
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
                    <div class="wizard-footer">
                        <button class="btn btn-gold wizard-btn w-next-btn" id="w-btn-goto-2">Siguiente paso →</button>
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
                    <p class="wizard-step-lead">Déjanos tu información para enviarte confirmación, seguimiento y opciones de pago.</p>
                    <div class="wizard-card">
                    <div class="form-grid" style="display: grid; grid-template-columns: 1fr; gap: 15px;">
                        <div class="wizard-field-card full">
                            <label for="w-cust-name">Nombre Completo *</label>
                            <input type="text" id="w-cust-name" required placeholder="Ej: Juan Pérez">
                        </div>
                        <div class="form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div class="wizard-field-card">
                                <label for="w-cust-email">Correo Electrónico *</label>
                                <input type="email" id="w-cust-email" required placeholder="Ej: juan@perez.com">
                            </div>
                            <div class="wizard-field-card">
                                <label for="w-cust-phone">WhatsApp / Teléfono *</label>
                                <input type="tel" id="w-cust-phone" required placeholder="Ej: +57 312 345 6789">
                            </div>
                        </div>
                        <div class="wizard-field-card full">
                            <label for="w-cust-notes">Notas u observaciones adicionales</label>
                            <textarea id="w-cust-notes" rows="3" placeholder="Ej: Alergias, llegamos al mediodía, decoración sorpresa..."></textarea>
                        </div>
                    </div>
                    </div>
                    <div class="wizard-footer" style="display: flex; justify-content: space-between;">
                        <button class="btn btn-outline wizard-btn w-prev-btn" id="w-btn-back-2">← Atrás</button>
                        <button class="btn btn-gold wizard-btn w-next-btn" id="w-btn-goto-4">Ver resumen →</button>
                    </div>
                </div>

                <div class="wizard-step-content" id="w-step-4" style="display: none;">
                    <h3>Resumen de la cotización</h3>
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
                        ${p.features.length > 3 ? `<span class="card-feature-tag">+${p.features.length - 3} más</span>` : ''}
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

    const renderBookingWizard = (productId, mountNode, mode = 'modal') => {
        const product = window.BookingData.getProductById(productId);
        if (!product || !mountNode) return;

        bookingRenderMode = mode;

        checkoutState.product = product;
        checkoutState.guests = searchGuestsFilter;
        checkoutState.children = 0;
        checkoutState.addons = [];

        // Establecer fechas sugeridas basadas en la búsqueda
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (d) => d.toISOString().split('T')[0];

        checkoutState.singleDate = searchDateFilter || formatDate(today);
        checkoutState.checkin = searchCheckinFilter || searchDateFilter || formatDate(today);
        checkoutState.checkout = searchCheckoutFilter || formatDate(tomorrow);

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
            const nameInput = document.getElementById('w-cust-name');
            const emailInput = document.getElementById('w-cust-email');
            const phoneInput = document.getElementById('w-cust-phone');

            if (!nameInput.value || !emailInput.value || !phoneInput.value) {
                alert('Por favor completa todos los campos obligatorios del titular.');
                return;
            }

            // Guardar datos contacto
            checkoutState.customer = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                phone: phoneInput.value.trim(),
                notes: document.getElementById('w-cust-notes').value.trim()
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

        // Renderizar comentarios
        const reviewsCommentsContainer = document.getElementById('booking-page-reviews-comments');
        if (reviewsCommentsContainer) {
            const fakeReviews = [
                {
                    name: "Mariana Restrepo",
                    date: "Mayo de 2026",
                    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop",
                    comment: "Un lugar espectacular. La vista al lago desde el jacuzzi es inigualable. Los guías de Eco Conexión Calima fueron súper atentos y la comida del restaurante local estuvo deliciosa. Volveré sin duda."
                },
                {
                    name: "Carlos Mario Gómez",
                    date: "Abril de 2026",
                    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop",
                    comment: "Excelente servicio y hospitalidad. Todo coincide exactamente con la descripción. Reservar por el portal fue sencillísimo y el boleto con QR nos sirvió para ingresar de inmediato. El clima estuvo perfecto."
                }
            ];
            reviewsCommentsContainer.innerHTML = fakeReviews.map(r => `
                <div class="review-comment-card" style="display: flex; flex-direction: column; gap: 12px; padding: 20px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px;">
                    <div class="reviewer-header" style="display: flex; align-items: center; gap: 12px;">
                        <img src="${r.avatar}" alt="${r.name}" style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.15);">
                        <div>
                            <strong style="display: block; color: var(--white); font-size: 0.95rem;">${r.name}</strong>
                            <span style="font-size: 0.78rem; color: var(--text-light);">${r.date}</span>
                        </div>
                    </div>
                    <p style="color: var(--text-dark); font-size: 0.88rem; line-height: 1.5; margin: 0; font-style: italic;">"${r.comment}"</p>
                </div>
            `).join('');
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
            // Validar fechas
            if (product.priceType === 'night') {
                const cin = document.getElementById('w-card-checkin').value;
                const cout = document.getElementById('w-card-checkout').value;
                if (!cin || !cout) {
                    alert('Por favor selecciona las fechas de llegada y salida.');
                    return;
                }
                checkoutState.checkin = cin;
                checkoutState.checkout = cout;
            } else {
                const sdate = document.getElementById('w-card-singledate').value;
                if (!sdate) {
                    alert('Por favor selecciona la fecha de la experiencia.');
                    return;
                }
                checkoutState.singleDate = sdate;
            }

            checkoutState.guests = parseInt(document.getElementById('w-card-guests').value, 10);
            checkoutState.children = 0;

            // Abrir modal checkout
            const checkoutModal = document.getElementById('modal-checkout-flow');
            const wizardHost = document.getElementById('checkout-wizard-host');

            if (checkoutModal && wizardHost) {
                checkoutModal.style.display = 'block';
                setTimeout(() => checkoutModal.classList.add('show'), 10);
                document.body.style.overflow = 'hidden';

                // Renderizar wizard directamente en el modal
                renderBookingWizard(product.id, wizardHost, 'modal');

                // Avanzar programáticamente al Paso 2 (Adicionales)
                const step1Content = document.getElementById('w-step-1');
                const step2Content = document.getElementById('w-step-2');
                const ind1 = document.getElementById('w-step-ind-1');
                const ind2 = document.getElementById('w-step-ind-2');

                if (step1Content) step1Content.style.display = 'none';
                if (step2Content) step2Content.style.display = 'block';
                if (ind1) {
                    ind1.classList.remove('active');
                    ind1.classList.add('completed');
                }
                if (ind2) ind2.classList.add('active');

                // Renderizar los adicionales del Paso 2
                renderAddonsStep();
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
            const companyNumber = "573158191414"; // Número del main-header/footer
            
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

            message += `\n*Datos del Cliente:* \n`;
            message += `- Nombre: ${checkoutState.customer.name}\n`;
            message += `- Email: ${checkoutState.customer.email}\n`;
            message += `- WhatsApp: ${checkoutState.customer.phone}\n`;
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

