<?php
// Conexión Eco Calima - Configuración de Base de Datos MySQL (PDO)

$host = '127.0.0.1';
$db   = 'ecocalima';
$user = 'root';
$pass = ''; // Cambiar si tu instalación de MySQL tiene contraseña (ej. en MAMP, Laragon, etc.)
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    // Retornar un error JSON HTTP 500 y terminar en caso de falla de conexión
    header('Content-Type: application/json', true, 500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de conexión a la base de datos: ' . $e->getMessage()
    ]);
    exit;
}
?>
