<?php
// api/admin/registrations.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

// --- Auth check ---
// jwt_require_auth() reads the Authorization header, verifies the token,
// and automatically sends a 401 JSON error + exits if missing/invalid.
$payload = jwt_require_auth();

// --- Query params (names match admin.js exactly) ---
$search  = trim($_GET['search']  ?? '');
$regFor  = trim($_GET['reg_for'] ?? '');
$status  = trim($_GET['status']  ?? '');
$page    = max(1, (int)($_GET['page']  ?? 1));
$limit   = min(100, max(1, (int)($_GET['limit'] ?? 20)));
$offset  = ($page - 1) * $limit;

// --- Build WHERE clause dynamically ---
$where  = [];
$params = [];

if ($search !== '') {
    $where[] = '(first_name LIKE :search OR last_name LIKE :search OR phone LIKE :search OR email LIKE :search OR area LIKE :search)';
    $params[':search'] = "%$search%";
}
if ($regFor !== '') {
    $where[] = 'reg_for = :reg_for';
    $params[':reg_for'] = $regFor;
}
if ($status !== '') {
    $where[] = 'status = :status';
    $params[':status'] = $status;
}

$whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';

try {
    // Total count for pagination
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM registrations $whereSql");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    $pages = (int)ceil($total / $limit);

    // Page of results
    $sql = "SELECT id, first_name, last_name, email, phone, area, reg_for, age_group, status, created_at
            FROM registrations
            $whereSql
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset";

    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $val) {
        $stmt->bindValue($key, $val);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success'       => true,
        'registrations' => $rows,
        'page'          => $page,
        'pages'         => $pages,
        'total'         => $total
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}
