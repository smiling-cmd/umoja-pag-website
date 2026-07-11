<?php
// api/admin/export.php
require_once __DIR__ . '/../../db.php';
require_once __DIR__ . '/../../jwt.php';

$payload = jwt_require_auth();

try {
    $stmt = $pdo->query(
        "SELECT id, first_name, last_name, email, phone, area, reg_for, age_group, notes, status, created_at
         FROM registrations
         ORDER BY created_at DESC"
    );
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $filename = 'umoja-registrations-' . date('Y-m-d') . '.csv';

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    $out = fopen('php://output', 'w');

    if (!empty($rows)) {
        fputcsv($out, array_keys($rows[0]));
    } else {
        fputcsv($out, ['id', 'first_name', 'last_name', 'email', 'phone', 'area', 'reg_for', 'age_group', 'notes', 'status', 'created_at']);
    }

    foreach ($rows as $row) {
        fputcsv($out, $row);
    }

    fclose($out);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'A server error occurred. Please try again.']);
}