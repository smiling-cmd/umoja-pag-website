<?php
// registration_rules.php
// Shared business rules for registration create/update. Both the public
// sign-up form's endpoint and the admin edit endpoint (registration_update.php)
// should require_once this file and call these functions, so the same rule
// is enforced everywhere instead of being duplicated (and drifting) per file.

/**
 * Normalizes a Kenyan phone number to +254XXXXXXXXX format.
 * Accepts common input shapes: 0712345678, 712345678, 254712345678,
 * +254712345678, with or without spaces/dashes.
 *
 * @param string $phone Raw phone input from a form
 * @return string Normalized +254XXXXXXXXX, or the trimmed original if it
 *                doesn't match any recognized shape (the caller's regex
 *                check is what actually rejects invalid numbers).
 */
function normalizeKenyanPhone(string $phone): string
{
    $digits = preg_replace('/\D+/', '', $phone);

    if (strlen($digits) === 9) {
        // 712345678 -> +254712345678
        return '+254' . $digits;
    }
    if (strlen($digits) === 10 && $digits[0] === '0') {
        // 0712345678 -> +254712345678
        return '+254' . substr($digits, 1);
    }
    if (strlen($digits) === 12 && substr($digits, 0, 3) === '254') {
        // 254712345678 -> +254712345678
        return '+' . $digits;
    }
    if (strlen($digits) === 13 && substr($digits, 0, 3) === '254') {
        // Already has a leading + that got stripped as non-digit, e.g. "+254712345678"
        return '+' . $digits;
    }

    return trim($phone);
}

/**
 * Normalizes the "registering for" value. When someone picks "Cell Group"
 * on the form, the specific cell group they chose is folded into the
 * value so each cell group counts as its own distinct activity for
 * duplicate-checking purposes — e.g. "Cell Group — Jericho" is treated as
 * different from "Cell Group — Nazareth", so joining one doesn't block
 * joining another later once the first is active.
 *
 * @param string      $regFor    Raw "Registering For" selection
 * @param string|null $cellGroup The specific cell group chosen, if any
 * @return string Normalized reg_for value
 */
function normalizeRegFor(string $regFor, ?string $cellGroup): string
{
    if ($regFor === 'Cell Group' && $cellGroup !== null && $cellGroup !== '') {
        return 'Cell Group — ' . $cellGroup;
    }
    return $regFor;
}

/**
 * Enforces duplicate-contact rules when creating or editing a registration.
 *
 * Rule 1 — same event, twice: a phone number OR email can never register
 * for the exact same ministry/activity (reg_for) more than once. Always
 * blocked, regardless of status.
 *
 * Rule 2 — different ministries: the same phone OR email CAN register for
 * a different ministry/activity, but only once every one of their existing
 * registrations has reached "active" status. If any existing registration
 * for that contact is still pending, contacted, or inactive, new
 * registrations under a different ministry are blocked until the first one
 * is resolved to active.
 *
 * @param PDO         $pdo
 * @param string      $phone     Normalized phone number (+254XXXXXXXXX)
 * @param string|null $email     Email address, or null/empty if not given
 * @param string      $regFor    Ministry / activity being registered for
 * @param int|null    $excludeId Registration id to exclude — pass the row's
 *                               own id when editing so it doesn't collide
 *                               with itself
 * @return string|null Error message if the registration should be blocked,
 *                      otherwise null
 */
function validateRegistrationUniqueness(
    PDO $pdo,
    string $phone,
    ?string $email,
    string $regFor,
    ?int $excludeId = null
): ?string {
    $conditions = ['phone = :phone'];
    $params = [':phone' => $phone];

    if ($email !== null && $email !== '') {
        $conditions[] = 'email = :email';
        $params[':email'] = $email;
    }

    $sql = 'SELECT id, reg_for, status FROM registrations WHERE (' . implode(' OR ', $conditions) . ')';

    if ($excludeId !== null) {
        $sql .= ' AND id != :exclude_id';
        $params[':exclude_id'] = $excludeId;
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $existing = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$existing) {
        return null; // No prior registrations for this phone/email at all
    }

    // Rule 1: exact same ministry/activity already on file — always blocked.
    foreach ($existing as $row) {
        if ($row['reg_for'] === $regFor) {
            return "This phone number or email is already registered for \"$regFor\".";
        }
    }

    // Rule 2: a different ministry/activity is only allowed once every
    // other registration tied to this contact is already active.
    foreach ($existing as $row) {
        if ($row['status'] !== 'active') {
            return 'This phone number or email has a registration that is still being processed. '
                 . 'Please wait until it is marked active before registering for something new.';
        }
    }

    return null; // Every existing registration is active — new one is fine
}