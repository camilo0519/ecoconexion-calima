/**
 * Eco Conexión Calima - Base de Datos y Lógica de Sincronización con PHP/MySQL
 * Permite la integración transparente entre el frontend y la base de datos real mediante llamadas asíncronas a api.php.
 */

let cachedProducts = [];
let cachedAddons = {};

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

// Inicializar datos cargándolos desde la base de datos MySQL (vía api.php)
async function init() {
    try {
        const [prodRes, addonRes] = await Promise.all([
            fetch('backend/api.php?action=get_products'),
            fetch('backend/api.php?action=get_addons')
        ]);
        if (!prodRes.ok || !addonRes.ok) {
            throw new Error("Respuesta incorrecta de la API.");
        }
        cachedProducts = await prodRes.json();
        const addonsList = await addonRes.json();
        cachedAddons = {};
        addonsList.forEach(addon => {
            cachedAddons[addon.id] = addon;
        });
    } catch (e) {
        console.error("Falla al conectar con MySQL/API PHP. Usando localStorage de respaldo.", e);
        // Fallback local de emergencia en caso de que PHP no esté disponible
        cachedProducts = JSON.parse(localStorage.getItem('ecocalima_custom_products')) || [];
        cachedAddons = JSON.parse(localStorage.getItem('ecocalima_custom_addons')) || {};
    }
}

function getProducts() {
    return cachedProducts;
}

function getProductById(id) {
    return cachedProducts.find(p => p.id === id) || null;
}

async function saveProduct(product) {
    try {
        const res = await fetch('backend/api.php?action=save_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        const result = await res.json();
        await init();
        return result;
    } catch (e) {
        console.error("Error al guardar producto:", e);
        return { status: 'error', message: e.message };
    }
}

async function deleteProduct(id) {
    try {
        const res = await fetch('backend/api.php?action=delete_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        await init();
        return result;
    } catch (e) {
        console.error("Error al eliminar producto:", e);
        return { status: 'error', message: e.message };
    }
}

function isProductOverridden(id) {
    const p = getProductById(id);
    return p ? !!p.isOverridden : false;
}

function getAddonDetails(addonId) {
    return cachedAddons[addonId] || null;
}

function getAllAddons() {
    return cachedAddons;
}

async function saveAddon(addon) {
    try {
        const res = await fetch('backend/api.php?action=save_addon', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(addon)
        });
        const result = await res.json();
        await init();
        return result;
    } catch (e) {
        console.error("Error al guardar adicional:", e);
        return { status: 'error', message: e.message };
    }
}

async function saveBooking(booking) {
    try {
        const res = await fetch('backend/api.php?action=save_booking', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(booking)
        });
        return await res.json();
    } catch (e) {
        console.error("Error al guardar reserva:", e);
        return { status: 'error', message: e.message };
    }
}

// Exportar objetos para uso en navegadores
window.BookingData = {
    init,
    getProducts,
    getProductById,
    saveProduct,
    deleteProduct,
    isProductOverridden,
    getAddonDetails,
    getAllAddons,
    saveAddon,
    saveBooking,
    CATEGORIES
};
