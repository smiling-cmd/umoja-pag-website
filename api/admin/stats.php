<?php
// api/admin/stats.php
header('Content-Type: application/json');
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

try {
    $total = (int)$pdo->query("SELECT COUNT(*) FROM registrations")->fetchColumn();

    $thisMonth = (int)$pdo->query(
        "SELECT COUNT(*) FROM registrations
         WHERE YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())"
    )->fetchColumn();

    $thisWeek = (int)$pdo->query(
        "SELECT COUNT(*) FROM registrations
         WHERE created_at >= NOW() - INTERVAL 7 DAY"
    )->fetchColumn();

    $pending = (int)$pdo->query(
        "SELECT COUNT(*) FROM registrations WHERE status = 'pending'"
    )->fetchColumn();

    $byMinistry = $pdo->query(
        "SELECT reg_for, COUNT(*) AS count
         FROM registrations
         GROUP BY reg_for
         ORDER BY count DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    $byArea = $pdo->query(
        "SELECT area, COUNT(*) AS count
         FROM registrations
         GROUP BY area
         ORDER BY count DESC"
    )->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'stats' => [
            'total'     => $total,
            'thisMonth' => $thisMonth,
            'thisWeek'  => $thisWeek,
            'pending'   => $pending,
        ],
        'byMinistry' => $byMinistry,
        'byArea'     => $byArea,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}