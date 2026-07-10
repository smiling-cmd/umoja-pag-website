<?php
// api/admin/registration_status.php
// Handles: PATCH /api/admin/registrations/{id}/status
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'PATCH') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid registration id']);
    exit;
}

$input  = json_decode(file_get_contents('php://input'), true);
$status = trim($input['status'] ?? '');

$allowed = ['pending', 'contacted', 'active', 'inactive'];
if (!in_array($status, $allowed, true)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Invalid status value']);
    exit;
}

try {
    $stmt = $pdo->prepare("UPDATE registrations SET status = :status WHERE id = :id");
    $stmt->execute([':status' => $status, ':id' => $id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Registration not found']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Status updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}
