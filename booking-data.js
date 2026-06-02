/**
 * Eco Conexión Calima - Base de Datos y Lógica de Sincronización
 * Actúa como base de datos local y permite la integración con localStorage para el panel de administración (/admin).
 */

// Lista maestra de servicios adicionales (Addons)
const MASTER_ADDONS = {
    "transporte-cali": {
        id: "transporte-cali",
        name: "Transporte desde Cali/Buga (Ida y Vuelta)",
        price: 50000,
        type: "person",
        description: "Transporte en van compartida con aire acondicionado."
    },
    "almuerzo-premium": {
        id: "almuerzo-premium",
        name: "Almuerzo Premium de la Casa",
        price: 25000,
        type: "person",
        description: "Menú gourmet con entrada, plato fuerte típico y bebida natural."
    },
    "decoracion-romantica": {
        id: "decoracion-romantica",
        name: "Decoración Romántica Especial",
        price: 120000,
        type: "booking",
        description: "Pétalos de rosa, velas decorativas, globos y botella de champaña."
    },
    "jetski-extra": {
        id: "jetski-extra",
        name: "Paseo adicional en Jetski (20 min)",
        price: 85000,
        type: "booking",
        description: "Moto acuática de última generación (1 o 2 personas)."
    },
    "guia-ingles": {
        id: "guia-ingles",
        name: "Intérprete / Guía Bilingüe (Inglés)",
        price: 70000,
        type: "booking",
        description: "Guía privado certificado con manejo de inglés fluido."
    }
};

// Catálogo base de servicios turísticos del Lago Calima
const INITIAL_PRODUCTS = [
    {
        id: "glamping-altavista",
        category: "alojamiento",
        title: "Glamping Altavista Lago Calima",
        subtitle: "Alojamiento exclusivo con vista de 180° al lago",
        rating: 4.9,
        reviewsCount: 38,
        price: 290000,
        priceType: "night",
        image: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Vista al Lago", "Jacuzzi Privado", "Malla Catamarán", "Desayuno Incluido", "Wifi Premium", "Fogata"],
        maxGuests: 4,
        childDiscountRate: 0.5,
        addons: ["transporte-cali", "decoracion-romantica", "jetski-extra"]
    },
    {
        id: "hotel-campestre-calima",
        category: "alojamiento",
        title: "Eco-Hotel Campestre Lago Calima",
        subtitle: "Habitaciones confortables rodeadas de naturaleza y senderos",
        rating: 4.7,
        reviewsCount: 54,
        price: 180000,
        priceType: "night",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Piscina Climatizada", "Zonas Verdes", "Restaurante", "Parqueadero", "Sendero Ecológico", "Zona de Hamacas"],
        maxGuests: 6,
        childDiscountRate: 0.4,
        addons: ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    },
    {
        id: "chalet-familiar-dariend",
        category: "alojamiento",
        title: "Chalet Familiar Calima Darién",
        subtitle: "Finca campestre ideal para grupos y familias",
        rating: 4.8,
        reviewsCount: 22,
        price: 450000,
        priceType: "night",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Cocina Equipada", "Asador BBQ", "Piscina Privada", "Cancha de Fútbol", "Admite Mascotas"],
        maxGuests: 12,
        childDiscountRate: 0.5,
        addons: ["transporte-cali", "almuerzo-premium", "jetski-extra"]
    },
    {
        id: "pasadia-duende",
        category: "pasadia",
        title: "Pasadía Cascadas del Duende",
        subtitle: "Senderismo ecológico guiado y circuito por cascadas cristalinas",
        rating: 4.9,
        reviewsCount: 76,
        price: 85000,
        priceType: "person",
        image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Guía Local Certificado", "Entrada a Reserva Natural", "Seguro de Asistencia Médica", "Refrigerio Tradicional", "Baño de Cascada"],
        maxGuests: 25,
        childDiscountRate: 0.3,
        addons: ["transporte-cali", "almuerzo-premium"]
    },
    {
        id: "pasadia-shinrin-yoku",
        category: "pasadia",
        title: "Baño de Bosque & Bienestar",
        subtitle: "Experiencia de Shinrin-Yoku y meditación guiada en la naturaleza",
        rating: 5.0,
        reviewsCount: 19,
        price: 95000,
        priceType: "person",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Terapeuta Shinrin-Yoku", "Sesión de Yoga Aire Libre", "Infusión Herbal de Bienestar", "Seguro Médico", "Caminata Consciente"],
        maxGuests: 15,
        childDiscountRate: 0.0,
        addons: ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    },
    {
        id: "deporte-windsurf-kitesurf",
        category: "deportes",
        title: "Curso de Kitesurf o Windsurf",
        subtitle: "Clases de iniciación personalizadas con instructores avalados",
        rating: 4.8,
        reviewsCount: 31,
        price: 180000,
        priceType: "person",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Equipo Completo Incluido", "Instructor Certificado", "Lancha de Apoyo", "Chaleco Salvavidas", "1.5 Horas de Práctica"],
        maxGuests: 5,
        childDiscountRate: 0.1,
        addons: ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    },
    {
        id: "deporte-paddle-tour",
        category: "deportes",
        title: "Tour Guiado en Paddle Board / Kayak",
        subtitle: "Navegación al amanecer o atardecer por los rincones del lago",
        rating: 4.9,
        reviewsCount: 47,
        price: 75000,
        priceType: "person",
        image: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Tabla de Stand Up Paddle", "Remo y Chaleco", "Instrucción Básica", "Registro Fotográfico", "Tour de 2 Horas"],
        maxGuests: 15,
        childDiscountRate: 0.2,
        addons: ["transporte-cali", "almuerzo-premium", "jetski-extra"]
    },
    {
        id: "paquete-lago-rio-bravo",
        category: "paquetes",
        title: "Paquete Lago y Río Bravo (2 Días)",
        subtitle: "El balance perfecto entre cultura local, agua y naturaleza activa",
        rating: 4.9,
        reviewsCount: 14,
        price: 320000,
        priceType: "person",
        image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
        gallery: [
            "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop",
            "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop"
        ],
        features: ["Alojamiento 1 Noche", "Visita al Museo Arqueológico", "Tour en Pontón (40 Min)", "Senderismo Cascada Río Bravo", "Desayuno y Almuerzo"],
        maxGuests: 10,
        childDiscountRate: 0.4,
        addons: ["transporte-cali", "jetski-extra", "guia-ingles"]
    }
];

// --- FUNCIONES DE COMUNICACIÓN CON BASE DE DATOS LOCALSTORAGE ---

/**
 * Obtener todos los productos fusionando el catálogo base con los agregados por el administrador.
 */
function getProducts() {
    const customProducts = JSON.parse(localStorage.getItem('ecocalima_custom_products')) || [];
    return [...INITIAL_PRODUCTS, ...customProducts];
}

/**
 * Obtener un producto específico por ID.
 */
function getProductById(id) {
    const all = getProducts();
    return all.find(p => p.id === id);
}

/**
 * Guardar un nuevo producto en la base de datos de localStorage.
 */
function saveProduct(product) {
    const customProducts = JSON.parse(localStorage.getItem('ecocalima_custom_products')) || [];

    // Validar id único
    if (getProductById(product.id)) {
        product.id = product.id + '-' + Date.now();
    }

    customProducts.push(product);
    localStorage.setItem('ecocalima_custom_products', JSON.stringify(customProducts));
    return product;
}

/**
 * Eliminar un producto personalizado.
 */
function deleteProduct(id) {
    const customProducts = JSON.parse(localStorage.getItem('ecocalima_custom_products')) || [];
    const filtered = customProducts.filter(p => p.id !== id);
    localStorage.setItem('ecocalima_custom_products', JSON.stringify(filtered));
    return true;
}

/**
 * Obtener detalles de un servicio adicional (Addon).
 */
function getAddonDetails(addonId) {
    return MASTER_ADDONS[addonId] || null;
}

/**
 * Obtener todos los servicios adicionales.
 */
function getAllAddons() {
    return MASTER_ADDONS;
}

/**
 * Íconos SVG profesionales para categorías.
 * No usa emojis ni librerías externas.
 */
const CATEGORY_ICONS = {
    todos: `
        <svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <rect x="4" y="4" width="6" height="6" rx="1.5"></rect>
            <rect x="14" y="4" width="6" height="6" rx="1.5"></rect>
            <rect x="4" y="14" width="6" height="6" rx="1.5"></rect>
            <rect x="14" y="14" width="6" height="6" rx="1.5"></rect>
        </svg>
    `,

    alojamiento: `
        <svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 18v-6a2 2 0 0 1 2-2h4a3 3 0 0 1 3 3v5"></path>
            <path d="M12 18v-3a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v3"></path>
            <path d="M3 18h18"></path>
            <path d="M5 8V6.5A1.5 1.5 0 0 1 6.5 5h1A1.5 1.5 0 0 1 9 6.5V8"></path>
            <path d="M3 21v-3"></path>
            <path d="M21 21v-3"></path>
        </svg>
    `,

    pasadia: `
        <svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M19 4C12 4 6 9.5 6 16.5"></path>
            <path d="M19 4c1 7-4.5 13-11.5 13"></path>
            <path d="M6 20c1.5-5 5-8.5 10-11"></path>
        </svg>
    `,

    deportes: `
        <svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M3 16c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"></path>
            <path d="M3 20c2 0 2-1.5 4-1.5s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5 2-1.5 4-1.5"></path>
            <path d="M8 10l4-6 4 6"></path>
            <path d="M12 4v10"></path>
        </svg>
    `,

    paquetes: `
        <svg class="category-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M4 8l8-4 8 4-8 4-8-4z"></path>
            <path d="M4 8v8l8 4 8-4V8"></path>
            <path d="M12 12v8"></path>
            <path d="M8 6l8 4"></path>
        </svg>
    `
};

/**
 * Mapeo de categorías a etiquetas e íconos profesionales.
 */
const CATEGORIES = {
    "todos": {
        label: "Ver Todos",
        icon: CATEGORY_ICONS.todos
    },
    "alojamiento": {
        label: "Alojamientos",
        icon: CATEGORY_ICONS.alojamiento
    },
    "pasadia": {
        label: "Pasadías",
        icon: CATEGORY_ICONS.pasadia
    },
    "deportes": {
        label: "Aventura y Agua",
        icon: CATEGORY_ICONS.deportes
    },
    "paquetes": {
        label: "Paquetes",
        icon: CATEGORY_ICONS.paquetes
    }
};

// Exportar objetos para uso en navegadores
window.BookingData = {
    getProducts,
    getProductById,
    saveProduct,
    deleteProduct,
    getAddonDetails,
    getAllAddons,
    CATEGORIES
};
