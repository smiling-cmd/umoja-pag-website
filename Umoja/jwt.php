<?php
/**
 * jwt.php — Minimal JWT (JSON Web Token) encode/decode.
 * No external libraries needed — pure PHP using HMAC-SHA256.
 *
 * This is intentionally simple (HS256 only) but is correctly
 * implemented: real signing, real verification, real expiry checks.
 */

// ⚠️ CHANGE THIS to a long random string of your own before going live.
// This secret is what makes tokens un-forgeable. Anyone with this
// string could create fake admin tokens, so never share it publicly
// or commit it to a public GitHub repo.
define('JWT_SECRET', 'umoja-pag-church-local-dev-secret-change-this-before-hosting-live');

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    $padded = str_pad(strtr($data, '-_', '+/'), strlen($data) % 4 === 0 ? strlen($data) : strlen($data) + (4 - strlen($data) % 4), '=', STR_PAD_RIGHT);
    return base64_decode($padded);
}

/**
 * Create a signed JWT for the given payload.
 * Automatically adds an "exp" (expiry) claim, default 8 hours.
 */
function jwt_create(array $payload, int $expiresInSeconds = 28800): string {
    $header = ['typ' => 'JWT', 'alg' => 'HS256'];
    $payload['iat'] = time();
    $payload['exp'] = time() + $expiresInSeconds;

    $headerEncoded  = base64url_encode(json_encode($header));
    $payloadEncoded = base64url_encode(json_encode($payload));

    $signature = hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", JWT_SECRET, true);
    $signatureEncoded = base64url_encode($signature);

    return "{$headerEncoded}.{$payloadEncoded}.{$signatureEncoded}";
}

/**
 * Verify and decode a JWT. Returns the payload array on success,
 * or false if the token is invalid, tampered with, or expired.
 */
function jwt_verify(string $token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return false;

    [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

    $expectedSig = base64url_encode(
        hash_hmac('sha256', "{$headerEncoded}.{$payloadEncoded}", JWT_SECRET, true)
    );

    // hash_equals() prevents timing-attack vulnerabilities
    if (!hash_equals($expectedSig, $signatureEncoded)) {
        return false;
    }

    $payload = json_decode(base64url_decode($payloadEncoded), true);
    if (!$payload) return false;

    if (isset($payload['exp']) && time() > $payload['exp']) {
        return false; // expired
    }

    return $payload;
}

/**
 * Helper for protected endpoints: reads the Authorization header,
 * verifies the token, and returns the payload — or sends a 401
 * JSON error and exits if missing/invalid.
 */
function jwt_require_auth(): array {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $matches)) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Missing or invalid Authorization header.']);
        exit;
    }

    $payload = jwt_verify(trim($matches[1]));
    if (!$payload) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Invalid or expired token. Please sign in again.']);
        exit;
    }

    return $payload;
}
