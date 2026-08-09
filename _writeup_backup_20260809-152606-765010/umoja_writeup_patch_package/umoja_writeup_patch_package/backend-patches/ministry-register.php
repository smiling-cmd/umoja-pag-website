<?php

declare(strict_types=1);
require __DIR__ . '/_bootstrap.php';

$data = request_data();
reject_honeypot($data);
require_consent($data);

$name = text_value($data, 'name', 100);
$phone = kenyan_phone_value($data);
$email = email_value($data, 'email', false);
$ministry = text_value($data, 'ministry', 80);
$message = text_value($data, 'message', 2000, false);

/*
 * Public labels aligned with the church's supplied website write-up.
 * Existing internal keys are retained so the current ministry mailboxes
 * continue to work without renaming them.
 */
$labels = [
    'sunday-school' => 'Children Ministry',
    'teens-ministry' => 'Teens Ministry',
    'youth' => 'Youth Church',
    'mens-fellowship' => "Men's Ministry (TEEM)",
    'womens-fellowship' => 'Ladies Ministry',
    'worship-team' => 'Music Ministry — Praise & Worship',
    'choir' => 'Music Ministry — Choir Team',
    'cell-groups' => 'Cell Groups',
    'missions-evangelism' => 'Missions & Evangelism',
    'media-team' => 'Media & ICT',
];

$config = load_mail_config();
$recipients = $config['ministry_recipients'] ?? [];

if (!isset($labels[$ministry])) {
    json_response(422, [
        'success' => false,
        'message' => 'Please select a valid ministry.',
    ]);
}

/*
 * The supplied mailbox list has no separate Teens or Missions inbox.
 * Teens therefore routes to the existing Sunday School/Children mailbox.
 * Missions & Evangelism routes to the official church mailbox.
 */
$recipient = match ($ministry) {
    'teens-ministry' => (string)($recipients['sunday-school'] ?? ''),
    'missions-evangelism' => (string)($config['official_recipient'] ?? ''),
    default => (string)($recipients[$ministry] ?? ''),
};

if ($recipient === '') {
    json_response(500, [
        'success' => false,
        'message' => 'The selected ministry is not configured for email delivery yet. Please contact the church directly.',
    ]);
}

$label = $labels[$ministry];

[$html, $text] = email_template(
    'New ' . $label . ' Registration',
    [
        'Name' => $name,
        'Phone' => $phone,
        'Email' => $email,
        'Ministry' => $label,
        'Message' => $message,
        'Submitted' => date('Y-m-d H:i:s T'),
    ],
    'This registration was routed to the ministry mailbox or church office assigned to the selected ministry.'
);

$send = static function () use (
    $recipient,
    $label,
    $name,
    $html,
    $text,
    $email
): void {
    send_church_mail(
        $recipient,
        '[Website] ' . $label . ' Registration — ' . safe_subject_piece($name),
        $html,
        $text,
        $email,
        $name
    );
};

/* Use the duplicate guard automatically if you added it to _bootstrap.php. */
if (function_exists('guard_unique_registration')) {
    guard_unique_registration(
        'ministry',
        $ministry,
        $phone,
        $email,
        'You have already registered for ' . $label . ' using this phone number and email address.',
        $send
    );
} else {
    $send();
}

json_response(200, [
    'success' => true,
    'message' => 'Your registration has been sent to the ' . $label . ' team.',
]);
