<?php
// Conexión Eco Calima - API Backend en PHP para MySQL
header('Content-Type: application/json');
require_once 'config.php';

// Función para asegurar la existencia de la tabla reviews
function ensureReviewsTableExists($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS reviews (
            id INT AUTO_INCREMENT PRIMARY KEY,
            product_id VARCHAR(50) NOT NULL,
            author VARCHAR(150) NOT NULL,
            email VARCHAR(255) NOT NULL DEFAULT '',
            rating DECIMAL(2,1) NOT NULL DEFAULT 5.0,
            comment TEXT NOT NULL,
            avatar VARCHAR(500) DEFAULT '',
            date DATE NOT NULL DEFAULT (CURRENT_DATE),
            status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'approved',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (\Exception $e) {
        // Ignorar errores si la tabla ya existe
    }
}

// Función para asegurar la existencia de la tabla partners y la columna partner_id
function ensurePartnersMigration($pdo) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS partners (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            description TEXT,
            logo VARCHAR(500) DEFAULT '',
            cover_image VARCHAR(500) DEFAULT '',
            contact_phone VARCHAR(50) DEFAULT '',
            contact_email VARCHAR(255) DEFAULT '',
            website VARCHAR(500) DEFAULT '',
            rnt VARCHAR(50) DEFAULT '',
            commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
            address VARCHAR(500) DEFAULT '',
            location_lat DECIMAL(10,7) DEFAULT NULL,
            location_lng DECIMAL(10,7) DEFAULT NULL,
            status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        $stmt = $pdo->query("SHOW COLUMNS FROM products");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('partner_id', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN partner_id VARCHAR(50) DEFAULT NULL, ADD FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL");
        }
    } catch (\Exception $e) {
        // Ignorar errores
    }
}

// Función para asegurar la presencia de la columna de descripción en la tabla de productos
function ensureDescriptionColumnExists($pdo) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM products");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

        if (!in_array('description', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN description TEXT NULL");
        }
        if (!in_array('images', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN images TEXT NULL");
        }
        if (!in_array('itinerary', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN itinerary TEXT NULL");
        }
        if (!in_array('status', $columns)) {
            $pdo->exec("ALTER TABLE products ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active'");
        }
    } catch (\Exception $e) {
        // Ignorar errores en caso de que la tabla aún no haya sido creada
    }
}

// Ejecutar migraciones automáticas
ensureReviewsTableExists($pdo);
ensurePartnersMigration($pdo);
ensureDescriptionColumnExists($pdo);

// Función para asegurar la presencia de las nuevas columnas de datos de cliente en la tabla de reservas
function ensureBookingColumnsExist($pdo) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM bookings");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

        $newColumns = [
            'customer_name' => "VARCHAR(255) NOT NULL DEFAULT ''",
            'customer_document_type' => "VARCHAR(20) NOT NULL DEFAULT ''",
            'customer_document_number' => "VARCHAR(50) NOT NULL DEFAULT ''",
            'customer_email' => "VARCHAR(255) NOT NULL DEFAULT ''",
            'customer_phone' => "VARCHAR(50) NOT NULL DEFAULT ''",
            'customer_birthdate' => "DATE NULL",
            'customer_notes' => "TEXT DEFAULT NULL",
            'customer_country' => "VARCHAR(100) NOT NULL DEFAULT 'Colombia'",
            'customer_department' => "VARCHAR(100) NOT NULL DEFAULT ''",
            'customer_city' => "VARCHAR(100) NOT NULL DEFAULT ''"
        ];

        foreach ($newColumns as $colName => $colDef) {
            if (!in_array($colName, $columns)) {
                $pdo->exec("ALTER TABLE bookings ADD COLUMN $colName $colDef");
            }
        }
    } catch (\Exception $e) {
        // Ignorar errores en caso de que la tabla aún no haya sido creada
    }
}

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
        'addons' => ["transporte-cali", "decoracion-romantica", "jetski-extra"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium", "jetski-extra"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium", "guia-ingles"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "almuerzo-premium", "jetski-extra"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
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
        'addons' => ["transporte-cali", "jetski-extra", "guia-ingles"],
        'description' => "Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región."
    ]
];

switch ($action) {
    case 'get_products':
        try {
            $stmt = $pdo->query("SELECT p.*, pa.name as partner_name, pa.logo as partner_logo, pa.commission_rate as partner_commission
                                FROM products p
                                LEFT JOIN partners pa ON p.partner_id = pa.id");
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
                $p['partnerId'] = $p['partner_id'];
                $p['partnerName'] = $p['partner_name'];
                $p['partnerLogo'] = $p['partner_logo'];
                $p['partnerCommission'] = $p['partner_commission'] ? (float)$p['partner_commission'] : 0;
                
                // Galería e Itinerario guardados en MySQL
                if (!empty($p['images'])) {
                    $decodedImages = json_decode($p['images'], true);
                    if (is_array($decodedImages) && count($decodedImages) > 0) {
                        $p['images'] = $decodedImages;
                        $p['gallery'] = $decodedImages;
                    } else {
                        $p['gallery'] = [$p['image']];
                    }
                } else {
                    $p['gallery'] = [$p['image']];
                }

                if (!empty($p['itinerary'])) {
                    $decodedItinerary = json_decode($p['itinerary'], true);
                    if (is_array($decodedItinerary)) {
                        $p['itinerary'] = $decodedItinerary;
                    }
                }

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
                unset($p['partner_id']);
                unset($p['partner_name']);
                unset($p['partner_logo']);
                unset($p['partner_commission']);
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
            $sql = "INSERT INTO products (id, partner_id, category, title, subtitle, rating, reviews_count, price, price_type, image, images, itinerary, max_guests, child_discount_rate, description)
                    VALUES (:id, :partner_id, :category, :title, :subtitle, :rating, :reviews_count, :price, :price_type, :image, :images, :itinerary, :max_guests, :child_discount_rate, :description)
                    ON DUPLICATE KEY UPDATE 
                        partner_id = VALUES(partner_id),
                        category = VALUES(category),
                        title = VALUES(title),
                        subtitle = VALUES(subtitle),
                        price = VALUES(price),
                        price_type = VALUES(price_type),
                        image = VALUES(image),
                        images = VALUES(images),
                        itinerary = VALUES(itinerary),
                        max_guests = VALUES(max_guests),
                        child_discount_rate = VALUES(child_discount_rate),
                        description = VALUES(description)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':partner_id' => (!empty($input['partnerId']) && trim($input['partnerId']) !== '') ? $input['partnerId'] : null,
                ':category' => !empty($input['category']) ? $input['category'] : 'pasadia',
                ':title' => !empty($input['title']) ? $input['title'] : 'Pasadía Lago Calima',
                ':subtitle' => !empty($input['subtitle']) ? $input['subtitle'] : 'Experiencia ecoturística inolvidable',
                ':rating' => isset($input['rating']) ? (float)$input['rating'] : 5.0,
                ':reviews_count' => isset($input['reviewsCount']) ? (int)$input['reviewsCount'] : 1,
                ':price' => isset($input['price']) ? (int)$input['price'] : 95000,
                ':price_type' => !empty($input['priceType']) ? $input['priceType'] : 'person',
                ':image' => !empty($input['image']) ? $input['image'] : 'https://conexioneco.com/wp-content/uploads/2026/06/PONTON.webp',
                ':images' => isset($input['images']) && is_array($input['images']) ? json_encode($input['images']) : null,
                ':itinerary' => isset($input['itinerary']) && is_array($input['itinerary']) ? json_encode($input['itinerary']) : null,
                ':max_guests' => isset($input['maxGuests']) ? (int)$input['maxGuests'] : 15,
                ':child_discount_rate' => isset($input['childDiscountRate']) ? (float)$input['childDiscountRate'] : 0.5,
                ':description' => isset($input['description']) ? $input['description'] : null
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

            // Eliminar registros de características y adicionales vinculados
            $pdo->prepare("DELETE FROM product_features WHERE product_id = ?")->execute([$id]);
            $pdo->prepare("DELETE FROM product_addons WHERE product_id = ?")->execute([$id]);
            
            // Eliminar producto de la tabla principal
            $stmt = $pdo->prepare("DELETE FROM products WHERE id = ?");
            $stmt->execute([$id]);

            $pdo->commit();
            echo json_encode(['status' => 'success', 'message' => 'Servicio eliminado correctamente de la base de datos.']);
        } catch (\Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'toggle_product_status':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? $input['id'] : '';
            $status = isset($input['status']) ? $input['status'] : 'active';

            if (!$id) {
                throw new \Exception("ID de producto no proporcionado.");
            }

            $stmt = $pdo->prepare("UPDATE products SET status = :status WHERE id = :id");
            $stmt->execute([':status' => $status, ':id' => $id]);

            echo json_encode(['status' => 'success', 'message' => 'Estado del servicio actualizado correctamente.', 'new_status' => $status]);
        } catch (\Exception $e) {
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
    case 'upload_image':
        try {
            if (!isset($_FILES['image'])) {
                throw new \Exception("No se ha proporcionado ninguna imagen.");
            }
            
            $file = $_FILES['image'];
            if ($file['error'] !== UPLOAD_ERR_OK) {
                throw new \Exception("Error al subir el archivo: " . $file['error']);
            }
            
            // Validar extensión
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new \Exception("Tipo de archivo no permitido. Solo se aceptan imágenes JPG, PNG y WEBP.");
            }
            
            // Carpeta de subidas
            $targetDir = __DIR__ . '/../uploads/';
            if (!file_exists($targetDir)) {
                mkdir($targetDir, 0755, true);
            }
            
            // Generar nombre de archivo único
            $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
            if (empty($ext)) {
                $ext = $file['type'] === 'image/png' ? 'png' : ($file['type'] === 'image/webp' ? 'webp' : 'jpg');
            }
            $filename = 'img_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
            $targetPath = $targetDir . $filename;
            
            if (move_uploaded_file($file['tmp_name'], $targetPath)) {
                echo json_encode([
                    'status' => 'success',
                    'url' => 'uploads/' . $filename,
                    'message' => 'Imagen subida exitosamente.'
                ]);
            } else {
                throw new \Exception("No se pudo guardar la imagen en el servidor.");
            }
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

            // Asegurar que las columnas del cliente existan en la tabla bookings
            ensureBookingColumnsExist($pdo);

            $sql = "INSERT INTO bookings (product_id, check_in, check_out, guests, children, total_price, customer_name, customer_document_type, customer_document_number, customer_email, customer_phone, customer_birthdate, customer_notes, customer_country, customer_department, customer_city)
                    VALUES (:product_id, :check_in, :check_out, :guests, :children, :total_price, :customer_name, :customer_document_type, :customer_document_number, :customer_email, :customer_phone, :customer_birthdate, :customer_notes, :customer_country, :customer_department, :customer_city)";
            $stmt = $pdo->prepare($sql);
            
            $birthdate = (isset($input['customerDob']) && !empty($input['customerDob'])) ? $input['customerDob'] : null;

            $stmt->execute([
                ':product_id' => $input['productId'],
                ':check_in' => $input['checkIn'],
                ':check_out' => $input['checkOut'],
                ':guests' => (int)$input['guests'],
                ':children' => (int)$input['children'],
                ':total_price' => (int)$input['totalPrice'],
                ':customer_name' => isset($input['customerName']) ? $input['customerName'] : '',
                ':customer_document_type' => isset($input['customerDocType']) ? $input['customerDocType'] : '',
                ':customer_document_number' => isset($input['customerDocNum']) ? $input['customerDocNum'] : '',
                ':customer_email' => isset($input['customerEmail']) ? $input['customerEmail'] : '',
                ':customer_phone' => isset($input['customerPhone']) ? $input['customerPhone'] : '',
                ':customer_birthdate' => $birthdate,
                ':customer_notes' => isset($input['customerNotes']) ? $input['customerNotes'] : null,
                ':customer_country' => isset($input['customerCountry']) ? $input['customerCountry'] : 'Colombia',
                ':customer_department' => isset($input['customerDepartment']) ? $input['customerDepartment'] : '',
                ':customer_city' => isset($input['customerCity']) ? $input['customerCity'] : ''
            ]);

            echo json_encode(['status' => 'success', 'booking_id' => $pdo->lastInsertId(), 'message' => 'Reserva creada correctamente en la base de datos MySQL.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_partners':
        try {
            $stmt = $pdo->query("SELECT * FROM partners ORDER BY name ASC");
            $partners = $stmt->fetchAll();
            foreach ($partners as &$pa) {
                // Convertir todos los campos snake_case a camelCase para el frontend
                $pa['commissionRate'] = (float)$pa['commission_rate'];
                $pa['coverImage']     = $pa['cover_image'] ?? '';
                $pa['contactPhone']   = $pa['contact_phone'] ?? '';
                $pa['contactEmail']   = $pa['contact_email'] ?? '';
                $pa['locationLat']    = $pa['location_lat'] ? (float)$pa['location_lat'] : null;
                $pa['locationLng']    = $pa['location_lng'] ? (float)$pa['location_lng'] : null;
                // Limpiar llaves en snake_case
                unset(
                    $pa['commission_rate'],
                    $pa['cover_image'],
                    $pa['contact_phone'],
                    $pa['contact_email'],
                    $pa['location_lat'],
                    $pa['location_lng']
                );
            }
            echo json_encode($partners);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_partner':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['id']) || !isset($input['name'])) {
                throw new \Exception("Datos del centro turístico incompletos.");
            }

            $sql = "INSERT INTO partners (id, name, description, logo, cover_image, contact_phone, contact_email, website, rnt, commission_rate, address, location_lat, location_lng, status)
                    VALUES (:id, :name, :description, :logo, :cover_image, :contact_phone, :contact_email, :website, :rnt, :commission_rate, :address, :location_lat, :location_lng, :status)
                    ON DUPLICATE KEY UPDATE
                        name = VALUES(name),
                        description = VALUES(description),
                        logo = VALUES(logo),
                        cover_image = VALUES(cover_image),
                        contact_phone = VALUES(contact_phone),
                        contact_email = VALUES(contact_email),
                        website = VALUES(website),
                        rnt = VALUES(rnt),
                        commission_rate = VALUES(commission_rate),
                        address = VALUES(address),
                        location_lat = VALUES(location_lat),
                        location_lng = VALUES(location_lng),
                        status = VALUES(status)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':id' => $input['id'],
                ':name' => $input['name'],
                ':description' => isset($input['description']) ? $input['description'] : '',
                ':logo' => isset($input['logo']) ? $input['logo'] : '',
                ':cover_image' => isset($input['coverImage']) ? $input['coverImage'] : '',
                ':contact_phone' => isset($input['contactPhone']) ? $input['contactPhone'] : '',
                ':contact_email' => isset($input['contactEmail']) ? $input['contactEmail'] : '',
                ':website' => isset($input['website']) ? $input['website'] : '',
                ':rnt' => isset($input['rnt']) ? $input['rnt'] : '',
                ':commission_rate' => isset($input['commissionRate']) ? (float)$input['commissionRate'] : 10.00,
                ':address' => isset($input['address']) ? $input['address'] : '',
                ':location_lat' => isset($input['locationLat']) ? (float)$input['locationLat'] : null,
                ':location_lng' => isset($input['locationLng']) ? (float)$input['locationLng'] : null,
                ':status' => isset($input['status']) ? $input['status'] : 'active'
            ]);

            echo json_encode(['status' => 'success', 'message' => 'Centro turístico guardado correctamente.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'delete_partner':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? $input['id'] : '';
            if (!$id) throw new \Exception("ID no proporcionado.");
            $pdo->prepare("DELETE FROM partners WHERE id = ?")->execute([$id]);
            echo json_encode(['status' => 'success', 'message' => 'Centro turístico eliminado.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'get_reviews':
        try {
            $productId = isset($_GET['product_id']) ? $_GET['product_id'] : '';
            $status = isset($_GET['status']) ? $_GET['status'] : '';

            $sql = "SELECT * FROM reviews WHERE 1=1";
            $params = [];

            if ($productId) {
                $sql .= " AND product_id = ?";
                $params[] = $productId;
            }

            if ($status && $status !== 'all') {
                $sql .= " AND status = ?";
                $params[] = $status;
            }

            $sql .= " ORDER BY date DESC, created_at DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $reviews = $stmt->fetchAll();
            foreach ($reviews as &$r) {
                $r['id'] = (int)$r['id'];
                $r['rating'] = (float)$r['rating'];
            }
            echo json_encode($reviews);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'save_review':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input || !isset($input['productId']) || !isset($input['author']) || !isset($input['comment'])) {
                throw new \Exception("Datos de reseña incompletos.");
            }

            $sql = "INSERT INTO reviews (product_id, author, email, rating, comment, avatar, date, status)
                    VALUES (:product_id, :author, :email, :rating, :comment, :avatar, :date, :status)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':product_id' => $input['productId'],
                ':author' => $input['author'],
                ':email' => isset($input['email']) ? $input['email'] : '',
                ':rating' => isset($input['rating']) ? (float)$input['rating'] : 5.0,
                ':comment' => $input['comment'],
                ':avatar' => isset($input['avatar']) ? $input['avatar'] : '',
                ':date' => date('Y-m-d'),
                ':status' => isset($input['status']) ? $input['status'] : 'approved'
            ]);

            // Actualizar reviews_count en products
            $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved'");
            $countStmt->execute([$input['productId']]);
            $count = (int)$countStmt->fetch()['cnt'];
            $pdo->prepare("UPDATE products SET reviews_count = ? WHERE id = ?")->execute([$count, $input['productId']]);

            echo json_encode(['status' => 'success', 'review_id' => $pdo->lastInsertId(), 'message' => 'Reseña guardada correctamente.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'delete_review':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            if (!$id) {
                throw new \Exception("ID de reseña no proporcionado.");
            }

            // Obtener product_id antes de eliminar
            $pStmt = $pdo->prepare("SELECT product_id FROM reviews WHERE id = ?");
            $pStmt->execute([$id]);
            $review = $pStmt->fetch();

            $stmt = $pdo->prepare("DELETE FROM reviews WHERE id = ?");
            $stmt->execute([$id]);

            // Actualizar reviews_count
            if ($review && isset($review['product_id'])) {
                $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved'");
                $countStmt->execute([$review['product_id']]);
                $count = (int)$countStmt->fetch()['cnt'];
                $pdo->prepare("UPDATE products SET reviews_count = ? WHERE id = ?")->execute([$count, $review['product_id']]);
            }

            echo json_encode(['status' => 'success', 'message' => 'Reseña eliminada.']);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
        }
        break;

    case 'update_review_status':
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $status = isset($input['status']) ? $input['status'] : 'approved';

            if (!$id || !in_array($status, ['pending', 'approved', 'rejected'])) {
                throw new \Exception("Datos inválidos.");
            }

            $stmt = $pdo->prepare("UPDATE reviews SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);

            // Actualizar reviews_count
            $pStmt = $pdo->prepare("SELECT product_id FROM reviews WHERE id = ?");
            $pStmt->execute([$id]);
            $review = $pStmt->fetch();
            if ($review) {
                $countStmt = $pdo->prepare("SELECT COUNT(*) as cnt FROM reviews WHERE product_id = ? AND status = 'approved'");
                $countStmt->execute([$review['product_id']]);
                $count = (int)$countStmt->fetch()['cnt'];
                $pdo->prepare("UPDATE products SET reviews_count = ? WHERE id = ?")->execute([$count, $review['product_id']]);
            }

            echo json_encode(['status' => 'success', 'message' => 'Estado de reseña actualizado.']);
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
