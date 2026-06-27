/**
 * lang-switcher.js
 * Selector de idioma premium + auto-detección por IP
 * Eco Conexión Calima – compartido en todas las páginas públicas
 */

/* ── 1. Suprimir barra nativa de Google Translate ── */
(function suppressGoogleBar() {
    const style = document.createElement('style');
    style.textContent = [
        '.goog-te-banner-frame, .goog-te-menu-frame { display:none !important; }',
        'body { top: 0 !important; }',
        '.skiptranslate { display:none !important; }',
        'iframe.goog-te-menu-frame { display:none !important; }'
    ].join('');
    document.head.appendChild(style);
})();

/* ── 2. Inicializar Google Translate (silencioso) ── */
window.googleTranslateInit = function () {
    new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'en,fr,pt,de,it,ja,zh-CN,ko,ru,ar',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
    }, 'google_translate_element');
};

/* ── 3. Selector de idioma premium ── */
(function initLangSwitcher() {
    // Inyectar HTML del selector si no existe ya en la página
    const existingTrigger = document.getElementById('lang-trigger');
    if (!existingTrigger) return; // El HTML debe estar ya en la página

    const trigger  = document.getElementById('lang-trigger');
    const flagSpan = document.getElementById('lang-current-flag');
    const switcher = document.getElementById('lang-switcher');

    /* Abrir / cerrar */
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = switcher.classList.toggle('open');
        trigger.setAttribute('aria-expanded', open);
    });

    /* Cerrar al hacer clic fuera */
    document.addEventListener('click', () => {
        switcher.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
    });

    /* Seleccionar idioma */
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            const lang = opt.dataset.lang;
            const flag = opt.dataset.flag;

            document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            flagSpan.textContent = flag;

            switcher.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');

            if (lang === 'es') {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=' + location.hostname;
                // Limpiar flag para permitir re-detección manual si se vuelve a español
                localStorage.removeItem('eco_lang_detected');
                location.reload();
                return;
            }

            const cookieVal = '/es/' + lang;
            document.cookie = 'googtrans=' + cookieVal + '; path=/';
            document.cookie = 'googtrans=' + cookieVal + '; path=/; domain=' + location.hostname;
            // Marcar que el usuario eligió manualmente → no auto-detectar
            localStorage.setItem('eco_lang_detected', 'manual');
            location.reload();
        });
    });

    /* Detectar idioma activo desde cookie al cargar */
    const match = document.cookie.match(/googtrans=\/[a-z-]+\/([a-zA-Z-CN]+)/);
    if (match) {
        const activeLang = match[1];
        const activeOpt  = document.querySelector(`.lang-option[data-lang="${activeLang}"]`);
        if (activeOpt) {
            document.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
            activeOpt.classList.add('active');
            flagSpan.textContent = activeOpt.dataset.flag;
        }
    }
})();

/* ── 4. Auto-detección de idioma por país (solo primera visita) ── */
(async function autoDetectLanguage() {
    const alreadyDetected = localStorage.getItem('eco_lang_detected');
    const hasLangCookie   = document.cookie.includes('googtrans=');
    if (alreadyDetected || hasLangCookie) return;

    const countryToLang = {
        US:'en', GB:'en', AU:'en', CA:'en', NZ:'en', IE:'en',
        ZA:'en', IN:'en', PH:'en', SG:'en', MY:'en', NG:'en',
        GH:'en', KE:'en', UG:'en', TZ:'en',
        BR:'pt', PT:'pt', AO:'pt', MZ:'pt', CV:'pt',
        FR:'fr', BE:'fr', CI:'fr', SN:'fr', CM:'fr',
        ML:'fr', BF:'fr', NE:'fr', TG:'fr',
        DE:'de', AT:'de', LI:'de', LU:'de',
        IT:'it', SM:'it',
        CN:'zh-CN', TW:'zh-CN', HK:'zh-CN', MO:'zh-CN',
        JP:'ja',
        KR:'ko',
        SA:'ar', AE:'ar', EG:'ar', MA:'ar', DZ:'ar',
        TN:'ar', JO:'ar', LB:'ar', KW:'ar', QA:'ar',
        BH:'ar', OM:'ar', IQ:'ar', SY:'ar', LY:'ar', YE:'ar',
        RU:'ru', BY:'ru', KZ:'ru',
    };

    const spanishCountries = new Set([
        'CO','MX','ES','AR','CL','PE','VE','EC','BO','PY',
        'UY','CR','PA','HN','GT','SV','DO','CU','NI','PR','GQ'
    ]);

    try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 3000);
        const res        = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return;

        const data    = await res.json();
        const country = (data.country_code || '').toUpperCase();

        localStorage.setItem('eco_lang_detected', 'auto');

        if (!country || spanishCountries.has(country)) return;

        const lang = countryToLang[country];
        if (!lang) return;

        const cookieVal = '/es/' + lang;
        document.cookie = 'googtrans=' + cookieVal + '; path=/';
        document.cookie = 'googtrans=' + cookieVal + '; path=/; domain=' + location.hostname;
        location.reload();
    } catch (_) {
        localStorage.setItem('eco_lang_detected', 'error');
    }
})();
