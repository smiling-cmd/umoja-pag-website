<?php
// api/admin/registration_update.php
// Handles: PUT /api/admin/registrations/{id}
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
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

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request body']);
    exit;
}

// Only these fields are editable — anything else in the payload is ignored
$editable = ['first_name', 'last_name', 'email', 'phone', 'area', 'reg_for', 'age_group', 'notes'];

$fields = [];
$params = [':id' => $id];

foreach ($editable as $key) {
    if (array_key_exists($key, $input)) {
        $fields[] = "$key = :$key";
        $params[":$key"] = trim($input[$key]) === '' ? null : trim($input[$key]);
    }
}

if (empty($fields)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'No editable fields provided']);
    exit;
}

// Basic email sanity check if email is being updated
if (isset($params[':email']) && $params[':email'] !== null
    && !filter_var($params[':email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Invalid email address']);
    exit;
}

try {
    $sql = "UPDATE registrations SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        // Could mean "not found" OR "found but no values actually changed" —
        // check existence separately so we don't falsely 404 on a no-op save
        $check = $pdo->prepare("SELECT 1 FROM registrations WHERE id = :id");
        $check->execute([':id' => $id]);
        if (!$check->fetchColumn()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Registration not found']);
            exit;
        }
    }

    echo json_encode(['success' => true, 'message' => 'Registration updated']);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}