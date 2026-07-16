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
    $current = $pdo->prepare("SELECT status FROM registrations WHERE id = :id LIMIT 1");
    $current->execute([':id' => $id]);
    $currentStatus = $current->fetchColumn();

    if ($currentStatus === false) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Registration not found']);
        exit;
    }

    $currentRank = array_search($currentStatus, $allowed, true);
    $newRank     = array_search($status, $allowed, true);
    // $currentStatus may pre-date this pipeline (e.g. null/legacy value) —
    // treat anything not in $allowed as rank 0 so it can still move forward.
    if ($currentRank === false) {
        $currentRank = 0;
    }

    if ($newRank < $currentRank) {
        http_response_code(409);
        echo json_encode([
            'success' => false,
            'message' => "Status cannot move backward from \"$currentStatus\" to \"$status\".",
        ]);
        exit;
    }

    $stmt = $pdo->prepare("UPDATE registrations SET status = :status WHERE id = :id");
    $stmt->execute([':status' => $status, ':id' => $id]);

    echo json_encode(['success' => true, 'message' => 'Status updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
}