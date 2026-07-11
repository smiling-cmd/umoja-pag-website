<?php
// api/admin/bulk-status.php
// Handles: POST /api/admin/bulk-status
// Body: { "ids": [1, 2, 3], "status": "active" }
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$input  = json_decode(file_get_contents('php://input'), true);
$ids    = $input['ids'] ?? [];
$status = trim($input['status'] ?? '');

$allowedStatuses = ['pending', 'contacted', 'active', 'inactive'];
if (!in_array($status, $allowedStatuses, true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Invalid status value']);
    exit;
}

// Keep only positive integers — protects against malformed or malicious input
$ids = array_values(array_filter(array_map('intval', (array)$ids), fn($id) => $id > 0));

if (empty($ids)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'No valid registration ids provided']);
    exit;
}

try {
    // Build a placeholder list matching the number of ids, e.g. "?,?,?"
    $placeholders = implode(',', array_fill(0, count($ids), '?'));

    $stmt = $pdo->prepare(
        "UPDATE registrations SET status = ? WHERE id IN ($placeholders)"
    );
    $stmt->execute(array_merge([$status], $ids));

    echo json_encode([
        'success' => true,
        'message' => 'Status updated',
        'updated' => $stmt->rowCount(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
}