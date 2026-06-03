<?php
// Eco Conexión Calima - API Backend en PHP para MySQL
header('Content-Type: application/json');
require_once 'config.php';

// Obtener la acción solicitada
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Copia de los productos por defecto del sistema para lógica de reestablecer y comprobación de anulaciones
$DEFAULT_PRODUCTS = [
    'glamping-altavista' => [
        'category' => 'alojamiento',
        'title' => 'Glamping Altavista Lago Calima',
        'subtitle' => 'Alojamiento exclusivo con vista de 180° al lago',
        'rating' => 4.9,
        'reviews_count' => 38,
        'price' => 290000,
        'price_type' => 'night',
        'image' => 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 4,
        'child_discount_rate' => 0.5,
        'features' => ["Vista al Lago", "Jacuzzi Privado", "Malla Catamarán", "Desayuno Incluido", "Wifi Premium", "Fogata"],
        'addons' => ["transporte-cali", "decoracion-romantica", "jetski-extra"]
    ],
    'hotel-campestre-calima' => [
        'category' => 'alojamiento',
        'title' => 'Eco-Hotel Campestre Lago Calima',
        'subtitle' => 'Habitaciones confortables rodeadas de naturaleza y senderos',
        'rating' => 4.7,
        'reviews_count' => 54,
        'price' => 180000,
        'price_type' => 'night',
        'image' => 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 6,
        'child_discount_rate' => 0.4,
        'features' => ["Piscina Climatizada", "Zonas Verdes", "Restaurante", "Parqueadero", "Sendero Ecológico", "Zona de Hamacas"],
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    ],
    'chalet-familiar-dariend' => [
        'category' => 'alojamiento',
        'title' => 'Chalet Familiar Calima Darién',
        'subtitle' => 'Finca campestre ideal para grupos y familias',
        'rating' => 4.8,
        'reviews_count' => 22,
        'price' => 450000,
        'price_type' => 'night',
        'image' => 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 12,
        'child_discount_rate' => 0.5,
        'features' => ["Cocina Equipada", "Asador BBQ", "Piscina Privada", "Cancha de Fútbol", "Admiten Mascotas"],
        'addons' => ["transporte-cali", "almuerzo-premium", "jetski-extra"]
    ],
    'pasadia-duende' => [
        'category' => 'pasadia',
        'title' => 'Pasadía Cascadas del Duende',
        'subtitle' => 'Senderismo ecológico guiado y circuito por cascadas cristalinas',
        'rating' => 4.9,
        'reviews_count' => 76,
        'price' => 85000,
        'price_type' => 'person',
        'image' => 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 25,
        'child_discount_rate' => 0.3,
        'features' => ["Guía Local Certificado", "Entrada a Reserva Natural", "Seguro de Asistencia Médica", "Refrigerio Tradicional", "Baño de Cascada"],
        'addons' => ["transporte-cali", "almuerzo-premium"]
    ],
    'pasadia-shinrin-yoku' => [
        'category' => 'pasadia',
        'title' => 'Baño de Bosque & Bienestar',
        'subtitle' => 'Experiencia de Shinrin-Yoku y meditación guiada en la naturaleza',
        'rating' => 5.0,
        'reviews_count' => 19,
        'price' => 95000,
        'price_type' => 'person',
        'image' => 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 15,
        'child_discount_rate' => 0.0,
        'features' => ["Terapeuta Shinrin-Yoku", "Sesión de Yoga Aire Libre", "Infusión Herbal de Bienestar", "Seguro Médico", "Caminata Consciente"],
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    ],
    'deporte-windsurf-kitesurf' => [
        'category' => 'deportes',
        'title' => 'Curso de Kitesurf o Windsurf',
        'subtitle' => 'Clases de iniciación personalizadas con instructores avalados',
        'rating' => 4.8,
        'reviews_count' => 31,
        'price' => 180000,
        'price_type' => 'person',
        'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 5,
        'child_discount_rate' => 0.1,
        'features' => ["Equipo Completo Incluido", "Instructor Certificado", "Lancha de Apoyo", "Chaleco Salvavidas", "1.5 Horas de Práctica"],
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"]
    ],
    'deporte-paddle-tour' => [
        'category' => 'deportes',
        'title' => 'Tour Guiado en Paddle Board / Kayak',
        'subtitle' => 'Navegación al amanecer o atardecer por los rincones del lago',
        'rating' => 4.9,
        'reviews_count' => 47,
        'price' => 75000,
        'price_type' => 'person',
        'image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 15,
        'child_discount_rate' => 0.2,
        'features' => ["Tabla de Stand Up Paddle", "Remo y Chaleco", "Instrucción Básica", "Registro Fotográfico", "Tour de 2 Horas"],
        'addons' => ["transporte-cali", "almuerzo-premium", "jetski-extra"]
    ],
    'paquete-lago-rio-bravo' => [
        'category' => 'paquetes',
        'title' => 'Paquete Lago y Río Bravo (2 Días)',
        'subtitle' => 'El balance perfecto entre cultura local, agua y naturaleza activa',
        'rating' => 4.9,
        'reviews_count' => 14,
        'price' => 320000,
        'price_type' => 'person',
        'image' => 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
        'max_guests' => 10,
        'child_discount_rate' => 0.4,
        'features' => ["Alojamiento 1 Noche", "Visita al Museo Arqueológico", "Tour en Pontón (40 Min)", "Senderismo Cascada Río Bravo", "Desayuno y Almuerzo"],
        'addons' => ["transporte-cali", "jetski-extra", "guia-ingles"]
    ]
];

switch ($action) {
    case 'get_products':
        try {
            $stmt = $pdo->query("SELECT * FROM products");
            $products = $stmt->fetchAll();

            foreach ($products as &$p) {
                // Obtener comodidades (features)
                $fStmt = $pdo->prepare("SELECT feature FROM product_features WHERE product_id = ?");
                $fStmt->execute([$p['id']]);
                $p['features'] = $fStmt->fetchAll(PDO::FETCH_COLUMN);

                // Obtener adicionales (addons)
                $aStmt = $pdo->prepare("SELECT addon_id FROM product_addons WHERE product_id = ?");
                $aStmt->execute([$p['id']]);
                $p['addons'] = $aStmt->fetchAll(PDO::FETCH_COLUMN);

                // Formatear tipos de datos para Javascript
                $p['price'] = (int)$p['price'];
                $p['reviewsCount'] = (int)$p['reviews_count'];
                $p['rating'] = (float)$p['rating'];
                $p['maxGuests'] = (int)$p['max_guests'];
                $p['childDiscountRate'] = (float)$p['child_discount_rate'];
                $p['priceType'] = $p['price_type'];
                
                // Galería (por base de datos guardamos solo la principal en un arreglo)
                $p['gallery'] = [$p['image']];

                // Comprobar si es un servicio del sistema modificado (override)
                $isOverridden = false;
                if (isset($DEFAULT_PRODUCTS[$p['id']])) {
                    $default = $DEFAULT_PRODUCTS[$p['id']];
                    if ($p['title'] !== $default['title'] ||
                        $p['price'] !== $default['price'] ||
                        $p['subtitle'] !== $default['subtitle'] ||
                        $p['category'] !== $default['category'] ||
                        $p['priceType'] !== $default['price_type'] ||
                        $p['image'] !== $default['image'] ||
                        $p['maxGuests'] !== $default['max_guests'] ||
                        $p['childDiscountRate'] !== $default['child_discount_rate'] ||
                        count(array_diff($p['features'], $default['features'])) > 0 ||
                        count(array_diff($default['features'], $p['features'])) > 0 ||
                        count(array_diff($p['addons'], $default['addons'])) > 0 ||
                        count(array_diff($default['addons'], $p['addons'])) > 0
                    ) {
                        $isOverridden = true;
                    }
                }
                $p['isOverridden'] = $isOverridden;

                // Limpiar llaves duplicadas o en snake_case innecesarias
                unset($p['price_type']);
                unset($p['reviews_count']);
                unset($p['max_guests']);
                unset($p['child_discount_rate']);
            }

            echo json_encode($products);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_product':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                throw new \Exception("Datos de entrada inválidos.");
            }

            // Iniciar Transacción para asegurar consistencia
            $pdo->beginTransaction();

            // Insertar o actualizar tabla principal de productos
            $sql = "INSERT INTO products (id, category, title, subtitle, rating, reviews_count, price, price_type, image, max_guests, child_discount_rate)
                    VALUES (:id, :category, :title, :subtitle, :rating, :reviews_count, :price, :price_type, :image, :max_guests, :child_discount_rate)
                    ON DUPLICATE KEY UPDATE 
                        category = VALUES(category),
                        title = VALUES(title),
                        subtitle = VALUES(subtitle),
                        price = VALUES(price),
                        price_type = VALUES(price_type),
                        image = VALUES(image),
                        max_guests = VALUES(max_guests),
                        child_discount_rate = VALUES(child_discount_rate)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':category' => $input['category'],
                ':title' => $input['title'],
                ':subtitle' => $input['subtitle'],
                ':rating' => isset($input['rating']) ? (float)$input['rating'] : 5.0,
                ':reviews_count' => isset($input['reviewsCount']) ? (int)$input['reviewsCount'] : 1,
                ':price' => (int)$input['price'],
                ':price_type' => $input['priceType'],
                ':image' => $input['image'],
                ':max_guests' => (int)$input['maxGuests'],
                ':child_discount_rate' => (float)$input['childDiscountRate']
            ]);

            // Guardar comodidades (Features)
            $pdo->prepare("DELETE FROM product_features WHERE product_id = ?")->execute([$input['id']]);
            if (isset($input['features']) && is_array($input['features'])) {
                $fStmt = $pdo->prepare("INSERT INTO product_features (product_id, feature) VALUES (?, ?)");
                foreach ($input['features'] as $feature) {
                    $fStmt->execute([$input['id'], $feature]);
                }
            }

            // Guardar adicionales vinculados (Addons)
            $pdo->prepare("DELETE FROM product_addons WHERE product_id = ?")->execute([$input['id']]);
            if (isset($input['addons']) && is_array($input['addons'])) {
                $aStmt = $pdo->prepare("INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)");
                foreach ($input['addons'] as $addonId) {
                    $aStmt->execute([$input['id'], $addonId]);
                }
            }

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Servicio guardado correctamente.']);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'delete_product':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? $input['id'] : '';

            if (!$id) {
                throw new \Exception("ID de producto no proporcionado.");
            }

            $pdo->beginTransaction();

            if (strpos($id, 'custom-') === 0) {
                // Es un servicio totalmente personalizado creado en localStorage, lo borramos de la DB
                $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
                $stmt->execute([$id]);
            } else {
                // Es un servicio de sistema. Para reestablecerlo, volvemos a escribir sus valores iniciales por defecto.
                if (isset($DEFAULT_PRODUCTS[$id])) {
                    $default = $DEFAULT_PRODUCTS[$id];

                    // Actualizar tabla principal
                    $sql = "UPDATE products SET 
                                category = :category,
                                title = :title,
                                subtitle = :subtitle,
                                rating = :rating,
                                reviews_count = :reviews_count,
                                price = :price,
                                price_type = :price_type,
                                image = :image,
                                max_guests = :max_guests,
                                child_discount_rate = :child_discount_rate
                            WHERE id = :id";
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute([
                        ':id' => $id,
                        ':category' => $default['category'],
                        ':title' => $default['title'],
                        ':subtitle' => $default['subtitle'],
                        ':rating' => (float)$default['rating'],
                        ':reviews_count' => (int)$default['reviews_count'],
                        ':price' => (int)$default['price'],
                        ':price_type' => $default['price_type'],
                        ':image' => $default['image'],
                        ':max_guests' => (int)$default['max_guests'],
                        ':child_discount_rate' => (float)$default['child_discount_rate']
                    ]);

                    // Reestablecer comodidades (features)
                    $pdo->prepare("DELETE FROM product_features WHERE product_id = ?")->execute([$id]);
                    $fStmt = $pdo->prepare("INSERT INTO product_features (product_id, feature) VALUES (?, ?)");
                    foreach ($default['features'] as $feature) {
                        $fStmt->execute([$id, $feature]);
                    }

                    // Reestablecer adicionales (addons)
                    $pdo->prepare("DELETE FROM product_addons WHERE product_id = ?")->execute([$id]);
                    $aStmt = $pdo->prepare("INSERT INTO product_addons (product_id, addon_id) VALUES (?, ?)");
                    foreach ($default['addons'] as $addonId) {
                        $aStmt->execute([$id, $addonId]);
                    }
                }
            }

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Servicio reestablecido/eliminado.']);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_addons':
        try {
            $stmt = $pdo->query("SELECT * FROM addons");
            $addons = $stmt->fetchAll();
            foreach ($addons as &$a) {
                $a['price'] = (int)$a['price'];
            }
            echo json_encode($addons);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_addon':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id'])) {
                throw new \Exception("Datos de adicional inválidos.");
            }

            $sql = "INSERT INTO addons (id, name, price, type, description)
                    VALUES (:id, :name, :price, :type, :description)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        price = VALUES(price),
                        type = VALUES(type),
                        description = VALUES(description)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':price' => (int)$input['price'],
                ':type' => $input['type'],
                ':description' => isset($input['description']) ? $input['description'] : 'Servicio opcional premium.'
            ]);

            echo json_encode(['status' => 'success', 'message' => 'Adicional guardado correctamente.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_booking':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['productId'])) {
                throw new \Exception("Datos de reserva incompletos.");
            }

            $sql = "INSERT INTO bookings (product_id, check_in, check_out, guests, children, total_price)
                    VALUES (:product_id, :check_in, :check_out, :guests, :children, :total_price)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':product_id' => $input['productId'],
                ':check_in' => $input['checkIn'],
                ':check_out' => $input['checkOut'],
                ':guests' => (int)$input['guests'],
                ':children' => (int)$input['children'],
                ':total_price' => (int)$input['totalPrice']
            ]);

            echo json_encode(['status' => 'success', 'booking_id' => $pdo->lastInsertId(), 'message' => 'Reserva creada correctamente en la base de datos MySQL.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Acción no válida.']);
        break;
}
?>
