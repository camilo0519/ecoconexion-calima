-- SQL Setup para Base de Datos Eco Conexión Calima
-- UTF-8
CREATE DATABASE IF NOT EXISTS ecocalima CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecocalima;

-- 0. Tabla de Centros Turísticos (Partners / Aliados)
CREATE TABLE IF NOT EXISTS partners (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Tabla de Adicionales (Addons)
CREATE TABLE IF NOT EXISTS addons (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    price INT NOT NULL,
    type VARCHAR(20) NOT NULL,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabla de Servicios (Products)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(50) PRIMARY KEY,
    partner_id VARCHAR(50) DEFAULT NULL,
    category VARCHAR(30) NOT NULL,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    rating DECIMAL(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 1,
    price INT NOT NULL,
    price_type VARCHAR(20) NOT NULL,
    image TEXT NOT NULL,
    max_guests INT NOT NULL,
    child_discount_rate DECIMAL(3,2) DEFAULT 0.5,
    description TEXT NULL,
    FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tabla de Relación de Comodidades (Features)
CREATE TABLE IF NOT EXISTS product_features (
    product_id VARCHAR(50) NOT NULL,
    feature VARCHAR(150) NOT NULL,
    PRIMARY KEY (product_id, feature),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tabla de Relación de Adicionales habilitados por Producto
CREATE TABLE IF NOT EXISTS product_addons (
    product_id VARCHAR(50) NOT NULL,
    addon_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (product_id, addon_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (addon_id) REFERENCES addons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Tabla de Reseñas (Reviews)
CREATE TABLE IF NOT EXISTS reviews (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabla de Reservas
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    guests INT NOT NULL,
    children INT NOT NULL,
    total_price INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_document_type VARCHAR(20) NOT NULL,
    customer_document_number VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_birthdate DATE NULL,
    customer_notes TEXT DEFAULT NULL,
    customer_country VARCHAR(100) NOT NULL DEFAULT 'Colombia',
    customer_department VARCHAR(100) NOT NULL DEFAULT '',
    customer_city VARCHAR(100) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- INSERCIÓN DE DATOS INICIALES (DATOS MOCK DE SISTEMA)

-- Adicionales (Addons)
INSERT INTO addons (id, name, price, type, description) VALUES
('transporte-cali', 'Transporte desde Cali/Buga (Ida y Vuelta)', 50000, 'person', 'Transporte en van compartida con aire acondicionado.'),
('almuerzo-premium', 'Almuerzo Premium de la Casa', 25000, 'person', 'Menú gourmet con entrada, plato fuerte típico y bebida natural.'),
('decoracion-romantica', 'Decoración Romántica Especial', 120000, 'booking', 'Pétalos de rosa, velas decorativas, globos y botella de champaña.'),
('jetski-extra', 'Paseo adicional en Jetski (20 min)', 85000, 'booking', 'Moto acuática de última generación (1 o 2 personas).'),
('guia-ingles', 'Intérprete / Guía Bilingüe (Inglés)', 70000, 'booking', 'Guía privado certificado con manejo de inglés fluido.')
ON DUPLICATE KEY UPDATE name=VALUES(name), price=VALUES(price), type=VALUES(type), description=VALUES(description);

-- Centros Turísticos (Partners)
INSERT IGNORE INTO partners (id, name, description, logo, contact_phone, contact_email, rnt, commission_rate, address) VALUES
('eco-conexion', 'Eco Conexión Calima', 'Plataforma líder de experiencias ecoturísticas en el Lago Calima. Conectamos viajeros con los mejores centros turísticos, alojamientos y actividades de la región.', 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=200&auto=format&fit=crop', '+573168251303', 'info@ecoconexioncalima.com', 'N/A', 0, 'Calima Darién, Valle del Cauca'),
('mystic-paradise', 'Mystic Paradise', 'Glamping y camping de lujo a orillas del Lago Calima. Disfruta del mejor estilo contemporáneo en medio de la naturaleza con acceso directo al lago, piscina, restaurante y bar.', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=200&auto=format&fit=crop', '+573158735427', 'mysticparadisecalima@gmail.com', 'RNT 160492', 15, 'Kilometro 10 vereda llanitos - Calima Darién'),
('ecohotel-calima', 'Eco-Hotel Campestre Calima', 'Hotel campestre con habitaciones confortables rodeadas de naturaleza. Piscina climatizada, senderos ecológicos y restaurante.', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?q=80&w=200&auto=format&fit=crop', '+573001234567', 'info@ecohotelcalima.com', 'RNT 123456', 12, 'Vía al Lago Calima, Darién');

-- Servicios (Products)
INSERT INTO products (id, partner_id, category, title, subtitle, rating, reviews_count, price, price_type, image, max_guests, child_discount_rate, description) VALUES
('glamping-altavista', 'eco-conexion', 'alojamiento', 'Glamping Altavista Lago Calima', 'Alojamiento exclusivo con vista de 180° al lago', 4.9, 38, 290000, 'night', 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop', 4, 0.5, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('hotel-campestre-calima', 'ecohotel-calima', 'alojamiento', 'Eco-Hotel Campestre Lago Calima', 'Habitaciones confortables rodeadas de naturaleza y senderos', 4.7, 54, 180000, 'night', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop', 6, 0.4, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('chalet-familiar-dariend', 'eco-conexion', 'alojamiento', 'Chalet Familiar Calima Darién', 'Finca campestre ideal para grupos y familias', 4.8, 22, 450000, 'night', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop', 12, 0.5, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('pasadia-duende', 'eco-conexion', 'pasadia', 'Pasadía Cascadas del Duende', 'Senderismo ecológico guiado y circuito por cascadas cristalinas', 4.9, 76, 85000, 'person', 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=1200&auto=format&fit=crop', 25, 0.3, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('pasadia-shinrin-yoku', 'eco-conexion', 'pasadia', 'Baño de Bosque & Bienestar', 'Experiencia de Shinrin-Yoku y meditación guiada en la naturaleza', 5.0, 19, 95000, 'person', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1200&auto=format&fit=crop', 15, 0.0, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('deporte-windsurf-kitesurf', 'eco-conexion', 'deportes', 'Curso de Kitesurf o Windsurf', 'Clases de iniciación personalizadas con instructores avalados', 4.8, 31, 180000, 'person', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop', 5, 0.1, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('deporte-paddle-tour', 'eco-conexion', 'deportes', 'Tour Guiado en Paddle Board / Kayak', 'Navegación al amanecer o atardecer por los rincones del lago', 4.9, 47, 75000, 'person', 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop', 15, 0.2, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.'),
('paquete-lago-rio-bravo', 'eco-conexion', 'paquetes', 'Paquete Lago y Río Bravo (2 Días)', 'El balance perfecto entre cultura local, agua y naturaleza activa', 4.9, 14, 320000, 'person', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop', 10, 0.4, 'Disfruta de una estadía espectacular en el Lago Calima. Este lugar ha sido especialmente diseñado para conectarte con la biodiversidad local, ofreciendo vistas inigualables y la comodidad necesaria para un descanso reparador o una aventura deportiva inolvidable.\n\nUbicado en una zona privilegiada de Calima Darién, tendrás acceso directo a actividades ecoturísticas, deportes acuáticos, zonas de avistamiento y senderos naturales guiados por operadores calificados de la región.')
ON DUPLICATE KEY UPDATE partner_id=VALUES(partner_id), category=VALUES(category), title=VALUES(title), subtitle=VALUES(subtitle), rating=VALUES(rating), reviews_count=VALUES(reviews_count), price=VALUES(price), price_type=VALUES(price_type), image=VALUES(image), max_guests=VALUES(max_guests), child_discount_rate=VALUES(child_discount_rate), description=VALUES(description);

-- Reseñas iniciales de ejemplo
INSERT IGNORE INTO reviews (id, product_id, author, email, rating, comment, avatar, date, status) VALUES
(1, 'glamping-altavista', 'Mariana Restrepo', 'mariana@email.com', 5.0, 'Un lugar espectacular. La vista al lago desde el jacuzzi es inigualable. Los guías de Eco Conexión Calima fueron súper atentos y la comida del restaurante local estuvo deliciosa. Volveré sin duda.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop', '2026-05-15', 'approved'),
(2, 'glamping-altavista', 'Carlos Mario Gómez', 'carlos@email.com', 4.0, 'Excelente servicio y hospitalidad. Todo coincide exactamente con la descripción. Reservar por el portal fue sencillísimo y el boleto con QR nos sirvió para ingresar de inmediato. El clima estuvo perfecto.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop', '2026-04-20', 'approved'),
(3, 'hotel-campestre-calima', 'Ana María Sánchez', 'ana@email.com', 5.0, 'El Eco-Hotel superó nuestras expectativas. Las habitaciones son muy cómodas y el personal es increíblemente atento. La piscina climatizada es perfecta para relajarse después de un día de senderismo.', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=150&auto=format&fit=crop', '2026-03-10', 'approved'),
(4, 'pasadia-duende', 'Andrés Felipe López', 'andres@email.com', 5.0, 'La caminata a las cascadas fue una experiencia mágica. El guía conocía cada rincón y nos explicó sobre la flora y fauna local. Muy recomendado para quienes buscan conectar con la naturaleza.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=150&auto=format&fit=crop', '2026-02-28', 'approved'),
(5, 'deporte-paddle-tour', 'Valentina Orozco', 'valentina@email.com', 5.0, 'Hicimos el tour en paddle al atardecer y fue simplemente espectacular. El lago Calima visto desde el agua es una experiencia que todos deberían vivir. El instructor fue muy paciente y amable.', 'https://images.unsplash.com/photo-1499557354967-2b2d8910bcca?q=80&w=150&auto=format&fit=crop', '2026-01-15', 'approved');

-- Comodidades (Features)
INSERT IGNORE INTO product_features (product_id, feature) VALUES
('glamping-altavista', 'Vista al Lago'),
('glamping-altavista', 'Jacuzzi Privado'),
('glamping-altavista', 'Malla Catamarán'),
('glamping-altavista', 'Desayuno Incluido'),
('glamping-altavista', 'Wifi Premium'),
('glamping-altavista', 'Fogata'),

('hotel-campestre-calima', 'Piscina Climatizada'),
('hotel-campestre-calima', 'Zonas Verdes'),
('hotel-campestre-calima', 'Restaurante'),
('hotel-campestre-calima', 'Parqueadero'),
('hotel-campestre-calima', 'Sendero Ecológico'),
('hotel-campestre-calima', 'Zona de Hamacas'),

('chalet-familiar-dariend', 'Cocina Equipada'),
('chalet-familiar-dariend', 'Asador BBQ'),
('chalet-familiar-dariend', 'Piscina Privada'),
('chalet-familiar-dariend', 'Cancha de Fútbol'),
('chalet-familiar-dariend', 'Admiten Mascotas'),

('pasadia-duende', 'Guía Local Certificado'),
('pasadia-duende', 'Entrada a Reserva Natural'),
('pasadia-duende', 'Seguro de Asistencia Médica'),
('pasadia-duende', 'Refrigerio Tradicional'),
('pasadia-duende', 'Baño de Cascada'),

('pasadia-shinrin-yoku', 'Terapeuta Shinrin-Yoku'),
('pasadia-shinrin-yoku', 'Sesión de Yoga Aire Libre'),
('pasadia-shinrin-yoku', 'Infusión Herbal de Bienestar'),
('pasadia-shinrin-yoku', 'Seguro Médico'),
('pasadia-shinrin-yoku', 'Caminata Consciente'),

('deporte-windsurf-kitesurf', 'Equipo Completo Incluido'),
('deporte-windsurf-kitesurf', 'Instructor Certificado'),
('deporte-windsurf-kitesurf', 'Lancha de Apoyo'),
('deporte-windsurf-kitesurf', 'Chaleco Salvavidas'),
('deporte-windsurf-kitesurf', '1.5 Horas de Práctica'),

('deporte-paddle-tour', 'Tabla de Stand Up Paddle'),
('deporte-paddle-tour', 'Remo y Chaleco'),
('deporte-paddle-tour', 'Instrucción Básica'),
('deporte-paddle-tour', 'Registro Fotográfico'),
('deporte-paddle-tour', 'Tour de 2 Horas'),

('paquete-lago-rio-bravo', 'Alojamiento 1 Noche'),
('paquete-lago-rio-bravo', 'Visita al Museo Arqueológico'),
('paquete-lago-rio-bravo', 'Tour en Pontón (40 Min)'),
('paquete-lago-rio-bravo', 'Senderismo Cascada Río Bravo'),
('paquete-lago-rio-bravo', 'Desayuno y Almuerzo');

-- Adicionales Habilitados (Product Addons)
INSERT IGNORE INTO product_addons (product_id, addon_id) VALUES
('glamping-altavista', 'transporte-cali'),
('glamping-altavista', 'decoracion-romantica'),
('glamping-altavista', 'jetski-extra'),

('hotel-campestre-calima', 'transporte-cali'),
('hotel-campestre-calima', 'almuerzo-premium'),
('hotel-campestre-calima', 'guia-ingles'),

('chalet-familiar-dariend', 'transporte-cali'),
('chalet-familiar-dariend', 'almuerzo-premium'),
('chalet-familiar-dariend', 'jetski-extra'),

('pasadia-duende', 'transporte-cali'),
('pasadia-duende', 'almuerzo-premium'),

('pasadia-shinrin-yoku', 'transporte-cali'),
('pasadia-shinrin-yoku', 'almuerzo-premium'),
('pasadia-shinrin-yoku', 'guia-ingles'),

('deporte-windsurf-kitesurf', 'transporte-cali'),
('deporte-windsurf-kitesurf', 'almuerzo-premium'),
('deporte-windsurf-kitesurf', 'guia-ingles'),

('deporte-paddle-tour', 'transporte-cali'),
('deporte-paddle-tour', 'almuerzo-premium'),
('deporte-paddle-tour', 'jetski-extra'),

('paquete-lago-rio-bravo', 'transporte-cali'),
('paquete-lago-rio-bravo', 'jetski-extra'),
('paquete-lago-rio-bravo', 'guia-ingles');
