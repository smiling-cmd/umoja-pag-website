<?php
/**
 * api/auth/login.php
 * Called by admin.js: POST /api/auth/login  { username, password }
 * Returns: { success: true, token: "...", username: "..." }
 */

header('Content-Type: application/json');

// Only allow POST requests — check this BEFORE connecting to the
// database, so a stray GET request doesn't waste a DB connection.
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed.']);
    exit;
}

require __DIR__ . '/../../db.php';
require __DIR__ . '/../../jwt.php';

// Read the JSON body sent by admin.js's api() helper
$input = json_decode(file_get_contents('php://input'), true);
$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

// Look up the admin user
$stmt = $pdo->prepare('SELECT id, username, password_hash FROM admin_users WHERE username = ? LIMIT 1');
$stmt->execute([$username]);
$user = $stmt->fetch();

// IMPORTANT: give the same error whether the username doesn't exist
// or the password is wrong. Telling an attacker "username not found"
// vs "wrong password" leaks which usernames are valid.
if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
    exit;
}

// Success — issue a token
$token = jwt_create([
    'sub'      => $user['id'],
    'username' => $user['username'],
]);

echo json_encode([
    'success'  => true,
    'token'    => $token,
    'username' => $user['username'],
]);
