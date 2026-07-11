<?php
// api/admin/admins_list.php
// Handles: GET /api/admin/admins-list
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

try {
    $stmt = $pdo->query("SELECT id, username, created_at FROM admin_users ORDER BY created_at ASC");
    $admins = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'admins' => $admins]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
}