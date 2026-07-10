<?php
// api/register.php — Public registration endpoint
header('Content-Type: application/json');
require_once __DIR__ . '/../db.php';

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Accept JSON body or regular form POST
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}

// --- Read fields (frontend sends camelCase) ---
$firstName = trim($input['firstName'] ?? '');
$lastName  = trim($input['lastName']  ?? '');
$phone     = trim($input['phone']     ?? '');
$email     = trim($input['email']     ?? '');
$ageGroup  = trim($input['ageGroup']  ?? '');
$area      = trim($input['area']      ?? '');
$regFor    = trim($input['regFor']    ?? '');
$notes     = trim($input['notes']     ?? '');

// --- Validate required fields ---
$errors = [];
if ($firstName === '') $errors[] = 'First name is required';
if ($lastName === '')  $errors[] = 'Last name is required';
if ($phone === '')     $errors[] = 'Phone number is required';
if ($regFor === '')    $errors[] = 'Please select what you are registering for';
if ($ageGroup === '')  $errors[] = 'Please select an age group';
if ($area === '')      $errors[] = 'Area is required';

if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors[] = 'Email address is invalid';
}

if (!empty($errors)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Validation failed', 'errors' => $errors]);
    exit;
}

try {
    $stmt = $pdo->prepare(
        "INSERT INTO registrations
            (first_name, last_name, email, phone, area, reg_for, age_group, notes, status, created_at)
         VALUES
            (:first_name, :last_name, :email, :phone, :area, :reg_for, :age_group, :notes, 'pending', NOW())"
    );

    $stmt->execute([
        ':first_name' => $firstName,
        ':last_name'  => $lastName,
        ':email'      => $email !== '' ? $email : null,
        ':phone'      => $phone,
        ':area'       => $area,
        ':reg_for'    => $regFor,
        ':age_group'  => $ageGroup,
        ':notes'      => $notes !== '' ? $notes : null,
    ]);

    echo json_encode([
        'success' => true,
        'message' => 'Registration submitted successfully',
        'id'      => $pdo->lastInsertId(),
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error', 'detail' => $e->getMessage()]);
}