<?php
// registration_rules.php — shared registration constraint logic
//
// Rules:
//   • One phone/email cannot register twice for the same purpose (reg_for).
//   • One ministry per contact (Worship, Choir, Media, Sunday School, etc.).
//   • One cell group per contact — allowed in addition to a ministry.
//   • One general church activity and one new-member registration per contact.

function normalizeKenyanPhone(string $phone): string
{
    $cleaned = preg_replace('/[\s().-]+/', '', $phone);
    if (preg_match('/^0(7|1)\d{8}$/', $cleaned)) {
        return '+254' . substr($cleaned, 1);
    }
    if (preg_match('/^254(7|1)\d{8}$/', $cleaned)) {
        return '+' . $cleaned;
    }
    return $cleaned;
}

/** @return list<string> */
function phoneMatchVariants(string $phone): array
{
    $normalized = normalizeKenyanPhone($phone);
    $variants = [$normalized, $phone];
    if (preg_match('/^\+254(\d{9})$/', $normalized, $m)) {
        $variants[] = '0' . $m[1];
        $variants[] = '254' . $m[1];
    }
    return array_values(array_unique(array_filter($variants)));
}

function getRegForCategory(string $regFor): string
{
    $regFor = trim($regFor);
    if ($regFor === '') {
        return 'unknown';
    }
    if ($regFor === 'New Member Registration') {
        return 'membership';
    }
    if ($regFor === 'General Church Activity') {
        return 'activity';
    }
    if (stripos($regFor, 'Cell Group') === 0) {
        return 'cell_group';
    }

    static $ministries = [
        'Worship Team',
        'Choir',
        'Media Team',
        'Sunday School (Junior)',
        'Sunday School (Senior)',
        'Sunday School (Teens)',
    ];

    if (in_array($regFor, $ministries, true)) {
        return 'ministry';
    }

    return 'other';
}

function normalizeRegFor(string $regFor, ?string $cellGroup = null): string
{
    $regFor = trim($regFor);
    if ($regFor === 'Cell Group' && $cellGroup !== null && trim($cellGroup) !== '') {
        return 'Cell Group — ' . trim($cellGroup);
    }
    return $regFor;
}

/**
 * @return list<array{id:int,reg_for:string}>
 */
function findContactRegistrations(PDO $pdo, string $phone, ?string $email, ?int $excludeId = null): array
{
    $phoneVariants = phoneMatchVariants($phone);
    $phonePlaceholders = implode(', ', array_fill(0, count($phoneVariants), '?'));

    $sql = "SELECT id, reg_for
            FROM registrations
            WHERE status != 'inactive'";
    $params = [];

    if ($excludeId !== null && $excludeId > 0) {
        $sql .= ' AND id != ?';
        $params[] = $excludeId;
    }

    $email = $email !== null ? trim($email) : '';
    if ($email !== '') {
        $sql .= " AND (phone IN ($phonePlaceholders) OR (email IS NOT NULL AND LOWER(email) = LOWER(?)))";
        $params = array_merge($params, $phoneVariants, [$email]);
    } else {
        $sql .= " AND phone IN ($phonePlaceholders)";
        $params = array_merge($params, $phoneVariants);
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    return $stmt->fetchAll(PDO::FETCH_ASSOC) ?: [];
}

/**
 * Returns a user-facing error string, or null when the registration is allowed.
 */
function validateRegistrationUniqueness(
    PDO $pdo,
    string $phone,
    ?string $email,
    string $regFor,
    ?int $excludeId = null
): ?string {
    $regFor = trim($regFor);
    if ($regFor === '') {
        return 'Please select what you are registering for';
    }

    $category = getRegForCategory($regFor);
    $existing = findContactRegistrations($pdo, $phone, $email, $excludeId);

    foreach ($existing as $row) {
        $existingRegFor = trim($row['reg_for']);
        $existingCategory = getRegForCategory($existingRegFor);

        // Exact duplicate purpose
        if (strcasecmp($existingRegFor, $regFor) === 0) {
            return "This phone or email is already registered for \"$regFor\".";
        }

        // Both are cell groups — only one neighbourhood group allowed
        if ($category === 'cell_group' && $existingCategory === 'cell_group') {
            return "This phone or email is already registered for a cell group ($existingRegFor). "
                . 'You can only join one cell group at a time.';
        }

        // Only one ministry per contact
        if ($category === 'ministry' && $existingCategory === 'ministry') {
            return "This phone or email is already registered for a ministry ($existingRegFor). "
                . 'Each person may serve in one ministry at a time. You may still register for a cell group separately.';
        }

        if ($category === 'membership' && $existingCategory === 'membership') {
            return 'This phone or email already has a new member registration on file.';
        }

        if ($category === 'activity' && $existingCategory === 'activity') {
            return 'This phone or email is already registered for a general church activity.';
        }
    }

    return null;
}
