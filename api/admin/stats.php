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

    // Registrations grouped by month, last 12 months, oldest to newest
    $byMonth = $pdo->query(
        "SELECT DATE_FORMAT(created_at, '%b %Y') AS month, COUNT(*) AS count
         FROM registrations
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
         GROUP BY DATE_FORMAT(created_at, '%Y-%m'), month
         ORDER BY DATE_FORMAT(created_at, '%Y-%m') ASC"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Registrations grouped by status, in pipeline order
    $byStatus = $pdo->query(
        "SELECT status, COUNT(*) AS count
         FROM registrations
         GROUP BY status
         ORDER BY FIELD(status, 'pending', 'contacted', 'active', 'inactive')"
    )->fetchAll(PDO::FETCH_ASSOC);

    // Registrations grouped by age group
    $byAgeGroup = $pdo->query(
        "SELECT age_group, COUNT(*) AS count
         FROM registrations
         GROUP BY age_group
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
        'byMonth'    => $byMonth,
        'byStatus'   => $byStatus,
        'byAgeGroup' => $byAgeGroup,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}