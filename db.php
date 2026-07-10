<?php
/**
 * db.php — Shared database connection for Umoja P.A.G Church backend.
 *
 * Every API file should start with: require __DIR__ . '/../db.php';
 * (adjust the number of ../ depending on folder depth)
 */

// ── Local development settings (Laragon defaults) ──────────────
// When you move to Hostafrica later, you'll only need to change
// these four lines to match the live database credentials.
$DB_HOST = '127.0.0.1';
$DB_NAME = 'umoja_church';
$DB_USER = 'root';
$DB_PASS = '';   // Laragon's default MySQL root user has NO password

// ── Connect using PDO (safer than the older mysqli for beginners) ──
try {
    $pdo = new PDO(
        "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4",
        $DB_USER,
        $DB_PASS,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]
    );
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Check db.php settings.',
    ]);
    exit;
}
