<?php
// api/admin/admins_delete.php
// Handles: DELETE /api/admin/admins/{id}
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$id = (int)($_GET['id'] ?? 0);
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid admin id']);
    exit;
}

// Never allow an admin to delete their own account while logged in —
// this prevents accidental self-lockout.
if ((int)$payload['sub'] === $id) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You cannot delete your own account while logged in.']);
    exit;
}

try {
    // Never allow deleting the last remaining admin account —
    // this prevents the dashboard from becoming permanently inaccessible.
    $countStmt = $pdo->query("SELECT COUNT(*) FROM admin_users");
    if ((int)$countStmt->fetchColumn() <= 1) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Cannot delete the last remaining admin account.']);
        exit;
    }

    $stmt = $pdo->prepare("DELETE FROM admin_users WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Admin not found']);
        exit;
    }

    echo json_encode(['success' => true, 'message' => 'Admin removed']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
}